import axios from "axios";
import { serverLink } from "../../global/globalVariable";
import { apiGet, apiSend, isOfflineError } from "../../shared/data/apiClient";
import { cacheKeys } from "../../shared/data/offlineCache";
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

/* Ogni mutazione dell'itinerario invalida la copia in cache del piano:
   il piano è condiviso e la verità sta sul server (vedi useItinerary),
   quindi una cache non invalidata rimetterebbe in scena la versione
   precedente al primo caricamento senza rete. */
const invalidates = (travel: string) => [
  cacheKeys.itinerary(travel),
  cacheKeys.itineraryRecap(travel),
];

/**
 * Le mutazioni su una singola tappa non conoscono il viaggio: la coda
 * non può quindi invalidare la cache del piano per id. Non è un
 * problema — al ritorno della rete useItinerary ricarica comunque dal
 * server — ma va tenuto presente leggendo `queue` qui sotto.
 */
const stopQueue = (label: string) => ({ label });

export async function fetchItinerary(travel: string, userid: string): Promise<ItineraryData> {
  const { data } = await apiGet<ItineraryData>(
    `${base}/take?travel=${travel}&userid=${userid}`,
    { cacheKey: cacheKeys.itinerary(travel) }
  );
  return data;
}

/** Offline le mutazioni tornano `null`: sono in coda, non ancora applicate. */
export async function createStop(
  travel: string,
  userid: string,
  param: StopInput
): Promise<Stop | null> {
  const { data } = await apiSend<Stop>(
    `${base}/stop/create`,
    { travel, userid, param },
    { queue: { label: `Tappa "${param.title ?? ""}"`, invalidates: invalidates(travel) } }
  );
  return data;
}

export async function updateStop(
  id: string,
  userid: string,
  param: Partial<StopInput>
): Promise<Stop | null> {
  const { data } = await apiSend<Stop>(
    `${base}/stop/update`,
    { id, userid, param },
    { queue: stopQueue("Modifica tappa") }
  );
  return data;
}

export async function deleteStop(id: string, userid: string): Promise<void> {
  await apiSend(`${base}/stop/delete`, { id, userid }, { queue: stopQueue("Tappa eliminata") });
}

/** Sposta una tappa in un giorno; day null la riporta tra le idee. */
export async function assignStop(
  id: string,
  userid: string,
  day: number | null,
  startTime?: string | null,
  index?: number
): Promise<Stop | null> {
  const { data } = await apiSend<Stop>(
    `${base}/stop/assign`,
    { id, userid, day, startTime, index },
    { queue: stopQueue("Spostamento tappa") }
  );
  return data;
}

export async function reorderStops(
  travel: string,
  userid: string,
  day: number | null,
  order: string[]
): Promise<void> {
  await apiSend(
    `${base}/stop/reorder`,
    { travel, userid, day, order },
    { queue: { label: "Riordino tappe", invalidates: invalidates(travel) } }
  );
}

export async function updateStopStatus(
  id: string,
  userid: string,
  status: StopStatus
): Promise<Stop | null> {
  const { data } = await apiSend<Stop>(
    `${base}/stop/status`,
    { id, userid, status },
    { queue: stopQueue("Stato tappa") }
  );
  return data;
}

export async function voteStop(id: string, userid: string): Promise<Stop | null> {
  const { data } = await apiSend<Stop>(
    `${base}/stop/vote`,
    { id, userid },
    { queue: stopQueue("Voto su una tappa") }
  );
  return data;
}

export async function updateChecklist(
  id: string,
  userid: string,
  checklist: StopChecklistItem[]
): Promise<Stop | null> {
  const { data } = await apiSend<Stop>(
    `${base}/stop/checklist`,
    { id, userid, checklist },
    { queue: stopQueue("Checklist tappa") }
  );
  return data;
}

export async function updateMode(
  travel: string,
  userid: string,
  mode: ItineraryPermissionMode
): Promise<void> {
  await apiSend(
    `${base}/updateMode`,
    { travel, userid, mode },
    { queue: { label: "Permessi itinerario", invalidates: invalidates(travel) } }
  );
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
  await apiSend(
    `${base}/day/shift`,
    { travel, userid, day, minutes, fromStop },
    { queue: { label: "Orari spostati", invalidates: invalidates(travel) } }
  );
}

/** Riepilogo di fine viaggio. */
export async function fetchRecap(travel: string, userid: string): Promise<ItineraryRecap> {
  const { data } = await apiGet<ItineraryRecap>(
    `${base}/recap?travel=${travel}&userid=${userid}`,
    { cacheKey: cacheKeys.itineraryRecap(travel) }
  );
  return data;
}

/**
 * Copia le tappe di questo viaggio in un altro ("usa come modello").
 * Resta una chiamata diretta, senza coda: la UI mostra quante tappe sono
 * state copiate, e un "0 tappe copiate, forse" non direbbe nulla di utile.
 */
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
  const { data } = await apiGet<any[]>(
    `${serverLink}api/travel/takeJoined?username=${encodeURIComponent(username)}&userid=${userid}`,
    { cacheKey: cacheKeys.joinedTravels(userid) }
  );
  return data ?? [];
}

/** Biglietti dell'utente, per collegarne uno a una tappa. */
export async function fetchTickets(userid: string): Promise<any[]> {
  const { data } = await apiGet<any[]>(`${serverLink}api/tickets/take?userid=${userid}`, {
    cacheKey: cacheKeys.tickets(userid),
  });
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
  const { data } = await apiSend<any>(
    `${serverLink}api/post/create`,
    {
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
    },
    {
      queue: {
        label: `Spesa "${params.description}"`,
        invalidates: [cacheKeys.travelPosts(params.travel)],
      },
    }
  );

  // createPost risponde con il risultato di insertOne: l'id sta in insertedId.
  // Offline `data` è null (richiesta in coda) e il chiamante non ha un id da
  // collegare alla tappa: il collegamento si perde, la spesa no.
  return data?.insertedId ?? null;
}

/** Annuncia una tappa nel feed del viaggio come post di testo. */
export async function shareStopInFeed(params: {
  travel: string;
  creator: string;
  content: string;
}): Promise<void> {
  await apiSend(
    `${serverLink}api/post/create`,
    {
      param: {
        type: "text",
        pinned: false,
        creator: params.creator,
        travel: params.travel,
        content: params.content,
      },
    },
    {
      queue: {
        label: "Tappa condivisa nel feed",
        invalidates: [cacheKeys.travelPosts(params.travel)],
      },
    }
  );
}

/**
 * Ricerca luogo su OpenStreetMap, proxata dal server (User-Agent e cache).
 * Non ha senso in cache né in coda: senza rete restituiamo semplicemente
 * una lista vuota, e la UI mostra "nessun risultato".
 */
export async function searchPlace(query: string): Promise<PlaceSearchResult[]> {
  try {
    const { data } = await apiGet<PlaceSearchResult[]>(
      `${base}/searchPlace?q=${encodeURIComponent(query)}`
    );
    return data ?? [];
  } catch (error) {
    if (isOfflineError(error)) return [];
    throw error;
  }
}

/** Imposta le date del viaggio (serve alla timeline quando mancano). */
export async function updateTravelDates(
  travel: { _id: string; name: string; description: string; budget: number | string | null },
  startDate: string | null,
  endDate: string | null
): Promise<void> {
  await apiSend(`${serverLink}api/travel/update`, {
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
