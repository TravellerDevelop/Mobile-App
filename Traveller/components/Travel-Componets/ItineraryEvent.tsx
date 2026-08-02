import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PostCard from "./PostCard";
import { ds } from "../../global/designSystem";

/* ============================================================
   Post di sistema: qualcuno ha toccato l'itinerario.
   Generato dal server (func/itinerary.ts), non dal compositore.
   ============================================================ */

type ItineraryAction =
  | "proposed"
  | "added"
  | "updated"
  | "moved"
  | "removed"
  | "done"
  | "skipped";

interface ActionStyle {
  icon: string;
  label: string;
  color: string;
  background: string;
}

const ACTIONS: Record<ItineraryAction, ActionStyle> = {
  proposed: {
    icon: "chart-bar",
    label: "Nuova proposta",
    color: ds.colors.warningText,
    background: ds.colors.warningSoft,
  },
  added: {
    icon: "map-marker-plus-outline",
    label: "Tappa aggiunta",
    color: ds.colors.action,
    background: ds.colors.actionSubtle,
  },
  updated: {
    icon: "pencil-outline",
    label: "Tappa aggiornata",
    color: ds.colors.action,
    background: ds.colors.actionSubtle,
  },
  moved: {
    icon: "swap-horizontal",
    label: "Tappa spostata",
    color: ds.colors.action,
    background: ds.colors.actionSubtle,
  },
  removed: {
    icon: "map-marker-remove-outline",
    label: "Tappa rimossa",
    color: ds.colors.errorText,
    background: ds.colors.errorSoft,
  },
  done: {
    icon: "check-circle-outline",
    label: "Check-in",
    color: ds.colors.successText,
    background: ds.colors.successSoft,
  },
  skipped: {
    icon: "skip-forward-outline",
    label: "Tappa saltata",
    color: ds.colors.errorText,
    background: ds.colors.errorSoft,
  },
};

export default function ItineraryEvent({
  item,
  home,
  travel,
  loadPosts,
  username,
  navigation,
  travelData,
}: any) {
  const action: ActionStyle = ACTIONS[item.action as ItineraryAction] ?? ACTIONS.updated;

  /* La tappa eliminata non ha più un dettaglio da aprire, e dalla home
     manca il contesto del viaggio: in quei casi la card non è toccabile. */
  const canOpen = Boolean(item.stop && navigation && travelData && !home);

  const open = () => {
    if (!canOpen) return;
    navigation.navigate("ItineraryStopDetail", {
      stopId: item.stop,
      travel: travelData,
      onChanged: loadPosts,
    });
  };

  return (
    <PostCard item={item} home={home} travel={travel} loadPosts={loadPosts} username={username}>
      <TouchableOpacity activeOpacity={canOpen ? 0.85 : 1} onPress={open} disabled={!canOpen}>
        <View style={[styles.body, { backgroundColor: action.background }]}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name={action.icon as never} size={18} color={action.color} />
          </View>

          <View style={styles.text}>
            <Text style={[styles.label, { color: action.color }]}>{action.label}</Text>
            <Text style={styles.title} numberOfLines={1}>
              {item.stopTitle}
            </Text>
            {item.detail ? (
              <Text style={styles.detail} numberOfLines={2}>
                {item.detail}
              </Text>
            ) : null}
          </View>

          {canOpen ? (
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={action.color}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    </PostCard>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[4],
    borderRadius: ds.radius.l,
    padding: ds.space[4],
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 10.5,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.text,
  },
  detail: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: ds.colors.textSecondary,
    marginTop: 1,
  },
});
