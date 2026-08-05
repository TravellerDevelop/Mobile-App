/**
 * Centro notifiche.
 *
 * Prima questa schermata mostrava soltanto le richieste di follow (le
 * uniche "notifiche" che esistessero): ora è il feed completo delle
 * notifiche persistite, con le richieste di follow ancora in cima perché
 * sono le uniche che portano due azioni inline e vivono in un'altra
 * collection lato server ("follow", non "notifications").
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { serverLink } from "../global/globalVariable";
import { ds } from "../global/designSystem";
import { EmptyState } from "../components/ui";
import { getData } from "../shared/data/localdata";
import { apiSend } from "../shared/data/apiClient";
import { cacheKeys, readCache, writeCache } from "../shared/data/offlineCache";
import { isNetworkError, markOffline, markOnline } from "../shared/data/netStatus";
import { ApiFollow, ApiUser } from "../shared/types/api";
import { useNotifications } from "../components/notifications/NotificationsProvider";
import {
  FollowRequestCard,
  NotificationRow,
  NotificationSection,
} from "../components/notifications/parts";
import { sectionFor } from "../components/notifications/catalog";
import { NotificationItem } from "../components/notifications/types";

export default function Notifications({ navigation }: { navigation: any; route?: any }) {
  const notifications = useNotifications();

  const [me, setMe] = useState<Partial<ApiUser>>({});
  const [requests, setRequests] = useState<ApiUser[]>([]);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  /**
   * Richieste di follow: due chiamate perché takeFollowersRequest torna
   * solo le coppie (from, to) e i nomi vanno risolti a parte.
   */
  const loadRequests = useCallback(async (userId: string) => {
    const cacheKey = cacheKeys.followRequests(userId);

    try {
      const { data } = await axios.get<ApiFollow[]>(
        `${serverLink}api/follow/takeFollowersRequest?to=${encodeURIComponent(userId)}`
      );
      markOnline();

      const ids = data.map((item) => item.from);
      if (ids.length === 0) {
        setRequests([]);
        await writeCache<ApiUser[]>(cacheKey, []);
        return;
      }

      const users = await axios.post<ApiUser[]>(`${serverLink}api/user/fromIdToUsernames`, {
        id: ids,
      });
      setRequests(users.data ?? []);
      await writeCache(cacheKey, users.data ?? []);
    } catch (error) {
      if (isNetworkError(error)) {
        // Offline: mostriamo le richieste già viste. Non si può rispondere
        // (accetta/rifiuta chiama il server), ma almeno si sa che ci sono.
        markOffline();
        setRequests((await readCache<ApiUser[]>(cacheKey))?.data ?? []);
        return;
      }
      console.log("Notifiche — richieste di follow", error);
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const user = await getData("user");
      setMe(user ?? {});
      if (user?._id) loadRequests(user._id);
    })();
  }, [loadRequests]);

  /* Ricarica a ogni ingresso nella schermata: le notifiche possono essere
     arrivate mentre l'app era altrove. Le dipendenze sono le sole funzioni
     (stabili) e non l'intero oggetto del provider, che cambia identità a
     ogni aggiornamento della lista e farebbe ri-registrare il listener in
     continuazione. */
  const { refresh } = notifications;
  useEffect(() => {
    const unsubscribe = navigation.addListener?.("focus", () => {
      refresh();
      if (me._id) loadRequests(me._id);
    });
    return unsubscribe;
  }, [navigation, refresh, me._id, loadRequests]);

  const respond = useCallback(
    async (user: ApiUser, accept: boolean) => {
      if (!me._id || respondingTo) return;

      setRespondingTo(user._id);
      try {
        /* In coda se offline: accettare una richiesta di follow è
           un'operazione idempotente e senza risposta da mostrare, quindi
           differirla è sicuro. */
        await apiSend(
          `${serverLink}api/follow/${accept ? "accept" : "delete"}`,
          { from: user._id, to: me._id },
          {
            queue: {
              label: accept ? "Richiesta accettata" : "Richiesta rifiutata",
              invalidates: [cacheKeys.followRequests(me._id)],
            },
          }
        );
        setRequests((prev) => prev.filter((item) => item._id !== user._id));
        notifications.refreshBadge();
      } catch (error) {
        console.log("Notifiche — risposta alla richiesta", error);
      } finally {
        setRespondingTo(null);
      }
    },
    [me._id, respondingTo, notifications]
  );

  const handlePress = useCallback(
    (item: NotificationItem) => {
      notifications.open(item);
    },
    [notifications]
  );

  /** Le notifiche raggruppate per fascia temporale, nell'ordine di arrivo. */
  const groups = useMemo(() => {
    const result: { label: string; items: NotificationItem[] }[] = [];
    for (const item of notifications.items) {
      const label = sectionFor(item.createdAt);
      const last = result[result.length - 1];
      if (last && last.label === label) last.items.push(item);
      else result.push({ label, items: [item] });
    }
    return result;
  }, [notifications.items]);

  const isEmpty = requests.length === 0 && notifications.items.length === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={notifications.refreshing}
          onRefresh={() => {
            notifications.refresh();
            if (me._id) loadRequests(me._id);
          }}
        />
      }
      onMomentumScrollEnd={({ nativeEvent }) => {
        // Paginazione a scorrimento: si carica la pagina successiva quando
        // mancano meno di due schermate alla fine.
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const remaining = contentSize.height - (contentOffset.y + layoutMeasurement.height);
        if (remaining < layoutMeasurement.height && notifications.hasMore) {
          notifications.loadMore();
        }
      }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={ds.colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifiche</Text>

        <View style={styles.headerActions}>
          {notifications.unreadCount > 0 ? (
            <TouchableOpacity onPress={() => notifications.markAllRead()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.headerAction}>Segna lette</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => navigation.navigate("NotificationSettings")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginLeft: ds.space[4] }}
          >
            <MaterialCommunityIcons name="cog-outline" size={19} color={ds.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {notifications.error ? <Text style={styles.error}>{notifications.error}</Text> : null}

      {requests.length > 0 ? (
        <>
          <NotificationSection label="Richieste" />
          {requests.map((user) => (
            <FollowRequestCard
              key={String(user._id)}
              name={`${user.name} ${user.surname}`}
              username={user.username}
              busy={respondingTo === user._id}
              onAccept={() => respond(user, true)}
              onReject={() => respond(user, false)}
            />
          ))}
        </>
      ) : null}

      {notifications.loading && notifications.items.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={ds.colors.brand} />
      ) : null}

      {groups.map((group) => (
        <View key={group.label}>
          <NotificationSection label={group.label} />
          {group.items.map((item) => (
            <NotificationRow
              key={item._id}
              item={item}
              onPress={handlePress}
              onDismiss={(target) => notifications.remove(target._id)}
            />
          ))}
        </View>
      ))}

      {notifications.loadingMore ? (
        <ActivityIndicator style={styles.loader} color={ds.colors.brand} />
      ) : null}

      {isEmpty && !notifications.loading ? (
        <EmptyState
          icon="bell-outline"
          title="Nessuna notifica"
          description="Qui compariranno le richieste dei tuoi amici e gli aggiornamenti dei tuoi viaggi."
        />
      ) : null}

      {notifications.items.length > 0 ? (
        <TouchableOpacity style={styles.clearAll} onPress={() => notifications.clearAll()}>
          <Text style={styles.clearAllText}>Svuota il centro notifiche</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.surface,
  },
  content: {
    paddingHorizontal: ds.layout.screenPadding,
    paddingTop: 70,
    paddingBottom: ds.layout.contentBottomPadding,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ds.space[4],
  },
  headerTitle: {
    flex: 1,
    fontFamily: ds.fontFamily.bold,
    fontSize: 18,
    color: ds.colors.text,
    marginLeft: ds.space[4],
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAction: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.action,
  },
  error: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    color: ds.colors.errorText,
    marginBottom: ds.space[3],
  },
  loader: {
    marginVertical: ds.space[5],
  },
  clearAll: {
    alignItems: "center",
    marginTop: ds.space[6],
  },
  clearAllText: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    color: ds.colors.textPlaceholder,
    textDecorationLine: "underline",
  },
});
