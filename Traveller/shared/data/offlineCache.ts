/* ============================================================
   Traveller — Cache locale delle risposte del server

   Ogni GET che alimenta una schermata viene salvata su AsyncStorage
   insieme al momento in cui è arrivata: senza rete la schermata mostra
   l'ultima versione conosciuta invece di una lista vuota (o, come
   prima, invece della pagina "server non raggiungibile" che bloccava
   tutta l'app all'avvio).

   Le chiavi passano SEMPRE da `cacheKeys`: sono usate in due posti
   distanti fra loro (chi legge e chi invalida dopo una scrittura), e
   una stringa scritta a mano in uno dei due punti è un bug silenzioso
   — la cache non verrebbe mai invalidata.
   ============================================================ */

import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "cache:v1:";

export interface CacheEntry<T> {
  /** Epoch ms in cui la risposta è arrivata dal server. */
  savedAt: number;
  data: T;
}

/** Legge una voce di cache; null se assente o illeggibile. */
export async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.savedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Salva (o sovrascrive) una voce di cache. Non lancia mai. */
export async function writeCache<T>(key: string, data: T): Promise<CacheEntry<T>> {
  const entry: CacheEntry<T> = { savedAt: Date.now(), data };
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage pieno o non disponibile: la cache è un'ottimizzazione,
    // non deve mai far fallire la richiesta che l'ha generata.
  }
  return entry;
}

export async function removeCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {
    /* vedi sopra */
  }
}

export async function removeCacheKeys(keys: string[]): Promise<void> {
  await Promise.all(keys.map(removeCache));
}

/**
 * Svuota tutta la cache. Va chiamata al logout: i dati in cache sono
 * quelli di un account preciso e non devono restare leggibili al
 * prossimo utente che entra sullo stesso dispositivo.
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((key) => key.startsWith(PREFIX));
    if (ours.length > 0) await AsyncStorage.multiRemove(ours);
  } catch {
    /* vedi sopra */
  }
}

/* ------------------------------------------------------------
   Chiavi di cache
   ------------------------------------------------------------ */

export const cacheKeys = {
  /** Viaggi a cui l'utente partecipa (home + schermata "I miei viaggi"). */
  joinedTravels: (userId: string) => `joinedTravels:${userId}`,
  /** Ultimi post di tutti i viaggi (feed della home). */
  homeFeed: (userId: string) => `homeFeed:${userId}`,
  /** Post di un singolo viaggio. */
  travelPosts: (travelId: string) => `travelPosts:${travelId}`,
  /** Totale speso dall'utente in un viaggio. */
  travelSpent: (travelId: string, userId: string) => `travelSpent:${travelId}:${userId}`,
  /** Partecipanti di un viaggio. */
  travelParticipants: (travelId: string) => `travelParticipants:${travelId}`,
  /** Biglietti dell'utente. */
  tickets: (userId: string) => `tickets:${userId}`,
  /** Riepilogo della sezione Money. */
  moneyOverview: (userId: string) => `moneyOverview:${userId}`,
  /** Itinerario di un viaggio. */
  itinerary: (travelId: string) => `itinerary:${travelId}`,
  /** Resoconto di fine viaggio. */
  itineraryRecap: (travelId: string) => `itineraryRecap:${travelId}`,
  /** Prima pagina del centro notifiche. */
  notifications: (userId: string) => `notifications:${userId}`,
  /** Preferenze notifiche (catalogo + scelte utente). */
  notificationPreferences: (userId: string) => `notificationPreferences:${userId}`,
  /** Richieste di follow in sospeso. */
  followRequests: (userId: string) => `followRequests:${userId}`,
  /** Profilo pubblico di un altro utente. */
  profile: (userId: string) => `profile:${userId}`,
  /** Statistiche del proprio profilo. */
  profileStats: (userId: string) => `profileStats:${userId}`,
  /** Nomi utente risolti da una lista di id (usati nei pagamenti). */
  usernames: (scope: string) => `usernames:${scope}`,
};

/** Etichette leggibili per la UI ("dati aggiornati a ..."). */
export function formatSavedAt(savedAt: number | null): string {
  if (!savedAt) return "mai";

  const date = new Date(savedAt);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return time;

  return `${date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })} ${time}`;
}
