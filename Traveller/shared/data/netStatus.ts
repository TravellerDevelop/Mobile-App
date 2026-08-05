/* ============================================================
   Traveller — Stato della connessione

   Nessuna dipendenza nativa (niente NetInfo, quindi niente nuova dev
   build): lo stato "offline" si deduce dalle chiamate che l'app fa
   comunque. Un errore axios senza `response` significa che la
   richiesta non è mai arrivata al server (DNS, timeout, aereo,
   server giù); una risposta qualsiasi — anche un 500 — significa che
   la rete c'è.

   Quando siamo offline parte un ping periodico su `api/verifyConnection`
   (l'endpoint che prima bloccava l'avvio dell'app) per accorgersi del
   ritorno della rete anche se l'utente non tocca nulla.

   È un modulo, non un context, perché lo usano anche i moduli `api.ts`
   (money, itinerary, notifiche...) che non sono componenti React.
   ============================================================ */

import axios from "axios";
import { serverLink } from "../../global/globalVariable";

type Listener = (online: boolean) => void;

/* Ottimisti all'avvio: la prima richiesta corregge il valore in meno di
   un secondo. Partire da "offline" farebbe lampeggiare il banner a ogni
   apertura dell'app anche con la rete perfettamente funzionante. */
let online = true;
let lastChangeAt: number | null = null;
let listeners: Listener[] = [];
let pingTimer: ReturnType<typeof setInterval> | null = null;

/** Intervallo del ping mentre siamo offline. */
const PING_INTERVAL_MS = 15000;
const PING_TIMEOUT_MS = 8000;

export function isOnline(): boolean {
  return online;
}

export function lastStatusChange(): number | null {
  return lastChangeAt;
}

export function subscribeNetStatus(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

function setOnline(next: boolean) {
  if (online === next) return;

  online = next;
  lastChangeAt = Date.now();

  if (next) stopPinging();
  else startPinging();

  for (const listener of [...listeners]) {
    try {
      listener(next);
    } catch (error) {
      console.warn("Listener stato rete", error);
    }
  }
}

/** Da chiamare quando una richiesta ha ricevuto una risposta dal server. */
export function markOnline(): void {
  setOnline(true);
}

/** Da chiamare quando una richiesta è fallita senza risposta. */
export function markOffline(): void {
  setOnline(false);
}

/**
 * Vero se l'errore è di rete (richiesta mai arrivata a destinazione) e
 * non un errore applicativo: un 401 o un 500 NON sono "offline", e
 * trattarli come tali farebbe comparire il banner con la rete attiva.
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  if (axios.isAxiosError(error)) {
    if (error.response) return false;
    // ERR_NETWORK, ECONNABORTED (timeout), ERR_CANCELED escluso a parte
    return error.code !== "ERR_CANCELED";
  }

  return false;
}

/** Interroga il server; aggiorna lo stato e restituisce l'esito. */
export async function pingServer(): Promise<boolean> {
  try {
    await axios.get(serverLink + "api/verifyConnection", { timeout: PING_TIMEOUT_MS });
    markOnline();
    return true;
  } catch (error) {
    if (isNetworkError(error)) markOffline();
    else markOnline(); // il server ha risposto qualcosa: la rete c'è
    return isOnline();
  }
}

function startPinging() {
  if (pingTimer) return;
  pingTimer = setInterval(() => {
    void pingServer();
  }, PING_INTERVAL_MS);
}

function stopPinging() {
  if (!pingTimer) return;
  clearInterval(pingTimer);
  pingTimer = null;
}

/** Solo per i test: riporta il modulo allo stato iniziale. */
export function resetNetStatusForTests(): void {
  online = true;
  lastChangeAt = null;
  listeners = [];
  stopPinging();
}
