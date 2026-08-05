/**
 * Registrazione e ricezione delle push, estratte da screens/home.tsx.
 *
 * Cosa cambia rispetto a prima:
 * - `setNotificationHandler` viene impostato una volta sola all'avvio del
 *   modulo, non dentro il `.then()` di una chiamata di rete: prima, se la
 *   registrazione del token falliva (o l'app veniva riaperta con un token
 *   già in cache mentre il server non rispondeva), l'handler non veniva mai
 *   installato e le notifiche ricevute con l'app in primo piano sparivano;
 * - i listener vengono rimossi con una funzione di cleanup, invece di
 *   restare appesi a ogni rimontaggio della Home;
 * - il token del dispositivo resta in SecureStore ma viene ri-verificato a
 *   ogni avvio, così un cambio account lo riassocia all'utente giusto.
 *
 * Tutto passa da `getNotifications()` (shared/notificationsClient): in Expo
 * Go il modulo non esiste e ogni funzione qui degrada a no-op.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { getNotifications, isExpoGo } from "../../shared/notificationsClient";
import { registerToken, unregisterToken, verifyToken } from "./api";

const TOKEN_KEY = "notif-token";

let handlerInstalled = false;

/**
 * Come si comporta una notifica che arriva con l'app aperta.
 * Va chiamata una volta sola, il prima possibile: da qui dipende se
 * l'utente vede o no il banner senza uscire dall'app.
 */
export function installNotificationHandler(): void {
  if (handlerInstalled) return;
  const Notifications = getNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  handlerInstalled = true;
}

/** Canale Android: senza, su Android le push arrivano senza suono né priorità. */
async function ensureAndroidChannel(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Traveller",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4900FF",
  });
}

/**
 * Chiede il permesso (se non già concesso) e restituisce l'Expo push token.
 * Restituisce null senza rumore quando il permesso è negato: negare le
 * notifiche è una scelta legittima, non un errore da mostrare in un Alert
 * come faceva la versione precedente.
 */
export async function requestPushToken(): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications) return null;

  try {
    await ensureAndroidChannel();

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== "granted") {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== "granted") return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return token?.data ?? null;
  } catch (error) {
    console.log("Push — token non ottenuto", error);
    return null;
  }
}

/**
 * Associa il dispositivo all'utente loggato.
 *
 * Il token viene ri-verificato a ogni avvio anche quando è già in
 * SecureStore: è l'unico modo di accorgersi che l'account è cambiato
 * (stesso dispositivo, utente diverso) o che il server ha ripulito il token.
 */
export async function syncPushToken(userId: string): Promise<string | null> {
  if (!userId || isExpoGo) return null;

  try {
    let token = await SecureStore.getItemAsync(TOKEN_KEY);

    if (!token) {
      token = await requestPushToken();
      if (!token) return null;
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await registerToken(userId, token);
      return token;
    }

    await verifyToken(userId, token);
    return token;
  } catch (error) {
    console.log("Push — sincronizzazione token fallita", error);
    return null;
  }
}

/** Da chiamare al logout: sgancia il token dall'utente, ma lo tiene sul device. */
export async function releasePushToken(userId: string): Promise<void> {
  if (!userId || isExpoGo) return;
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) await unregisterToken(userId, token);
  } catch (error) {
    console.log("Push — rilascio token fallito", error);
  }
}

export interface PushListeners {
  /** Notifica ricevuta con l'app in primo piano. */
  onReceived?: (notification: any) => void;
  /** L'utente ha toccato la notifica: qui si fa il deep-link. */
  onTapped?: (data: Record<string, any>) => void;
}

/**
 * Registra i listener e restituisce la funzione di rimozione.
 *
 * Copre anche il caso "app chiusa": se l'utente ha aperto l'app toccando una
 * notifica, `getLastNotificationResponseAsync` restituisce quella risposta,
 * che altrimenti andrebbe persa perché arrivata prima del montaggio.
 */
export function subscribeToPush(listeners: PushListeners): () => void {
  const Notifications = getNotifications();
  if (!Notifications) return () => {};

  installNotificationHandler();

  const received = listeners.onReceived
    ? Notifications.addNotificationReceivedListener(listeners.onReceived)
    : null;

  const tapped = listeners.onTapped
    ? Notifications.addNotificationResponseReceivedListener((response: any) => {
        listeners.onTapped?.(response?.notification?.request?.content?.data ?? {});
      })
    : null;

  if (listeners.onTapped) {
    Notifications.getLastNotificationResponseAsync?.()
      .then((response: any) => {
        const data = response?.notification?.request?.content?.data;
        if (data) listeners.onTapped?.(data);
      })
      .catch(() => {
        /* nessuna notifica di apertura: caso normale */
      });
  }

  return () => {
    received?.remove?.();
    tapped?.remove?.();
  };
}

/** Azzera il pallino sull'icona dell'app. */
export async function clearBadge(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    /* il badge non è supportato ovunque: non è un errore bloccante */
  }
}
