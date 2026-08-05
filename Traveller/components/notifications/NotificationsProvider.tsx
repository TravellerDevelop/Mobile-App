/**
 * Stato condiviso delle notifiche.
 *
 * Tiene insieme le tre cose che prima non parlavano tra loro:
 * - il badge in home (che contava solo le richieste di follow, leggendole
 *   direttamente da mainHeader con una sua chiamata);
 * - il centro notifiche (che non esisteva);
 * - le push (registrate dentro screens/home.tsx, senza cleanup).
 *
 * Va montato sopra la navigazione ma sotto AuthProvider: ha bisogno
 * dell'utente loggato e dei navigator già pronti per il deep-link.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { useUserRealtime } from "../realtime/hooks";
import { USER_EVENTS } from "../realtime/events";
import {
  fetchNotifications,
  fetchPreferences,
  fetchUnreadCount,
  markRead as markReadRequest,
  removeNotification as removeRequest,
  savePreferences as savePreferencesRequest,
} from "./api";
import { openTarget, targetFromPushData } from "./navigation";
import {
  clearBadge,
  installNotificationHandler,
  releasePushToken,
  subscribeToPush,
  syncPushToken,
} from "./pushClient";
import {
  NotificationItem,
  NotificationPreferences,
  NotificationType,
} from "./types";

const PAGE_SIZE = 30;

interface NotificationsContextValue {
  items: NotificationItem[];
  unreadCount: number;
  pendingFollowRequests: number;
  /** Somma mostrata sul campanello: notifiche non lette + richieste di follow. */
  badgeCount: number;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  preferences: NotificationPreferences | null;

  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  refreshBadge: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  open: (item: NotificationItem) => Promise<void>;
  loadPreferences: () => Promise<void>;
  setTypeEnabled: (type: NotificationType, enabled: boolean) => Promise<void>;
  setPushEnabled: (enabled: boolean) => Promise<void>;
  setTravelMuted: (travelId: string, muted: boolean) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

// L'handler va installato prima di qualunque render: se una push arriva
// mentre l'app è in primo piano e l'handler non c'è, la notifica non
// viene mostrata e non c'è modo di recuperarla.
installNotificationHandler();

export function NotificationsProvider({
  userId,
  children,
}: {
  userId: string | null | undefined;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingFollowRequests, setPendingFollowRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Evita che una risposta lenta di una richiesta vecchia sovrascriva
  // una lista più recente (succede facilmente con il pull-to-refresh).
  const requestId = useRef(0);

  const refreshBadge = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchUnreadCount(userId);
      setUnreadCount(data.unreadCount ?? 0);
      setPendingFollowRequests(data.pendingFollowRequests ?? 0);
    } catch {
      /* il badge è secondario: un errore qui non deve comparire in UI */
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const id = ++requestId.current;

    setRefreshing(true);
    setError(null);
    try {
      const data = await fetchNotifications(userId, { limit: PAGE_SIZE });
      if (id !== requestId.current) return;

      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      if (id === requestId.current) setError("Non è stato possibile caricare le notifiche");
    } finally {
      if (id === requestId.current) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (!userId || !cursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const data = await fetchNotifications(userId, { before: cursor, limit: PAGE_SIZE });
      setItems((prev) => {
        // Il cursore è temporale: due notifiche con lo stesso istante
        // potrebbero tornare due volte.
        const seen = new Set(prev.map((item) => item._id));
        return [...prev, ...(data.items ?? []).filter((item) => !seen.has(item._id))];
      });
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, cursor, loadingMore]);

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return;
      // Ottimistico: la riga si spegne subito, la richiesta segue.
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, read: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markReadRequest(userId, [id]);
      } catch {
        refreshBadge();
      }
    },
    [userId, refreshBadge]
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    clearBadge();
    try {
      await markReadRequest(userId);
    } catch {
      refreshBadge();
    }
  }, [userId, refreshBadge]);

  const remove = useCallback(
    async (id: string) => {
      if (!userId) return;
      const removed = items.find((item) => item._id === id);
      setItems((prev) => prev.filter((item) => item._id !== id));
      if (removed && !removed.read) setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await removeRequest(userId, id);
      } catch {
        refresh();
      }
    },
    [userId, items, refresh]
  );

  const clearAll = useCallback(async () => {
    if (!userId) return;
    setItems([]);
    setUnreadCount(0);
    setCursor(null);
    setHasMore(false);
    try {
      await removeRequest(userId);
    } catch {
      refresh();
    }
  }, [userId, refresh]);

  const open = useCallback(
    async (item: NotificationItem) => {
      if (!item.read) markRead(item._id);
      await openTarget(item.target);
    },
    [markRead]
  );

  // ---------------------------------------------------------------- preferenze

  const loadPreferences = useCallback(async () => {
    if (!userId) return;
    try {
      setPreferences(await fetchPreferences(userId));
    } catch {
      setError("Non è stato possibile caricare le preferenze");
    }
  }, [userId]);

  const patchPreferences = useCallback(
    async (patch: Parameters<typeof savePreferencesRequest>[1], optimistic: NotificationPreferences | null) => {
      if (!userId) return;
      if (optimistic) setPreferences(optimistic);
      try {
        // null = richiesta in coda (offline): resta valido l'ottimistico.
        const saved = await savePreferencesRequest(userId, patch);
        if (saved) setPreferences(saved);
      } catch {
        loadPreferences();
      }
    },
    [userId, loadPreferences]
  );

  const setTypeEnabled = useCallback(
    async (type: NotificationType, enabled: boolean) => {
      const optimistic = preferences
        ? { ...preferences, types: { ...preferences.types, [type]: enabled } }
        : null;
      await patchPreferences({ types: { [type]: enabled } }, optimistic);
    },
    [preferences, patchPreferences]
  );

  const setPushEnabled = useCallback(
    async (enabled: boolean) => {
      const optimistic = preferences ? { ...preferences, pushEnabled: enabled } : null;
      await patchPreferences({ pushEnabled: enabled }, optimistic);
    },
    [preferences, patchPreferences]
  );

  const setTravelMuted = useCallback(
    async (travelId: string, muted: boolean) => {
      const current = preferences?.mutedTravels ?? [];
      const next = muted
        ? [...new Set([...current, travelId])]
        : current.filter((id) => id !== travelId);
      const optimistic = preferences ? { ...preferences, mutedTravels: next } : null;
      await patchPreferences({ mutedTravels: next }, optimistic);
    },
    [preferences, patchPreferences]
  );

  // ---------------------------------------------------------------- effetti

  // Login / cambio utente: token push, primo caricamento, stanza socket.
  useEffect(() => {
    if (!userId) {
      setItems([]);
      setUnreadCount(0);
      setPendingFollowRequests(0);
      setPreferences(null);
      return;
    }

    setLoading(true);
    syncPushToken(userId);
    refresh();
    refreshBadge();

    // La connessione non si apre più da qui: la gestisce RealtimeProvider,
    // seguendo la sessione. Prima questo effetto la inizializzava e non la
    // chiudeva mai, quindi al logout il socket restava aperto nella stanza
    // dell'utente uscito.
  }, [userId]);

  // Push in arrivo o evento realtime: si aggiorna il badge senza ricaricare
  // tutta la lista (che potrebbe non essere nemmeno aperta).
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToPush({
      onReceived: () => refreshBadge(),
      onTapped: (data) => {
        refreshBadge();
        openTarget(targetFromPushData(data));
      },
    });

    return unsubscribe;
  }, [userId, refreshBadge]);

  // Notifica in tempo reale. Oltre al badge si ricarica anche la lista:
  // prima si aggiornava solo il contatore, quindi con il centro notifiche
  // aperto il numero saliva ma la riga corrispondente non compariva finché
  // non si usciva e rientrava dalla schermata.
  useUserRealtime(
    USER_EVENTS.NOTIFICATION,
    () => {
      refreshBadge();
      refresh();
    },
    Boolean(userId)
  );

  // Ritorno in primo piano: il badge può essere cambiato mentre l'app era
  // in background (le push non sempre arrivano al listener).
  useEffect(() => {
    if (!userId) return;

    const handler = (state: AppStateStatus) => {
      if (state === "active") refreshBadge();
    };
    const subscription = AppState.addEventListener("change", handler);
    return () => subscription.remove();
  }, [userId, refreshBadge]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      unreadCount,
      pendingFollowRequests,
      badgeCount: unreadCount + pendingFollowRequests,
      loading,
      refreshing,
      loadingMore,
      hasMore,
      error,
      preferences,
      refresh,
      loadMore,
      refreshBadge,
      markRead,
      markAllRead,
      remove,
      clearAll,
      open,
      loadPreferences,
      setTypeEnabled,
      setPushEnabled,
      setTravelMuted,
    }),
    [
      items,
      unreadCount,
      pendingFollowRequests,
      loading,
      refreshing,
      loadingMore,
      hasMore,
      error,
      preferences,
      refresh,
      loadMore,
      refreshBadge,
      markRead,
      markAllRead,
      remove,
      clearAll,
      open,
      loadPreferences,
      setTypeEnabled,
      setPushEnabled,
      setTravelMuted,
    ]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

/**
 * Fuori dal provider restituisce uno stato inerte invece di lanciare:
 * mainHeader viene montato anche in schermate che non stanno sotto il
 * provider durante gli sviluppi, e un badge a zero è meglio di un crash.
 */
export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (context) return context;

  const noop = async () => {};
  return {
    items: [],
    unreadCount: 0,
    pendingFollowRequests: 0,
    badgeCount: 0,
    loading: false,
    refreshing: false,
    loadingMore: false,
    hasMore: false,
    error: null,
    preferences: null,
    refresh: noop,
    loadMore: noop,
    refreshBadge: noop,
    markRead: noop,
    markAllRead: noop,
    remove: noop,
    clearAll: noop,
    open: noop,
    loadPreferences: noop,
    setTypeEnabled: noop,
    setPushEnabled: noop,
    setTravelMuted: noop,
  };
}

export { releasePushToken };
