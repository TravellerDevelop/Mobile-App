import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../global/designSystem";
import { EmptyState, OverscrollBackdrop, SectionLabel, Sheet } from "../components/ui";
import { ItineraryMap } from "../components/itinerary/ItineraryMap";
import {
  duplicateItinerary,
  fetchJoinedTravels,
  fetchRecap,
} from "../components/itinerary/api";
import { formatCurrency, formatDateRange } from "../components/itinerary/schedule";
import { getData } from "../shared/data/localdata";
import { resolveImageUri } from "../shared/imageUrl";
import type { ItineraryRecap as RecapData, Stop } from "../components/itinerary/types";

/* ============================================================
   Resoconto di fine viaggio: cosa avete fatto, cosa avete
   saltato, quanto avevate previsto e quanto avete speso davvero.
   ============================================================ */

export default function ItineraryRecap({ navigation, route }: { navigation: any; route: any }) {
  const travel = route.params?.travel ?? {};

  const [recap, setRecap] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [travels, setTravels] = useState<any[]>([]);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await getData("user");
        setUser(stored);
        setRecap(await fetchRecap(travel._id, stored._id));
      } catch (err) {
        console.log("Resoconto", err);
        setError("Non riesco a caricare il resoconto");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [travel._id]);

  /* La mappa lavora su tappe: i luoghi del resoconto vengono adattati
     alla stessa forma invece di duplicare il componente. */
  const mapStops = useMemo(
    () =>
      (recap?.places ?? []).map(
        (place, index) =>
          ({
            _id: `recap-${index}`,
            title: place.title,
            status: place.status,
            place: { name: place.title, address: "", lat: place.lat, lon: place.lon },
          }) as unknown as Stop
      ),
    [recap?.places]
  );

  const shareRecap = useCallback(async () => {
    if (!recap) return;

    const range = formatDateRange(recap.startDate, recap.endDate);
    const lines = [
      `${recap.name}${range ? ` · ${range}` : ""}`,
      `${recap.doneCount} tappe fatte su ${recap.totalStops}${
        recap.skippedCount > 0 ? ` (${recap.skippedCount} saltate)` : ""
      }`,
      `Previsto ${formatCurrency(recap.plannedCost)} · speso ${formatCurrency(recap.spent)}`,
      ...recap.photosByDay
        .filter((day) => day.count > 0)
        .map((day) => `${day.label}: ${day.count} foto`),
    ];

    await Share.share({ message: lines.join("\n") }).catch(() => undefined);
  }, [recap]);

  const openTravelPicker = useCallback(async () => {
    if (!user) return;
    try {
      const joined = await fetchJoinedTravels(user.username, user._id);
      setTravels(joined.filter((item: any) => item._id !== travel._id));
      setPickerOpen(true);
    } catch (err) {
      Alert.alert("Itinerario", "Non riesco a caricare i tuoi viaggi");
    }
  }, [user, travel._id]);

  const copyTo = useCallback(
    async (targetId: string) => {
      if (!user) return;
      setCopying(true);
      try {
        const result = await duplicateItinerary(travel._id, targetId, user._id);
        setPickerOpen(false);
        Alert.alert(
          "Itinerario copiato",
          `${result.copied} tappe sono state copiate. Le tappe fuori dalla durata del nuovo viaggio sono finite tra le idee.`
        );
      } catch (err: any) {
        const message = err?.response?.data;
        Alert.alert(
          "Itinerario",
          typeof message === "string" ? message : "Non sono riuscito a copiare l'itinerario"
        );
      } finally {
        setCopying(false);
      }
    },
    [user, travel._id]
  );

  const range = formatDateRange(recap?.startDate, recap?.endDate);
  const isOver = Boolean(recap?.endDate && new Date(recap.endDate) < new Date());
  const overBudget = (recap?.spent ?? 0) > (recap?.plannedCost ?? 0);

  return (
    <View style={styles.container}>
      <OverscrollBackdrop topColor={ds.colors.brand} bottomColor={ds.colors.surface} />
      <ScrollView showsVerticalScrollIndicator={false}>
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

          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={hitSlop}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={ds.colors.white} />
            </TouchableOpacity>

            <TouchableOpacity onPress={shareRecap} hitSlop={hitSlop} accessibilityLabel="Condividi">
              <MaterialCommunityIcons name="share-variant" size={18} color={ds.colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {travel.name}
            {range ? ` · ${range}` : ""}
          </Text>

          <View style={styles.statusChip}>
            <MaterialCommunityIcons
              name={isOver ? "flag-checkered" : "progress-clock"}
              size={11}
              color={ds.colors.white}
            />
            <Text style={styles.statusChipText}>
              {isOver ? "Viaggio concluso" : "Viaggio in corso"}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.sheetBackground}>
          <Sheet style={styles.sheet} overlap={-14}>
            {loading ? (
              <ActivityIndicator style={styles.loader} color={ds.colors.action} />
            ) : error || !recap ? (
              <EmptyState icon="wifi-off" title="Resoconto non disponibile" description={error ?? ""} />
            ) : (
              <>
                <View style={styles.mapCard}>
                  <ItineraryMap stops={mapStops} compact />
                </View>

                <View style={styles.statsGrid}>
                  <StatCard
                    icon="check-circle-outline"
                    label="Tappe fatte"
                    value={String(recap.doneCount)}
                    tone="success"
                  />
                  <StatCard
                    icon="close-circle-outline"
                    label="Tappe saltate"
                    value={String(recap.skippedCount)}
                    tone="error"
                  />
                  <StatCard
                    icon="tag-outline"
                    label="Previsto"
                    value={formatCurrency(recap.plannedCost)}
                    tone="action"
                  />
                  <StatCard
                    icon="wallet-outline"
                    label="Speso"
                    value={formatCurrency(recap.spent)}
                    tone={overBudget ? "error" : "action"}
                  />
                </View>

                {recap.plannedCost > 0 ? (
                  <Text style={styles.budgetNote}>
                    {overBudget
                      ? `Avete speso ${formatCurrency(recap.spent - recap.plannedCost)} in più del previsto.`
                      : `Siete rimasti sotto il previsto di ${formatCurrency(
                          recap.plannedCost - recap.spent
                        )}.`}
                  </Text>
                ) : null}

                <SectionLabel>Foto per giorno</SectionLabel>
                {recap.photosByDay.every((day) => day.count === 0) ? (
                  <Text style={styles.emptyPhotos}>
                    Nessuna foto pubblicata nel feed durante il viaggio.
                  </Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photoRow}
                  >
                    {recap.photosByDay.map((day) => (
                      <View key={day.day} style={styles.photoCard}>
                        {day.preview.length > 0 ? (
                          <Image
                            style={styles.photoThumb}
                            source={{ uri: resolveImageUri(day.preview[0], "userImage/posts/") }}
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name="image-outline"
                            size={16}
                            color={ds.colors.scale.neutral[8]}
                          />
                        )}
                        <Text style={styles.photoLabel}>{day.label}</Text>
                        <Text style={styles.photoCount}>{day.count} foto</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionSlot} activeOpacity={0.85} onPress={shareRecap}>
                    <View style={styles.secondaryAction}>
                      <MaterialCommunityIcons
                        name="export-variant"
                        size={14}
                        color={ds.colors.text}
                      />
                      <Text style={styles.secondaryActionText}>Esporta</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionSlot}
                    activeOpacity={0.85}
                    onPress={openTravelPicker}
                  >
                    <View style={styles.primaryAction}>
                      <MaterialCommunityIcons
                        name="content-copy"
                        size={14}
                        color={ds.colors.white}
                      />
                      <Text style={styles.primaryActionText}>Usa come modello</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Sheet>
        </View>
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setPickerOpen(false)} />
        <View style={styles.pickerSheet}>
          <View style={styles.grabber} />
          <Text style={styles.pickerTitle}>Copia le tappe in…</Text>

          {copying ? <ActivityIndicator color={ds.colors.action} /> : null}

          <ScrollView showsVerticalScrollIndicator={false}>
            {travels.length === 0 ? (
              <Text style={styles.emptyPhotos}>
                Non hai altri viaggi aperti in cui copiare l'itinerario.
              </Text>
            ) : (
              travels.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  activeOpacity={0.85}
                  onPress={() => copyTo(item._id)}
                  disabled={copying}
                >
                  <View style={styles.pickerRow}>
                    <Text style={styles.pickerLabel} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={ds.colors.scale.neutral[8]}
                    />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/* ---- Card statistica ----------------------------------------- */
function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: "success" | "error" | "action";
}) {
  const tones = {
    success: { bg: ds.colors.successSoft, fg: ds.colors.successText },
    error: { bg: ds.colors.errorSoft, fg: ds.colors.errorText },
    action: { bg: ds.colors.actionSubtle, fg: ds.colors.action },
  } as const;

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tones[tone].bg }]}>
        <MaterialCommunityIcons name={icon as never} size={14} color={tones[tone].fg} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
    paddingBottom: ds.space[6],
    overflow: "hidden",
  },
  headerGlyph: {
    position: "absolute",
    right: -16,
    top: 8,
    transform: [{ rotate: "-10deg" }],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ds.space[4],
  },
  headerTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 22,
    color: ds.colors.white,
    marginBottom: ds.space[2] + 2,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: ds.space[2] + 2,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: ds.radius.full,
    paddingVertical: ds.space[3] - 2,
    paddingHorizontal: ds.space[4] - 1,
  },
  statusChipText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
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
  mapCard: {
    height: 140,
    borderRadius: ds.radius.l,
    overflow: "hidden",
    marginBottom: ds.space[6],
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ds.space[3] + 2,
    marginBottom: ds.space[5],
  },
  statCard: {
    width: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: ds.space[5] - 2,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: ds.radius.m,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ds.space[3] + 2,
  },
  statLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[2] + 2,
  },
  statValue: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 19,
    color: ds.colors.text,
  },
  budgetNote: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[6],
  },
  emptyPhotos: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[5],
  },
  photoRow: {
    gap: ds.space[3] + 2,
    marginBottom: ds.space[6],
  },
  photoCard: {
    width: 90,
    height: 76,
    borderRadius: ds.radius.l,
    backgroundColor: ds.colors.scale.neutral[4],
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoThumb: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  photoLabel: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.text,
  },
  photoCount: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 10,
    color: ds.colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: ds.space[3] + 2,
    marginTop: ds.space[5],
  },
  actionSlot: {
    flex: 1,
  },
  secondaryAction: {
    height: ds.control.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ds.space[3],
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.m,
  },
  secondaryActionText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  primaryAction: {
    height: ds.control.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ds.space[3],
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    ...ds.shadow.md,
  },
  primaryActionText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.white,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ds.colors.scrim,
  },
  pickerSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "60%",
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.radius.xl,
    borderTopRightRadius: ds.radius.xl,
    paddingHorizontal: ds.space[6],
    paddingTop: ds.space[4],
    paddingBottom: ds.space[9],
    ...ds.shadow.lg,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[6],
    alignSelf: "center",
    marginBottom: ds.space[5],
  },
  pickerTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 18,
    color: ds.colors.text,
    marginBottom: ds.space[4],
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: ds.space[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  pickerLabel: {
    flex: 1,
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.text,
  },
});
