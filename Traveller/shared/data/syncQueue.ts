/* ============================================================
   Traveller — Coda delle scritture fatte offline

   Le POST partite mentre non c'era rete non vengono perse: finiscono
   in una coda FIFO persistita su AsyncStorage e vengono rigiocate, in
   ordine, appena il server torna raggiungibile (al ritorno della rete,
   al rientro dell'app in primo piano o su richiesta dell'utente dal
   banner offline).

   Due invarianti che vale la pena tenere a mente:

   1. L'ordine conta. Le operazioni dell'itinerario e i pagamenti si
      riferiscono l'una allo stato lasciato dall'altra, quindi il flush
      è sequenziale e si ferma al primo errore di rete, lasciando in
      coda tutto il resto.
   2. La coda non deve poter restare bloccata. Un elemento che il
      server rifiuta (dato non più valido, permesso revocato, tappa
      cancellata da qualcun altro nel frattempo) viene ritentato al
      massimo MAX_ATTEMPTS volte e poi spostato fra gli "scartati",
      altrimenti bloccherebbe per sempre tutte le operazioni successive.
   ============================================================ */

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { isNetworkError, isOnline, markOffline, markOnline } from "./netStatus";
import { removeCacheKeys } from "./offlineCache";

const QUEUE_KEY = "sync:queue:v1";
const DROPPED_KEY = "sync:dropped:v1";

/** Oltre questa soglia l'elemento viene scartato (vedi invariante 2). */
const MAX_ATTEMPTS = 3;

export interface QueuedMutation {
  id: string;
  /** URL assoluto, già completo di serverLink. */
  url: string;
  body: unknown;
  /** Testo mostrato all'utente ("Nuovo post", "Spesa", ...). */
  label: string;
  createdAt: number;
  attempts: number;
  /** Chiavi di cache da invalidare quando la richiesta va a buon fine. */
  invalidates: string[];
}

export interface DroppedMutation extends QueuedMutation {
  droppedAt: number;
  reason: string;
}

type QueueListener = (queue: QueuedMutation[]) => void;

let listeners: QueueListener[] = [];
let flushing = false;
/* Cache in memoria: il banner legge la lunghezza della coda a ogni
   render e non deve toccare AsyncStorage per farlo. */
let cachedQueue: QueuedMutation[] | null = null;

export function subscribeQueue(listener: QueueListener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

function notify(queue: QueuedMutation[]) {
  cachedQueue = queue;
  for (const listener of [...listeners]) {
    try {
      listener(queue);
    } catch (error) {
      console.warn("Listener coda offline", error);
    }
  }
}

async function persist(queue: QueuedMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn("Impossibile salvare la coda offline", error);
  }
  notify(queue);
}

export async function readQueue(): Promise<QueuedMutation[]> {
  if (cachedQueue) return cachedQueue;

  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed = raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
    cachedQueue = Array.isArray(parsed) ? parsed : [];
  } catch {
    cachedQueue = [];
  }
  return cachedQueue;
}

/** Lunghezza nota senza toccare lo storage (0 finché non si è letto). */
export function queueLengthSync(): number {
  return cachedQueue?.length ?? 0;
}

/** Carica la coda dallo storage e avvisa i listener: da fare all'avvio. */
export async function hydrateQueue(): Promise<QueuedMutation[]> {
  const queue = await readQueue();
  notify(queue);
  return queue;
}

export async function enqueueMutation(
  mutation: Omit<QueuedMutation, "id" | "createdAt" | "attempts">
): Promise<QueuedMutation> {
  const queue = await readQueue();
  const entry: QueuedMutation = {
    ...mutation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    attempts: 0,
  };

  await persist([...queue, entry]);
  return entry;
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await readQueue();
  await persist(queue.filter((item) => item.id !== id));
}

export async function clearQueue(): Promise<void> {
  await persist([]);
}

/* ------------------------------------------------------------
   Elementi scartati: restano leggibili per poterli mostrare
   all'utente ("2 azioni non sono state inviate").
   ------------------------------------------------------------ */

export async function readDropped(): Promise<DroppedMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(DROPPED_KEY);
    const parsed = raw ? (JSON.parse(raw) as DroppedMutation[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function addDropped(mutation: QueuedMutation, reason: string): Promise<void> {
  try {
    const dropped = await readDropped();
    // Ne teniamo al massimo 20: è un registro per l'utente, non uno storico.
    const next = [...dropped, { ...mutation, droppedAt: Date.now(), reason }].slice(-20);
    await AsyncStorage.setItem(DROPPED_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Impossibile registrare l'operazione scartata", error);
  }
}

export async function clearDropped(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DROPPED_KEY);
  } catch {
    /* non bloccante */
  }
}

export interface FlushResult {
  sent: number;
  dropped: number;
  /** Elementi rimasti in coda (rete caduta di nuovo a metà flush). */
  remaining: number;
}

/**
 * Invia la coda, in ordine, fermandosi al primo errore di rete.
 * Rientrante: due chiamate concorrenti (banner + ritorno della rete)
 * non devono spedire due volte la stessa operazione.
 */
export async function flushQueue(): Promise<FlushResult> {
  if (flushing) {
    const queue = await readQueue();
    return { sent: 0, dropped: 0, remaining: queue.length };
  }

  flushing = true;
  let sent = 0;
  let dropped = 0;

  try {
    let queue = await readQueue();

    while (queue.length > 0) {
      const [current, ...rest] = queue;

      try {
        await axios.post(current.url, current.body, { timeout: 20000 });
        markOnline();

        if (current.invalidates.length > 0) await removeCacheKeys(current.invalidates);

        queue = rest;
        await persist(queue);
        sent += 1;
      } catch (error) {
        if (isNetworkError(error)) {
          // Rete di nuovo assente: la coda resta intatta, si riprova dopo.
          markOffline();
          break;
        }

        // Il server ha risposto un errore: ritentiamo qualche volta
        // (può essere un 503 temporaneo) e poi scartiamo, per non
        // bloccare tutte le operazioni successive.
        markOnline();
        const attempts = current.attempts + 1;

        if (attempts >= MAX_ATTEMPTS) {
          const reason = axios.isAxiosError(error)
            ? `HTTP ${error.response?.status ?? "?"}`
            : "errore sconosciuto";
          await addDropped({ ...current, attempts }, reason);
          queue = rest;
          dropped += 1;
        } else {
          queue = [{ ...current, attempts }, ...rest];
        }

        await persist(queue);
        if (attempts < MAX_ATTEMPTS) break; // riprova al prossimo giro
      }
    }

    return { sent, dropped, remaining: queue.length };
  } finally {
    flushing = false;
  }
}

/** Prova a svuotare la coda solo se ha senso (rete presente e roba dentro). */
export async function flushQueueIfPossible(): Promise<FlushResult | null> {
  if (!isOnline()) return null;
  const queue = await readQueue();
  if (queue.length === 0) return null;
  return flushQueue();
}

/** Solo per i test. */
export function resetQueueForTests(): void {
  listeners = [];
  cachedQueue = null;
  flushing = false;
}
