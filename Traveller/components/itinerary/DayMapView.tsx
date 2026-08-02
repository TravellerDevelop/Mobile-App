import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";
import { ItineraryMap, mappableStops } from "./ItineraryMap";
import { openInMaps } from "./openInMaps";
import { formatStopTime } from "./schedule";
import type { Stop } from "./types";

/* ============================================================
   Giorno in mappa: mappa sopra, elenco delle tappe in un foglio
   ancorato in basso. Lista e mappa mostrano lo stesso ordine e la
   stessa numerazione, così il numero sul pin si ritrova nell'elenco.
   ============================================================ */

interface DayMapViewProps {
  stops: Stop[];
  dayLabel: string;
  onBack: () => void;
  onSwitchToList: () => void;
  onStopPress: (stop: Stop) => void;
}

export function DayMapView({
  stops,
  dayLabel,
  onBack,
  onSwitchToList,
  onStopPress,
}: DayMapViewProps) {
  const points = mappableStops(stops);

  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        <ItineraryMap stops={stops} onMarkerPress={onStopPress} />
      </View>

      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onBack}
          accessibilityLabel="Torna indietro"
        >
          <View style={styles.roundButton}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={ds.colors.text} />
          </View>
        </TouchableOpacity>

        <View style={styles.switch}>
          <TouchableOpacity activeOpacity={0.85} onPress={onSwitchToList}>
            <View style={styles.switchSlot}>
              <Text style={styles.switchText}>Lista</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.switchSlot, styles.switchSlotActive]}>
            <Text style={[styles.switchText, styles.switchTextActive]}>Mappa</Text>
          </View>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={styles.sheetLabel}>
          {dayLabel} · {stops.length} {stops.length === 1 ? "tappa" : "tappe"}
          {points.length < stops.length
            ? ` · ${stops.length - points.length} senza luogo`
            : ""}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {stops.map((stop) => {
            const number = points.findIndex((item) => item._id === stop._id) + 1;

            return (
              <TouchableOpacity
                key={stop._id}
                activeOpacity={0.85}
                onPress={() => onStopPress(stop)}
              >
                <View style={styles.row}>
                  <View style={[styles.number, number === 0 && styles.numberEmpty]}>
                    <Text style={styles.numberText}>{number > 0 ? number : "–"}</Text>
                  </View>

                  <Text style={styles.time}>{formatStopTime(stop)}</Text>
                  <Text style={styles.title} numberOfLines={1}>
                    {stop.title}
                  </Text>

                  {stop.place ? (
                    <TouchableOpacity
                      onPress={() => openInMaps(stop.place)}
                      hitSlop={hitSlop}
                      accessibilityLabel={`Naviga verso ${stop.title}`}
                    >
                      <MaterialCommunityIcons
                        name="navigation-variant-outline"
                        size={16}
                        color={ds.colors.action}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.scale.neutral[4],
  },
  mapArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "58%",
  },
  overlay: {
    position: "absolute",
    top: 64,
    left: ds.layout.screenPadding,
    right: ds.layout.screenPadding,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...ds.shadow.md,
  },
  switch: {
    flexDirection: "row",
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.full,
    padding: 3,
    ...ds.shadow.md,
  },
  switchSlot: {
    paddingVertical: ds.space[3] - 1,
    paddingHorizontal: ds.space[5] - 2,
    borderRadius: ds.radius.full,
  },
  switchSlotActive: {
    backgroundColor: ds.colors.action,
  },
  switchText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  switchTextActive: {
    color: ds.colors.white,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: "54%",
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.radius.xl,
    borderTopRightRadius: ds.radius.xl,
    paddingHorizontal: ds.layout.screenPadding,
    paddingTop: ds.space[3],
    paddingBottom: ds.layout.contentBottomPadding,
    ...ds.shadow.lg,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[6],
    alignSelf: "center",
    marginBottom: ds.space[5] - 2,
  },
  sheetLabel: {
    ...ds.type.sectionLabel,
    marginBottom: ds.space[3],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3] + 2,
    paddingVertical: ds.space[3] + 1,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  number: {
    width: 22,
    height: 22,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.actionSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  numberEmpty: {
    backgroundColor: ds.colors.scale.neutral[3],
  },
  numberText: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 11,
    color: ds.colors.action,
  },
  time: {
    width: 40,
    fontFamily: ds.fontFamily.metaSemibold,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  title: {
    flex: 1,
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
});
