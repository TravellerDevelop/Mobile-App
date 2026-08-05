/**
 * Come si presenta ogni tipo di notifica nell'app: icona, colore e la
 * categoria a cui appartiene nella schermata preferenze.
 *
 * Quali canali usa ogni tipo (push / centro notifiche) lo decide il server
 * (Server/types/notification.ts): qui c'è solo la resa visiva. Le etichette
 * delle preferenze arrivano anch'esse dal server, così non esistono due
 * elenchi da tenere allineati a mano.
 */

import { ds } from "../../global/designSystem";
import { NotificationCategory, NotificationType } from "./types";

export interface NotificationVisual {
  icon: string;
  color: string;
}

const brand = ds.colors.brand;
const action = ds.colors.action;

export const NOTIFICATION_VISUALS: Record<NotificationType, NotificationVisual> = {
  follow_request: { icon: "account-plus-outline", color: brand },
  follow_accepted: { icon: "account-check-outline", color: ds.colors.successText },

  travel_joined: { icon: "account-multiple-plus-outline", color: brand },
  travel_left: { icon: "account-minus-outline", color: ds.colors.textSecondary },
  travel_closed: { icon: "flag-checkered", color: ds.colors.textSecondary },
  travel_updated: { icon: "pencil-outline", color: brand },
  travel_deleted: { icon: "trash-can-outline", color: ds.colors.errorText },

  post_new: { icon: "message-text-outline", color: brand },
  post_pinned: { icon: "pin-outline", color: brand },
  vote_new: { icon: "poll", color: action },
  todo_assigned: { icon: "format-list-checks", color: action },

  payment_new: { icon: "cash-plus", color: action },
  payment_reminder: { icon: "bell-ring-outline", color: ds.colors.errorText },
  payment_paid: { icon: "cash-check", color: ds.colors.successText },
  payment_settled: { icon: "check-decagram-outline", color: ds.colors.successText },
  budget_exceeded: { icon: "alert-circle-outline", color: ds.colors.errorText },

  stop_assigned: { icon: "map-marker-plus-outline", color: brand },
  day_shifted: { icon: "clock-alert-outline", color: ds.colors.errorText },
  itinerary_mode_changed: { icon: "shield-lock-outline", color: ds.colors.textSecondary },

  ticket_shared: { icon: "ticket-confirmation-outline", color: brand },
};

const FALLBACK: NotificationVisual = { icon: "bell-outline", color: brand };

export function visualFor(type: NotificationType): NotificationVisual {
  return NOTIFICATION_VISUALS[type] ?? FALLBACK;
}

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  social: "Social",
  travel: "Viaggi",
  feed: "Feed",
  money: "Soldi",
  itinerary: "Itinerario",
  tickets: "Biglietti",
};

export const CATEGORY_ORDER: NotificationCategory[] = [
  "social",
  "travel",
  "feed",
  "money",
  "itinerary",
  "tickets",
];

/** "Adesso", "12 min fa", "3 h fa", "ieri", poi la data. */
export function relativeTime(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Adesso";
  if (minutes < 60) return `${minutes} min fa`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h fa`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Ieri";
  if (days < 7) return `${days} giorni fa`;

  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

/** Intestazione del gruppo nella lista: Oggi / Ieri / Questa settimana / Prima. */
export function sectionFor(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "Prima";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const days = Math.floor((startOfToday.getTime() - date.getTime()) / 86400000);
  if (days < 0) return "Oggi";
  if (days === 0) return "Ieri";
  if (days < 7) return "Questa settimana";
  return "Prima";
}
