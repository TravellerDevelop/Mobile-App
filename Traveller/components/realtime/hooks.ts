import { useEffect, useRef } from "react";
import realtimeClient from "./socketClient";
import {
  ItineraryChangedPayload,
  MoneyChangedPayload,
  PostDeletedPayload,
  PostNewPayload,
  PostUpdatedPayload,
  RealtimeBasePayload,
  TRAVEL_EVENTS,
  USER_EVENTS,
} from "./events";

/**
 * Hook con cui le schermate si agganciano al realtime.
 *
 * Regola generale: gli handler sono tenuti in un ref e non compaiono fra le
 * dipendenze degli effetti. Senza, una schermata che passa una arrow
 * function inline (cioè tutte) si disiscriverebbe e riiscriverebbe a ogni
 * render, e con essa uscirebbe e rientrerebbe nella stanza del viaggio.
 */

/** Mantiene aggiornato il valore corrente senza farne una dipendenza. */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

// ======================================================================
// Viaggio
// ======================================================================

export interface TravelRealtimeHandlers {
  /** Nuovo post nel feed. `post` è null se va ricaricato tutto. */
  onPostNew?: (payload: PostNewPayload) => void;
  onPostUpdated?: (payload: PostUpdatedPayload) => void;
  onPostDeleted?: (payload: PostDeletedPayload) => void;
  onItineraryChanged?: (payload: ItineraryChangedPayload) => void;
  onTravelUpdated?: (payload: RealtimeBasePayload) => void;
}

export interface TravelRealtimeOptions {
  /**
   * Id dell'utente corrente. Se valorizzato, gli eventi generati da lui
   * stesso vengono scartati: l'app ha già applicato la modifica in locale
   * (o l'ha ricevuta nella response REST) e riapplicarla significa, nel
   * caso dei post, vederne comparire due.
   */
  currentUserId?: string | null;
  /** Permette di sospendere l'iscrizione senza smontare la schermata. */
  enabled?: boolean;
}

/**
 * Iscrive la schermata agli eventi di uno o più viaggi.
 *
 * `travelIds` può essere un singolo id (dettaglio viaggio) o una lista
 * (feed home, che aggrega i post di tutti i viaggi dell'utente).
 */
export function useTravelRealtime(
  travelIds: string | string[] | null | undefined,
  handlers: TravelRealtimeHandlers,
  options: TravelRealtimeOptions = {}
): void {
  const { currentUserId, enabled = true } = options;

  const handlersRef = useLatest(handlers);
  const userIdRef = useLatest(currentUserId);

  // Normalizzata a stringa: un array nuovo a ogni render (`[travel._id]`)
  // farebbe rientrare l'effetto in continuazione se lo si mettesse fra le
  // dipendenze così com'è.
  const ids = Array.isArray(travelIds) ? travelIds : travelIds ? [travelIds] : [];
  const key = ids.filter(Boolean).join(",");

  // Stanze
  useEffect(() => {
    if (!enabled || !key) return;
    const list = key.split(",");
    for (const id of list) realtimeClient.joinTravel(id);
    return () => {
      for (const id of list) realtimeClient.leaveTravel(id);
    };
  }, [key, enabled]);

  // Eventi
  useEffect(() => {
    if (!enabled || !key) return;
    const subscribed = new Set(key.split(","));

    /** Scarta gli eventi di altri viaggi e quelli generati da noi stessi. */
    const accept = (payload: { travelId?: string; actorId?: string }): boolean => {
      if (!payload?.travelId || !subscribed.has(payload.travelId)) return false;
      const me = userIdRef.current;
      if (me && payload.actorId && payload.actorId === me) return false;
      return true;
    };

    const unsubscribers = [
      realtimeClient.on(TRAVEL_EVENTS.POST_NEW, (payload: PostNewPayload) => {
        if (accept(payload)) handlersRef.current.onPostNew?.(payload);
      }),
      realtimeClient.on(TRAVEL_EVENTS.POST_UPDATED, (payload: PostUpdatedPayload) => {
        if (accept(payload)) handlersRef.current.onPostUpdated?.(payload);
      }),
      realtimeClient.on(TRAVEL_EVENTS.POST_DELETED, (payload: PostDeletedPayload) => {
        if (accept(payload)) handlersRef.current.onPostDeleted?.(payload);
      }),
      realtimeClient.on(TRAVEL_EVENTS.ITINERARY_CHANGED, (payload: ItineraryChangedPayload) => {
        if (accept(payload)) handlersRef.current.onItineraryChanged?.(payload);
      }),
      realtimeClient.on(TRAVEL_EVENTS.TRAVEL_UPDATED, (payload: RealtimeBasePayload) => {
        if (accept(payload)) handlersRef.current.onTravelUpdated?.(payload);
      }),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, [key, enabled]);
}

// ======================================================================
// Utente
// ======================================================================

/**
 * Iscrive la schermata a un evento della stanza personale (Money, ticket,
 * elenco viaggi). Non serve nessun join: la stanza personale viene aperta
 * dal server all'handshake.
 */
export function useUserRealtime(
  event: string,
  handler: (payload: any) => void,
  enabled = true
): void {
  const handlerRef = useLatest(handler);

  useEffect(() => {
    if (!enabled) return;
    return realtimeClient.on(event, (payload) => handlerRef.current(payload));
  }, [event, enabled]);
}

/** Scorciatoia: il riepilogo Money dell'utente non è più valido. */
export function useMoneyRealtime(handler: (payload: MoneyChangedPayload) => void, enabled = true) {
  useUserRealtime(USER_EVENTS.MONEY_CHANGED, handler, enabled);
}

/** Scorciatoia: i biglietti dell'utente sono cambiati. */
export function useTicketsRealtime(handler: () => void, enabled = true) {
  useUserRealtime(USER_EVENTS.TICKETS_CHANGED, handler, enabled);
}

/** Scorciatoia: l'elenco viaggi dell'utente è cambiato. */
export function useTravelsListRealtime(handler: () => void, enabled = true) {
  useUserRealtime(USER_EVENTS.TRAVELS_CHANGED, handler, enabled);
}
