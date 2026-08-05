/**
 * Deep-link da una notifica alla schermata giusta.
 *
 * Due complicazioni, entrambe preesistenti:
 *
 * 1. L'app ha DUE NavigationContainer (App.tsx per la tab bar, e quello
 *    `independent` di routes/NotificationStack.js montato dentro il tab
 *    Home): una route dello stack annidato non è raggiungibile dal
 *    navigator radice, quindi servono due ref e due salti.
 *
 * 2. Le schermate vogliono OGGETTI, non id: TravelDetail prende
 *    `{ data: travel, username }`, PaymentInfo prende `{ item: post }`,
 *    ItineraryStopDetail prende `{ stopId, travel }`. Il server, che gli
 *    oggetti non può serializzarli dentro una push, manda solo gli id:
 *    è qui che vengono "idratati" prima di navigare.
 *
 * Se l'idratazione fallisce (viaggio eliminato, rete assente) si resta
 * dove si è invece di far crashare la schermata di destinazione con
 * `route.params.data` undefined.
 */

import axios from "axios";
import { createNavigationContainerRef } from "@react-navigation/native";
import { serverLink } from "../../global/globalVariable";
import { getData } from "../../shared/data/localdata";
import { NotificationTarget } from "./types";

/** Navigator radice (tab bar), definito in App.tsx. */
export const rootNavigationRef = createNavigationContainerRef<any>();

/**
 * Navigator annidato sotto il tab Home. Non può usare
 * createNavigationContainerRef "condiviso": è un container indipendente,
 * quindi tiene un suo ref, registrato da routes/NotificationStack.js.
 */
export const homeNavigationRef = createNavigationContainerRef<any>();

/** Route che vivono nel tab navigator radice invece che nello stack di Home. */
const ROOT_ROUTES = ["Home", "Tickets", "Money", "TicketsModal"];

interface TargetParams {
  travelId?: string;
  postId?: string;
  stopId?: string;
  userId?: string;
  day?: number;
  [key: string]: any;
}

/** Il viaggio completo, cercato tra quelli a cui l'utente partecipa. */
async function loadTravel(travelId: string): Promise<any | null> {
  try {
    const user = await getData("user");
    if (!user?._id) return null;

    const { data } = await axios.get<any[]>(
      `${serverLink}api/travel/takeJoined?username=${encodeURIComponent(
        user.username
      )}&userid=${encodeURIComponent(user._id)}`
    );
    return data?.find((travel) => String(travel._id) === String(travelId)) ?? null;
  } catch (error) {
    console.log("Notifiche — viaggio non caricato", error);
    return null;
  }
}

/** Il post completo: l'unico endpoint disponibile è il feed del viaggio. */
async function loadPost(travelId: string, postId: string): Promise<any | null> {
  try {
    const { data } = await axios.get<any[]>(
      `${serverLink}api/post/take?travel=${encodeURIComponent(travelId)}`
    );
    return data?.find((post) => String(post._id) === String(postId)) ?? null;
  } catch (error) {
    console.log("Notifiche — post non caricato", error);
    return null;
  }
}

/**
 * Traduce i params "a id" del server in quelli che la schermata si aspetta.
 * Restituisce null quando la destinazione non è più raggiungibile.
 */
async function hydrate(screen: string, params: TargetParams): Promise<Record<string, any> | null> {
  switch (screen) {
    case "TravelDetail":
    case "Itinerary":
    case "TravelPartecipants": {
      if (!params.travelId) return null;
      const travel = await loadTravel(params.travelId);
      if (!travel) return null;
      const user = await getData("user");
      return { data: travel, username: user?.username, travel };
    }

    case "ItineraryStopDetail": {
      if (!params.travelId || !params.stopId) return null;
      const travel = await loadTravel(params.travelId);
      if (!travel) return null;
      return { stopId: params.stopId, travel };
    }

    case "PaymentInfo": {
      if (!params.postId) return null;
      // Il travelId non viaggia sempre col target (es. payment_settled da
      // settleUp, che salda pagamenti di viaggi diversi): senza, non si può
      // recuperare il post, quindi si apre la panoramica Money.
      if (!params.travelId) return null;
      const post = await loadPost(params.travelId, params.postId);
      if (!post) return null;
      return { item: post };
    }

    case "OtherProfile":
      return params.userId ? { userid: params.userId } : null;

    default:
      return params;
  }
}

/**
 * Porta l'utente sulla schermata indicata dalla notifica.
 * Sicura da chiamare in qualunque momento: se i navigator non sono ancora
 * montati non fa nulla (il tap verrà comunque ripreso all'avvio da
 * `getLastNotificationResponseAsync`, vedi pushClient).
 */
export async function openTarget(target: NotificationTarget | null | undefined): Promise<void> {
  if (!target?.screen) return;
  if (!rootNavigationRef.isReady()) return;

  const isRoot = target.root || ROOT_ROUTES.includes(target.screen);

  // `navigate` è tipizzato sulle route di un navigator noto a compile time:
  // qui il nome arriva dal server, quindi il cast è inevitabile.
  type Navigate = (screen: string, params?: object) => void;
  const rootNavigate = rootNavigationRef.navigate as unknown as Navigate;
  const homeNavigate = homeNavigationRef.navigate as unknown as Navigate;

  if (isRoot) {
    rootNavigate(target.screen, target.params ?? {});
    return;
  }

  const params = await hydrate(target.screen, (target.params ?? {}) as TargetParams);
  if (!params) return;

  // Prima il tab Home, poi la route dello stack annidato: invertire l'ordine
  // significherebbe navigare in un container non visibile.
  rootNavigate("Home");
  if (homeNavigationRef.isReady()) {
    homeNavigate(target.screen, params);
  }
}

/**
 * Estrae il target dal payload `data` di una push.
 * Il server lo mette in `data.target` (vedi func/notifications.ts).
 */
export function targetFromPushData(data: Record<string, any> | undefined): NotificationTarget | null {
  const target = data?.target;
  if (!target || typeof target !== "object" || !target.screen) return null;
  return target as NotificationTarget;
}
