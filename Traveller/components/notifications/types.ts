/**
 * Mirror lato client di Server/types/notification.ts.
 *
 * Sul filo HTTP ObjectId e Date arrivano come stringhe: le interfacce qui
 * sotto rispecchiano quelle del server già serializzate (stessa convenzione
 * di shared/types/api.ts).
 */

export type NotificationCategory =
  | "social"
  | "travel"
  | "feed"
  | "money"
  | "itinerary"
  | "tickets";

export type NotificationType =
  | "follow_request"
  | "follow_accepted"
  | "travel_joined"
  | "travel_left"
  | "travel_closed"
  | "travel_updated"
  | "travel_deleted"
  | "post_new"
  | "post_pinned"
  | "vote_new"
  | "todo_assigned"
  | "payment_new"
  | "payment_reminder"
  | "payment_paid"
  | "payment_settled"
  | "budget_exceeded"
  | "stop_assigned"
  | "day_shifted"
  | "itinerary_mode_changed"
  | "ticket_shared";

/**
 * Destinazione del tap.
 *
 * Il server manda solo id (`travelId`, `postId`, `stopId`, `userId`): le
 * schermate dell'app vogliono invece oggetti interi (TravelDetail prende
 * `data`, PaymentInfo prende `item`), quindi è il client a idratarli —
 * vedi `openTarget` in ./navigation.ts.
 *
 * `root: true` indica una route del tab navigator radice (Tickets, Money);
 * tutte le altre stanno nello stack annidato sotto Home.
 */
export interface NotificationTarget {
  screen: string;
  params?: Record<string, any>;
  root?: boolean;
}

export interface NotificationItem {
  _id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  actor?: string | null;
  actorName?: string | null;
  travel?: string | null;
  travelName?: string | null;
  entity?: string | null;
  target?: NotificationTarget | null;
  read: boolean;
  /** ISO date. */
  createdAt: string;
}

export interface TakeNotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
  /** Da passare come `before` per la pagina successiva; null se non ce ne sono altre. */
  nextCursor: string | null;
}

export interface UnreadCountResponse {
  unreadCount: number;
  pendingFollowRequests: number;
}

/**
 * Voce del catalogo, inviata dal server insieme alle preferenze: la
 * schermata impostazioni si costruisce da qui, così etichette e canali di
 * ogni tipo hanno una sola sorgente di verità (Server/types/notification.ts).
 */
export interface NotificationCatalogEntry {
  type: NotificationType;
  category: NotificationCategory;
  label: string;
  description: string;
  /** false = l'utente non può spegnerla (es. solleciti di pagamento). */
  configurable: boolean;
  push: boolean;
  center: boolean;
}

/** Preferenze già risolte dal server (default del catalogo + scelte dell'utente). */
export interface NotificationPreferences {
  pushEnabled: boolean;
  mutedTravels: string[];
  types: Record<NotificationType, boolean>;
  catalog: NotificationCatalogEntry[];
  categories: { key: NotificationCategory; label: string }[];
}
