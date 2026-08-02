import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../global/designSystem";
import { EmptyState, OverscrollBackdrop, SectionLabel, Sheet } from "../components/ui";
import { useItinerary } from "../components/itinerary/useItinerary";
import { shiftDay } from "../components/itinerary/api";
import { openInMaps } from "../components/itinerary/openInMaps";
import { fetchWeather, type DayWeather } from "../components/itinerary/weather";
import {
  formatCountdown,
  formatDuration,
  formatStopTime,
  minutesUntil,
  nextStop,
  stopsOfDay,
  todayIndex,
} from "../components/itinerary/schedule";
import type { Stop } from "../components/itinerary/types";

/* ============================================================
   Giorno in corso.
   Apre sulla prossima tappa perché è l'unica cosa che serve
   mentre si è per strada; il resto della giornata sta sotto.
   ============================================================ */

/** Ritardi proposti quando il gruppo è indietro col programma. */
const DELAY_OPTIONS = [15, 30, 60];

export default function ItineraryToday({ navigation, route }: { navigation: any; route: any }) {
  const travel = route.params?.travel ?? {};
  const itinerary = useItinerary({ travelId: travel._id });

  const [weather, setWeather] = useState<DayWeather | null>(null);
  const [shifting, setShifting] = useState(false);

  const dayIndex = useMemo(
    () => todayIndex(itinerary.data?.days ?? []),
    [itinerary.data?.days]
  );

  const stops = useMemo(() => {
    if (!itinerary.data || dayIndex === null) return [];
    return stopsOfDay(itinerary.data.stops, dayIndex);
  }, [itinerary.data, dayIndex]);

  const upcoming = useMemo(() => nextStop(stops), [stops]);
  const later = useMemo(
    () => stops.filter((stop) => stop._id !== upcoming?._id && stop.status !== "done"),
    [stops, upcoming]
  );

  /* Il meteo si prende sulla prima tappa con coordinate della giornata:
     è la posizione più probabile del gruppo, senza chiedere il permesso GPS. */
  useEffect(() => {
    const anchor = stops.find((stop) => stop.place?.lat != null && stop.place?.lon != null);
    if (!anchor?.place?.lat || !anchor.place.lon) return;

    let active = true;
    fetchWeather(anchor.place.lat, anchor.place.lon).then((result) => {
      if (active) setWeather(result);
    });

    return () => {
      active = false;
    };
  }, [stops]);

  const openStop = useCallback(
    (stop: Stop) => {
      navigation.navigate("ItineraryStopDetail", {
        stopId: stop._id,
        travel,
        onChanged: () => itinerary.reload(true),
      });
    },
    [navigation, travel, itinerary]
  );

  const askDelay = useCallback(() => {
    if (dayIndex === null || !upcoming) return;

    Alert.alert(
      "Siamo in ritardo",
      "Di quanto slittano le tappe che restano? Le tappe già fatte o saltate non vengono toccate.",
      [
        ...DELAY_OPTIONS.map((minutes) => ({
          text: `${minutes} min`,
          onPress: async () => {
            setShifting(true);
            try {
              if (!itinerary.userId) return;
              await shiftDay(travel._id, itinerary.userId, dayIndex, minutes, upcoming._id);
              await itinerary.reload(true);
            } catch (err: any) {
              const message = err?.response?.data;
              Alert.alert(
                "Itinerario",
                typeof message === "string" ? message : "Non sono riuscito a spostare gli orari"
              );
            } finally {
              setShifting(false);
            }
          },
        })),
        { text: "Annulla", style: "cancel" as const },
      ]
    );
  }, [dayIndex, upcoming, itinerary, travel._id]);

  const checkIn = useCallback(async () => {
    if (!upcoming) return;
    try {
      await itinerary.setStatus(upcoming._id, "done");
    } catch (err: any) {
      Alert.alert("Itinerario", err?.message || "Operazione non riuscita");
    }
  }, [upcoming, itinerary]);

  return (
    <View style={styles.container}>
      <OverscrollBackdrop topColor={ds.colors.brand} bottomColor={ds.colors.surface} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={itinerary.refreshing} onRefresh={itinerary.refresh} />
        }
      >
        <LinearGradient
          colors={[ds.colors.brand, ds.colors.action]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <MaterialCommunityIcons
            name="routes"
            size={130}
            color="rgba(255,255,255,0.07)"
            style={styles.headerGlyph}
          />

          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={hitSlop}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={ds.colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerRow}>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>
                {dayIndex === null ? "Oggi" : `Oggi · Giorno ${dayIndex + 1}`}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {travel.destination || travel.name}
              </Text>
            </View>

            {weather ? (
              <View style={styles.weatherChip}>
                <MaterialCommunityIcons
                  name={weather.icon as never}
                  size={14}
                  color={ds.colors.white}
                />
                <Text style={styles.weatherText}>{weather.temperature}°</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={styles.sheetBackground}>
          <Sheet style={styles.sheet} overlap={-14}>
            {itinerary.loading ? (
              <ActivityIndicator style={styles.loader} color={ds.colors.action} />
            ) : dayIndex === null ? (
              <EmptyState
                icon="calendar-clock"
                title="Il viaggio non è in corso"
                description="Questa schermata mostra la giornata solo mentre siete in viaggio."
              />
            ) : stops.length === 0 ? (
              <EmptyState
                icon="coffee-outline"
                title="Giornata libera"
                description="Nessuna tappa in programma per oggi."
              />
            ) : (
              <>
                {upcoming ? (
                  <>
                    <SectionLabel>
                      Prossima tappa · {formatCountdown(minutesUntil(upcoming))}
                    </SectionLabel>

                    <TouchableOpacity activeOpacity={0.9} onPress={() => openStop(upcoming)}>
                      <LinearGradient
                        colors={[ds.colors.brand, ds.colors.action]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.nextCard}
                      >
                        <Text style={styles.nextTitle}>{upcoming.title}</Text>
                        <Text style={styles.nextMeta} numberOfLines={1}>
                          {formatStopTime(upcoming)} · {formatDuration(upcoming.duration)}
                          {upcoming.place?.name ? ` · ${upcoming.place.name}` : ""}
                        </Text>

                        <View style={styles.nextActions}>
                          <TouchableOpacity
                            style={styles.nextActionSlot}
                            activeOpacity={0.85}
                            onPress={() => openInMaps(upcoming.place)}
                            disabled={!upcoming.place}
                          >
                            <View style={[styles.nextAction, !upcoming.place && styles.nextActionOff]}>
                              <MaterialCommunityIcons
                                name="navigation-variant-outline"
                                size={14}
                                color={ds.colors.action}
                              />
                              <Text style={styles.nextActionText}>Naviga</Text>
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.nextActionSlot}
                            activeOpacity={0.85}
                            onPress={checkIn}
                          >
                            <View style={styles.nextActionGhost}>
                              <MaterialCommunityIcons
                                name="check-circle-outline"
                                size={14}
                                color={ds.colors.white}
                              />
                              <Text style={styles.nextActionGhostText}>Check-in</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : null}

                {later.length > 0 ? (
                  <>
                    <SectionLabel>Più tardi oggi</SectionLabel>
                    {later.map((stop) => (
                      <TouchableOpacity
                        key={stop._id}
                        activeOpacity={0.85}
                        onPress={() => openStop(stop)}
                      >
                        <View style={styles.laterRow}>
                          <Text style={styles.laterTime}>{formatStopTime(stop)}</Text>
                          <Text
                            style={[
                              styles.laterTitle,
                              stop.status === "skipped" && styles.laterSkipped,
                            ]}
                            numberOfLines={1}
                          >
                            {stop.title}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : null}

                {itinerary.data?.canEdit && upcoming ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={askDelay}
                    disabled={shifting}
                    style={styles.delayButton}
                  >
                    <View style={styles.delayInner}>
                      {shifting ? (
                        <ActivityIndicator size="small" color={ds.colors.errorText} />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="clock-alert-outline"
                            size={15}
                            color={ds.colors.errorText}
                          />
                          <Text style={styles.delayText}>Siamo in ritardo</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </Sheet>
        </View>
      </ScrollView>
    </View>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.bgApp,
  },
  header: {
    paddingHorizontal: ds.layout.headerPaddingH,
    paddingTop: 60,
    paddingBottom: ds.space[7],
    overflow: "hidden",
  },
  headerGlyph: {
    position: "absolute",
    right: -16,
    top: 8,
    transform: [{ rotate: "-10deg" }],
  },
  headerTop: {
    marginBottom: ds.space[5],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitles: {
    flex: 1,
    marginRight: ds.space[4],
  },
  headerTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 20,
    color: ds.colors.white,
  },
  headerSubtitle: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    color: ds.colors.onBrandMuted,
    marginTop: 2,
  },
  weatherChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[2] + 2,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: ds.radius.full,
    paddingVertical: ds.space[3] - 1,
    paddingHorizontal: ds.space[4],
  },
  weatherText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.white,
  },
  sheetBackground: {
    backgroundColor: ds.colors.surface,
  },
  sheet: {
    paddingBottom: ds.layout.contentBottomPadding,
  },
  loader: {
    marginTop: ds.space[8],
  },
  nextCard: {
    borderRadius: ds.radius.l,
    padding: ds.space[5],
    marginBottom: ds.space[6],
    ...ds.shadow.md,
  },
  nextTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 18,
    color: ds.colors.white,
    marginBottom: 2,
  },
  nextMeta: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    color: ds.colors.onCoverMuted,
    marginBottom: ds.space[5] - 2,
  },
  nextActions: {
    flexDirection: "row",
    gap: ds.space[3],
  },
  nextActionSlot: {
    flex: 1,
  },
  nextAction: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ds.space[3],
    backgroundColor: ds.colors.white,
    borderRadius: ds.radius.m,
  },
  nextActionOff: {
    opacity: 0.5,
  },
  nextActionText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12.5,
    color: ds.colors.action,
  },
  nextActionGhost: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ds.space[3],
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: ds.radius.m,
  },
  nextActionGhostText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12.5,
    color: ds.colors.white,
  },
  laterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[4],
    paddingVertical: ds.space[4] - 2,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  laterTime: {
    width: 42,
    fontFamily: ds.fontFamily.metaSemibold,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  laterTitle: {
    flex: 1,
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  laterSkipped: {
    color: ds.colors.textSecondary,
    textDecorationLine: "line-through",
  },
  delayButton: {
    marginTop: ds.space[6],
  },
  delayInner: {
    height: ds.control.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ds.space[3],
    borderWidth: 1,
    borderColor: ds.colors.error,
    borderRadius: ds.radius.m,
  },
  delayText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.errorText,
  },
});
