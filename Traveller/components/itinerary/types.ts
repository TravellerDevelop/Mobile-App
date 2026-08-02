/* ============================================================
   Tipi della feature "Itinerario"
   Rispecchiano Server/types/itinerary.ts: gli _id arrivano come
   stringhe dopo la serializzazione JSON.
   ============================================================ */

export type ItineraryPermissionMode = "open" | "proposal" | "admin";

export type StopCategory =
  | "visit"
  | "food"
  | "transfer"
  | "stay"
  | "event"
  | "activity"
  | "free";

export type StopStatus = "idea" | "proposed" | "confirmed" | "done" | "skipped";

export interface StopPlace {
  name: string;
  address: string;
  lat: number | null;
  lon: number | null;
  osmId?: string;
}

export interface StopChecklistItem {
  key: number;
  label: string;
  checked: boolean;
}

/** Tappa o idea: la differenza è solo il campo `day`. */
export interface Stop {
  _id: string;
  travel: string;
  creator: string;
  title: string;
  category: StopCategory;
  status: StopStatus;
  /** null = idea nel backlog */
  day: number | null;
  /** "HH:mm" oppure null ("in giornata") */
  startTime: string | null;
  /** minuti */
  duration: number | null;
  order: number;
  place: StopPlace | null;
  notes: string;
  cost: number | null;
  paymentPost: string | null;
  ticket: string | null;
  checklist: StopChecklistItem[];
  participants: string[];
  votes: string[];
  creation_date: string;
  update_date: string;
}

export interface ItineraryDay {
  index: number;
  /** "YYYY-MM-DD"; null se il viaggio non ha date */
  date: string | null;
  label: string;
}

export interface ItineraryData {
  travel: string;
  mode: ItineraryPermissionMode;
  isAdmin: boolean;
  canEdit: boolean;
  startDate: string | null;
  endDate: string | null;
  days: ItineraryDay[];
  ideas: Stop[];
  stops: Stop[];
  plannedCost: number;
  participantsCount: number;
}

/** Campi scrivibili di una tappa (payload di create/update). */
export interface StopInput {
  title: string;
  category: StopCategory;
  day?: number | null;
  startTime?: string | null;
  duration?: number | null;
  place?: StopPlace | null;
  notes?: string;
  cost?: number | null;
  ticket?: string | null;
  paymentPost?: string | null;
  checklist?: StopChecklistItem[];
  participants?: string[];
}

/** Foto pubblicate nel feed durante un giorno del viaggio. */
export interface RecapDayPhotos {
  day: number;
  label: string;
  count: number;
  preview: string[];
}

/** Riepilogo di fine viaggio (GET api/itinerary/recap). */
export interface ItineraryRecap {
  travel: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  doneCount: number;
  skippedCount: number;
  totalStops: number;
  plannedCost: number;
  spent: number;
  places: { title: string; lat: number; lon: number; status: StopStatus }[];
  photosByDay: RecapDayPhotos[];
}

export interface PlaceSearchResult {
  name: string;
  address: string;
  lat: number;
  lon: number;
  osmId: string;
}

/** Avviso di fattibilità calcolato sulla sequenza di un giorno. */
export interface DayConflict {
  /** id della tappa che non è raggiungibile in tempo */
  stopId: string;
  message: string;
}

/** Nota di trasferimento mostrata sotto una tappa. */
export interface TransferInfo {
  /** minuti stimati per raggiungere la tappa successiva */
  minutes: number;
  mode: "walk" | "drive";
  label: string;
}
