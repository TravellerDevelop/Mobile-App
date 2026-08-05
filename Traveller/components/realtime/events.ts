/**
 * Contratto degli eventi realtime — copia client.
 *
 * Gemello di `Server/types/realtime.ts`. I due progetti sono repo separate,
 * quindi l'allineamento è manuale: se cambi un nome di evento di là,
 * cambialo anche qui. Le costanti esistono proprio per questo — un nome
 * scritto a mano in una schermata romperebbe il realtime in silenzio, senza
 * errori né in compilazione né a runtime.
 */

/** Eventi che il server manda alla stanza di un viaggio. */
export const TRAVEL_EVENTS = {
  POST_NEW: "travel:post:new",
  POST_UPDATED: "travel:post:updated",
  POST_DELETED: "travel:post:deleted",
  ITINERARY_CHANGED: "travel:itinerary:changed",
  TRAVEL_UPDATED: "travel:updated",
  PARTICIPANTS_CHANGED: "travel:participants:changed",
} as const;

/** Eventi che il server manda alla stanza personale dell'utente. */
export const USER_EVENTS = {
  NOTIFICATION: "notification",
  MONEY_CHANGED: "user:money:changed",
  TICKETS_CHANGED: "user:tickets:changed",
  TRAVELS_CHANGED: "user:travels:changed",
} as const;

/** Eventi che il client manda al server. */
export const CLIENT_EVENTS = {
  JOIN_TRAVEL: "travel:join",
  LEAVE_TRAVEL: "travel:leave",
} as const;

export type TravelEventName = (typeof TRAVEL_EVENTS)[keyof typeof TRAVEL_EVENTS];
export type UserEventName = (typeof USER_EVENTS)[keyof typeof USER_EVENTS];
export type RealtimeEventName = TravelEventName | UserEventName;

// ======================================================================
// Payload
// ======================================================================

export interface RealtimeBasePayload {
  travelId: string;
  /** Chi ha causato l'evento: serve a ignorare i propri. */
  actorId?: string;
}

export interface PostNewPayload extends RealtimeBasePayload {
  /**
   * Post già nella forma restituita da `api/post/takePosts`.
   * `null` se il server non è riuscito a rileggerlo: in quel caso il
   * significato è "ricarica il feed".
   */
  post: unknown | null;
}

export interface PostUpdatedPayload extends RealtimeBasePayload {
  /** `null` = molti post toccati insieme, ricarica tutto. */
  postId: string | null;
  reason: "vote" | "payment" | "pin" | "todo" | "other";
}

export interface PostDeletedPayload extends RealtimeBasePayload {
  postId: string;
}

export interface ItineraryChangedPayload extends RealtimeBasePayload {
  action: string;
  stopId?: string;
  day?: number | null;
}

export interface MoneyChangedPayload {
  travelId?: string;
  actorId?: string;
}
