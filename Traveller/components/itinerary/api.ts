import axios from "axios";
import { serverLink } from "../../global/globalVariable";
import type {
  ItineraryData,
  ItineraryPermissionMode,
  ItineraryRecap,
  PlaceSearchResult,
  Stop,
  StopChecklistItem,
  StopInput,
  StopStatus,
} from "./types";

/* ============================================================
   Chiamate REST dell'itinerario.
   Un solo punto di costruzione degli URL, così le schermate non
   ripetono serverLink + querystring come nel resto dell'app.
   ============================================================ */

const base = `${serverLink}api/itinerary`;

export async function fetchItinerary(travel: string, userid: string): Promise<ItineraryData> {
  const { data } = await axios.get<ItineraryData>(
    `${base}/take?travel=${travel}&userid=${userid}`
  );
  return data;
}

export async function createStop(
  travel: string,
  userid: string,
  param: StopInput
): Promise<Stop> {
  const { data } = await axios.post<Stop>(`${base}/stop/create`, { travel, userid, param });
  return data;
}

export async function updateStop(
  id: string,
  userid: string,
  param: Partial<StopInput>
): Promise<Stop> {
  const { data } = await axios.post<Stop>(`${base}/stop/update`, { id, userid, param });
  return data;
}

export async function deleteStop(id: string, userid: string): Promise<void> {
  await axios.post(`${base}/stop/delete`, { id, userid });
}

/** Sposta una tappa in un giorno; day null la riporta tra le idee. */
export async function assignStop(
  id: string,
  userid: string,
  day: number | null,
  startTime?: string | null,
  index?: number
): Promise<Stop> {
  const { data } = await axios.post<Stop>(`${base}/stop/assign`, {
    id,
    userid,
    day,
    startTime,
    index,
  });
  return data;
}

export async function reorderStops(
  travel: string,
  userid: string,
  day: number | null,
  order: string[]
): Promise<void> {
  await axios.post(`${base}/stop/reorder`, { travel, userid, day, order });
}

export async function updateStopStatus(
  id: string,
  userid: string,
  status: StopStatus
): Promise<Stop> {
  const { data } = await axios.post<Stop>(`${base}/stop/status`, { id, userid, status });
  return data;
}

export async function voteStop(id: string, userid: string): Promise<Stop> {
  const { data } = await axios.post<Stop>(`${base}/stop/vote`, { id, userid });
  return data;
}

export async function updateChecklist(
  id: string,
  userid: string,
  checklist: StopChecklistItem[]
): Promise<Stop> {
  const { data } = await axios.post<Stop>(`${base}/stop/checklist`, { id, userid, checklist });
  return data;
}

export async function updateMode(
  travel: string,
  userid: string,
  mode: ItineraryPermissionMode
): Promise<void> {
  await axios.post(`${base}/updateMode`, { travel, userid, mode });
}

/**
 * "Siamo in ritardo": slitta di N minuti gli orari del giorno a partire
 * da una tappa (le tappe già fatte o saltate non vengono toccate).
 */
export async function shiftDay(
  travel: string,
  userid: string,
  day: number,
  minutes: number,
  fromStop?: string | null
): Promise<void> {
  await axios.post(`${base}/day/shift`, { travel, userid, day, minutes, fromStop });
}

/** Riepilogo di fine viaggio. */
export async function fetchRecap(travel: string, userid: string): Promise<ItineraryRecap> {
  const { data } = await axios.get<ItineraryRecap>(
    `${base}/recap?travel=${travel}&userid=${userid}`
  );
  return data;
}

/** Copia le tappe di questo viaggio in un altro ("usa come modello"). */
export async function duplicateItinerary(
  sourceTravel: string,
  targetTravel: string,
  userid: string
): Promise<{ copied: number }> {
  const { data } = await axios.post<{ copied: number }>(`${base}/duplicate`, {
    sourceTravel,
    targetTravel,
    userid,
  });
  return data;
}

/** Viaggi aperti dell'utente: servono come destinazione della copia. */
export async function fetchJoinedTravels(username: string, userid: string): Promise<any[]> {
  const { data } = await axios.get<any[]>(
    `${serverLink}api/travel/takeJoined?username=${encodeURIComponent(username)}&userid=${userid}`
  );
  return data ?? [];
}

/** Biglietti dell'utente, per collegarne uno a una tappa. */
export async function fetchTickets(userid: string): Promise<any[]> {
  const { data } = await axios.get<any[]>(`${serverLink}api/tickets/take?userid=${userid}`);
  return data ?? [];
}

/**
 * Crea la spesa collegata a una tappa come normale post di tipo "payments":
 * così compare nel feed e nei conteggi di Money senza logiche parallele.
 */
export async function createStopPayment(params: {
  travel: string;
  creator: string;
  amount: number;
  description: string;
  destinators: string[];
}): Promise<string | null> {
  const { data } = await axios.post<any>(`${serverLink}api/post/create`, {
    param: {
      type: "payments",
      pinned: false,
      creator: params.creator,
      travel: params.travel,
      amount: params.amount,
      description: params.description,
      paymentType: "normal",
      destinator: params.destinators.map((userid) => ({ userid, payed: false })),
    },
  });

  // createPost risponde con il risultato di insertOne: l'id sta in insertedId.
  return data?.insertedId ?? null;
}

/** Annuncia una tappa nel feed del viaggio come post di testo. */
export async function shareStopInFeed(params: {
  travel: string;
  creator: string;
  content: string;
}): Promise<void> {
  await axios.post(`${serverLink}api/post/create`, {
    param: {
      type: "text",
      pinned: false,
      creator: params.creator,
      travel: params.travel,
      content: params.content,
    },
  });
}

/** Ricerca luogo su OpenStreetMap, proxata dal server (User-Agent e cache). */
export async function searchPlace(query: string): Promise<PlaceSearchResult[]> {
  const { data } = await axios.get<PlaceSearchResult[]>(
    `${base}/searchPlace?q=${encodeURIComponent(query)}`
  );
  return data ?? [];
}

/** Imposta le date del viaggio (serve alla timeline quando mancano). */
export async function updateTravelDates(
  travel: { _id: string; name: string; description: string; budget: number | string | null },
  startDate: string | null,
  endDate: string | null
): Promise<void> {
  await axios.post(`${serverLink}api/travel/update`, {
    id: travel._id,
    param: {
      name: travel.name,
      description: travel.description,
      budget: travel.budget,
      startDate,
      endDate,
    },
  });
}
