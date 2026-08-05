/* ============================================================
   Traveller — Client REST con cache e coda offline

   Unico punto in cui l'app decide cosa fare quando il server non
   risponde. Prima ogni call site aveva il suo `.then/.catch` e, non
   avendo nulla da mostrare, lasciava la schermata sugli scheletri di
   caricamento; l'unica difesa era il gate di connessione in App.tsx,
   che però impediva di aprire l'app anche solo per guardare i dati
   già scaricati.

   Regole:
   - `apiGet` restituisce sempre qualcosa se c'è una cache, e segnala
     con `fromCache`/`savedAt` quanto è vecchia.
   - `apiSend` (POST) offline mette l'operazione in coda quando il
     chiamante lo consente (`queue`), altrimenti lancia OfflineError:
     alcune operazioni — upload di immagini, join di un viaggio,
     login — non hanno senso differite.
   ============================================================ */

import axios, { AxiosRequestConfig } from "axios";
import { isNetworkError, isOnline, markOffline, markOnline } from "./netStatus";
import { CacheEntry, readCache, removeCacheKeys, writeCache } from "./offlineCache";
import { enqueueMutation } from "./syncQueue";

/** Timeout più corto quando sappiamo già di essere offline. */
const TIMEOUT_ONLINE_MS = 15000;
const TIMEOUT_OFFLINE_MS = 6000;

/** Errore "sei offline e non ho niente da mostrarti / da fare". */
export class OfflineError extends Error {
  readonly offline = true;

  constructor(message = "Sei offline: questa operazione richiede una connessione.") {
    super(message);
    this.name = "OfflineError";
  }
}

export function isOfflineError(error: unknown): error is OfflineError {
  return Boolean(error) && (error as OfflineError).offline === true;
}

export interface CachedResult<T> {
  data: T;
  /** true se il dato arriva dalla cache locale e non dal server. */
  fromCache: boolean;
  /** Quando il dato è stato scaricato (null se appena arrivato dal server). */
  savedAt: number | null;
}

export interface ApiGetOptions<T> {
  /** Chiave di `cacheKeys`. Senza chiave la richiesta non viene mai memorizzata. */
  cacheKey?: string;
  timeout?: number;
  /**
   * Trasformazione applicata prima di salvare in cache: serve quando la
   * schermata rimodella la risposta (es. i post, con le date formattate).
   * Salvare il dato già trasformato evita di dover rieseguire la
   * trasformazione sul ramo "letto dalla cache" e di sbagliarla in uno dei due.
   */
  transform?: (data: any) => T;
}

/**
 * GET con fallback su cache. Non lancia se esiste una copia locale.
 *
 * @throws OfflineError se non c'è rete e nemmeno una copia in cache.
 * @throws l'errore axios originale per gli errori applicativi (4xx/5xx):
 *         quelli il chiamante li deve vedere.
 */
export async function apiGet<T>(url: string, options: ApiGetOptions<T> = {}): Promise<CachedResult<T>> {
  const { cacheKey, transform } = options;
  const timeout = options.timeout ?? (isOnline() ? TIMEOUT_ONLINE_MS : TIMEOUT_OFFLINE_MS);

  try {
    const response = await axios.get(url, { timeout });
    markOnline();

    const data = (transform ? transform(response.data) : response.data) as T;
    if (cacheKey) await writeCache(cacheKey, data);

    return { data, fromCache: false, savedAt: null };
  } catch (error) {
    if (!isNetworkError(error)) throw error;

    markOffline();

    if (cacheKey) {
      const cached = (await readCache<T>(cacheKey)) as CacheEntry<T> | null;
      if (cached) return { data: cached.data, fromCache: true, savedAt: cached.savedAt };
    }

    throw new OfflineError();
  }
}

/** Legge solo la cache, senza toccare la rete (utile per un primo render immediato). */
export async function readCached<T>(cacheKey: string): Promise<CachedResult<T> | null> {
  const cached = await readCache<T>(cacheKey);
  if (!cached) return null;
  return { data: cached.data, fromCache: true, savedAt: cached.savedAt };
}

export interface QueueSpec {
  /** Etichetta mostrata all'utente nel banner ("Nuovo post"). */
  label: string;
  /** Chiavi di cache da invalidare dopo l'invio riuscito. */
  invalidates?: string[];
}

export interface ApiSendOptions {
  /** Se presente, offline l'operazione viene messa in coda invece di fallire. */
  queue?: QueueSpec;
  /** Chiavi di cache invalidate subito, quando la richiesta riesce online. */
  invalidates?: string[];
  timeout?: number;
  config?: AxiosRequestConfig;
}

export interface SendResult<T> {
  /** Risposta del server, null se l'operazione è stata messa in coda. */
  data: T | null;
  /** true se l'operazione partirà al ritorno della rete. */
  queued: boolean;
}

/**
 * POST con coda offline.
 *
 * Attenzione al ramo `queued`: il chiamante non riceve la risposta del
 * server (id generati, valori ricalcolati) perché la richiesta non è
 * ancora partita. Le schermate che si limitano a ricaricare dopo la
 * mutazione devono quindi mostrare un messaggio "verrà inviato al
 * ritorno della rete" invece di aspettarsi il dato aggiornato.
 */
export async function apiSend<T = any>(
  url: string,
  body: unknown,
  options: ApiSendOptions = {}
): Promise<SendResult<T>> {
  const timeout = options.timeout ?? (isOnline() ? TIMEOUT_ONLINE_MS : TIMEOUT_OFFLINE_MS);

  try {
    const response = await axios.post<T>(url, body, { timeout, ...options.config });
    markOnline();

    const invalidates = options.invalidates ?? options.queue?.invalidates ?? [];
    if (invalidates.length > 0) await removeCacheKeys(invalidates);

    return { data: response.data, queued: false };
  } catch (error) {
    if (!isNetworkError(error)) throw error;

    markOffline();

    if (!options.queue) throw new OfflineError();

    await enqueueMutation({
      url,
      body,
      label: options.queue.label,
      invalidates: options.queue.invalidates ?? [],
    });

    return { data: null, queued: true };
  }
}
