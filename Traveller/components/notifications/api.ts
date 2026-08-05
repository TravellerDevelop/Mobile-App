/** Chiamate REST del centro notifiche (api/notifications/...). */

import axios from "axios";
import { serverLink } from "../../global/globalVariable";
import { apiGet, apiSend } from "../../shared/data/apiClient";
import { cacheKeys } from "../../shared/data/offlineCache";
import {
  NotificationPreferences,
  NotificationType,
  TakeNotificationsResponse,
  UnreadCountResponse,
} from "./types";

const base = serverLink + "api/notifications/";

/**
 * Una pagina di notifiche, dalla più recente. `before` è il cursore della
 * pagina precedente.
 *
 * La query è costruita a mano: il polyfill di URLSearchParams in React
 * Native non espone `set`, quindi usarlo compilerebbe ma fallirebbe a runtime.
 */
export async function fetchNotifications(
  userId: string,
  options: { before?: string | null; limit?: number; unreadOnly?: boolean } = {}
): Promise<TakeNotificationsResponse> {
  const query = [`userid=${encodeURIComponent(userId)}`];
  if (options.before) query.push(`before=${encodeURIComponent(options.before)}`);
  if (options.limit) query.push(`limit=${options.limit}`);
  if (options.unreadOnly) query.push("unreadOnly=1");

  /* Solo la prima pagina va in cache: è quella che si apre entrando nel
     centro notifiche. Le successive (con cursore) senza rete non hanno
     senso — non si può paginare dentro dati che non abbiamo. */
  const cacheable = !options.before && !options.unreadOnly;

  const { data } = await apiGet<TakeNotificationsResponse>(`${base}take?${query.join("&")}`, {
    cacheKey: cacheable ? cacheKeys.notifications(userId) : undefined,
  });
  return data;
}

/** Alimenta il badge: non lette + richieste di follow ancora in sospeso. */
export async function fetchUnreadCount(userId: string): Promise<UnreadCountResponse> {
  const { data } = await axios.get<UnreadCountResponse>(
    `${base}unreadCount?userid=${encodeURIComponent(userId)}`
  );
  return data;
}

/** Senza `ids` segna come lette tutte le notifiche dell'utente. */
export async function markRead(userId: string, ids?: string[]): Promise<void> {
  await apiSend(
    `${base}markRead`,
    { userid: userId, ids },
    { queue: { label: "Notifiche lette", invalidates: [cacheKeys.notifications(userId)] } }
  );
}

/** Senza `id` svuota il centro notifiche. */
export async function removeNotification(userId: string, id?: string): Promise<void> {
  await apiSend(
    `${base}delete`,
    { userid: userId, id },
    { queue: { label: "Notifica eliminata", invalidates: [cacheKeys.notifications(userId)] } }
  );
}

export async function fetchPreferences(userId: string): Promise<NotificationPreferences> {
  const { data } = await apiGet<NotificationPreferences>(
    `${base}preferences?userid=${encodeURIComponent(userId)}`,
    { cacheKey: cacheKeys.notificationPreferences(userId) }
  );
  return data;
}

/**
 * Merge parziale: si mandano solo i campi toccati.
 * Offline finisce in coda e torna `null`: chi chiama tiene il valore
 * ottimistico già mostrato invece di azzerare le preferenze a schermo.
 */
export async function savePreferences(
  userId: string,
  patch: {
    types?: Partial<Record<NotificationType, boolean>>;
    mutedTravels?: string[];
    pushEnabled?: boolean;
  }
): Promise<NotificationPreferences | null> {
  const { data } = await apiSend<NotificationPreferences>(
    `${base}preferences`,
    { userid: userId, ...patch },
    {
      queue: {
        label: "Preferenze notifiche",
        invalidates: [cacheKeys.notificationPreferences(userId)],
      },
    }
  );
  return data;
}

/** Registra il token push del dispositivo sull'utente. */
export async function registerToken(userId: string, token: string): Promise<void> {
  await axios.post(serverLink + "api/user/setNotifToken", { userid: userId, notifToken: token });
}

/** Verifica che il token salvato sul dispositivo sia ancora associato all'utente. */
export async function verifyToken(userId: string, token: string): Promise<void> {
  await axios.post(serverLink + "api/user/verifyToken", {
    userid: userId,
    notificationToken: token,
  });
}

/**
 * Sgancia il token dall'utente al logout: senza, chi si disconnette continua
 * a ricevere le push dell'account precedente.
 */
export async function unregisterToken(userId: string, token: string): Promise<void> {
  await axios.post(serverLink + "api/user/removeNotifToken", {
    userid: userId,
    notifToken: token,
  });
}
