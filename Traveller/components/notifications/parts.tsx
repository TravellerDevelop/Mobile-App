/** Pezzi di UI del centro notifiche: riga, intestazione di gruppo, richiesta di follow. */

import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";
import { InitialsAvatar } from "../ui";
import { relativeTime, visualFor } from "./catalog";
import { NotificationItem } from "./types";

/* ---- Riga di notifica --------------------------------------- */

interface NotificationRowProps {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
  onDismiss?: (item: NotificationItem) => void;
}

export function NotificationRow({ item, onPress, onDismiss }: NotificationRowProps) {
  const visual = visualFor(item.type);
  // Il puntino a sinistra è l'unico segnale di "non letta": più leggibile di
  // uno sfondo colorato quando le righe non lette sono molte.
  const unread = !item.read;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      style={[styles.row, unread && styles.rowUnread]}
    >
      <View style={[styles.iconWrap, { backgroundColor: visual.color + "14" }]}>
        <MaterialCommunityIcons name={visual.icon as any} size={18} color={visual.color} />
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.rowTime}>{relativeTime(item.createdAt)}</Text>
        </View>

        <Text style={styles.rowText} numberOfLines={3}>
          {item.body}
        </Text>

        {item.travelName && item.travelName !== item.title ? (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {item.travelName}
          </Text>
        ) : null}
      </View>

      {unread ? <View style={styles.dot} /> : null}

      {onDismiss ? (
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => onDismiss(item)}
          style={styles.dismiss}
        >
          <MaterialCommunityIcons name="close" size={14} color={ds.colors.textPlaceholder} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

/* ---- Intestazione di gruppo (Oggi / Ieri / …) --------------- */

export function NotificationSection({ label }: { label: string }) {
  return <Text style={styles.section}>{label}</Text>;
}

/* ---- Richiesta di follow ------------------------------------
   Vive fuori dalla collection "notifications" (sta in "follow") e
   ha due azioni inline: resta quindi una card a sé, in cima alla
   lista, invece di una riga come le altre.
   ------------------------------------------------------------ */

interface FollowRequestCardProps {
  name: string;
  username: string;
  busy?: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export function FollowRequestCard({
  name,
  username,
  busy,
  onAccept,
  onReject,
}: FollowRequestCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <InitialsAvatar name={name} size={34} />
        <Text style={styles.cardTitle}>@{username} ha richiesto di seguirti</Text>
      </View>

      <Text style={styles.cardSubtitle}>
        Accetta la richiesta di {name} per aggiungerla ai tuoi viaggi.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionSlot}
          disabled={busy}
          onPress={onAccept}
        >
          <View style={[styles.accept, busy && styles.disabled]}>
            {busy ? (
              <ActivityIndicator size="small" color={ds.colors.white} />
            ) : (
              <Text style={styles.acceptText}>Accetta</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionSlot}
          disabled={busy}
          onPress={onReject}
        >
          <View style={[styles.reject, busy && styles.disabled]}>
            <Text style={styles.rejectText}>Rifiuta</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[4],
    borderRadius: ds.radius.l,
    marginBottom: ds.space[2],
  },
  rowUnread: {
    backgroundColor: ds.colors.actionSubtle,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: ds.space[3] + 2,
  },
  rowBody: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  rowTitle: {
    flex: 1,
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  rowTime: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textPlaceholder,
    marginLeft: ds.space[2],
  },
  rowText: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: ds.colors.textSecondary,
  },
  rowMeta: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textPlaceholder,
    marginTop: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ds.colors.action,
    marginTop: 6,
    marginLeft: ds.space[2],
  },
  dismiss: {
    paddingLeft: ds.space[2],
    paddingTop: 3,
  },
  section: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: ds.colors.textPlaceholder,
    marginTop: ds.space[5],
    marginBottom: ds.space[3],
    marginLeft: ds.space[4],
  },
  card: {
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    backgroundColor: ds.colors.surface,
    padding: ds.space[5],
    marginBottom: ds.space[4],
    ...ds.shadow.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ds.space[3] + 2,
  },
  cardTitle: {
    flex: 1,
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
    marginLeft: ds.space[3] + 2,
  },
  cardSubtitle: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[4] + 2,
  },
  actions: {
    flexDirection: "row",
  },
  actionSlot: {
    flex: 1,
  },
  accept: {
    height: ds.control.sm,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    alignItems: "center",
    justifyContent: "center",
    marginRight: ds.space[3] - 1,
  },
  acceptText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.white,
  },
  reject: {
    height: ds.control.sm,
    borderRadius: ds.radius.m,
    borderWidth: 1,
    borderColor: ds.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: ds.space[3] - 1,
  },
  rejectText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.errorText,
  },
  disabled: {
    opacity: 0.6,
  },
});
