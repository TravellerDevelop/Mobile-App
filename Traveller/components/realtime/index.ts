/**
 * Canale realtime dell'app.
 *
 * - `RealtimeProvider` apre/chiude la connessione seguendo la sessione;
 *   va montato una volta sola, in App.tsx.
 * - Gli hook sono l'unica interfaccia per le schermate.
 * - `socketClient` è esposto per i casi fuori da React (rari): le schermate
 *   non dovrebbero usarlo direttamente.
 */
export { RealtimeProvider, useRealtimeState } from "./RealtimeProvider";
export {
  useTravelRealtime,
  useUserRealtime,
  useMoneyRealtime,
  useTicketsRealtime,
  useTravelsListRealtime,
} from "./hooks";
export { TRAVEL_EVENTS, USER_EVENTS, CLIENT_EVENTS } from "./events";
export type {
  PostNewPayload,
  PostUpdatedPayload,
  PostDeletedPayload,
  ItineraryChangedPayload,
  MoneyChangedPayload,
  RealtimeBasePayload,
} from "./events";
export { default as socketClient } from "./socketClient";
