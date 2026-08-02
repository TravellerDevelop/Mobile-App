import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../global/designSystem";
import { EmptyState, OverscrollBackdrop, SectionLabel, Sheet } from "../components/ui";
import {
  AddStopRow,
  ConflictBanner,
  DayTabs,
  IdeaRow,
  InfoBanner,
  ItineraryFab,
  ItinerarySegmented,
  StopRow,
} from "../components/itinerary/parts";
import {
  DayPickerSheet,
  StopEditorSheet,
  type EditorParticipant,
} from "../components/itinerary/StopEditorSheet";
import { DayMapView } from "../components/itinerary/DayMapView";
import { ItineraryMap, mappableStops } from "../components/itinerary/ItineraryMap";
import { useItinerary, type ItineraryTab } from "../components/itinerary/useItinerary";
import { permissionOption } from "../components/itinerary/categories";
import { updateTravelDates } from "../components/itinerary/api";
import {
  estimateTransfer,
  formatCurrency,
  formatDateRange,
  formatDayDate,
  todayIndex,
} from "../components/itinerary/schedule";
import type { Stop, StopInput } from "../components/itinerary/types";

/* ============================================================
   Itinerario del viaggio: idee (backlog) e timeline per giorno.
   Il segmentato Idee/Timeline resta nel foglio bianco in entrambe
   le viste — nel bundle di design cambiava posizione tra le due
   schermate, ma spostare un controllo tra due tab della stessa
   pagina si legge come un difetto.
   ============================================================ */

const TAB_OPTIONS: ReadonlyArray<{ value: ItineraryTab; label: string }> = [
  { value: "ideas", label: "Idee" },
  { value: "timeline", label: "Timeline" },
];

export default function Itinerary({ navigation, route }: { navigation: any; route: any }) {
  const travel = route.params?.data ?? {};
  const itinerary = useItinerary({ travelId: travel._id });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [editorDay, setEditorDay] = useState<number | null>(null);

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [dayPickerFor, setDayPickerFor] = useState<Stop | null>(null);
  const [datePicker, setDatePicker] = useState<"start" | "end" | null>(null);
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [savingDates, setSavingDates] = useState(false);

  const { data } = itinerary;
  const mode = permissionOption(data?.mode);
  const days = data?.days ?? [];
  const today = useMemo(() => todayIndex(days), [days]);

  const participants: EditorParticipant[] = useMemo(
    () =>
      (travel.participants ?? []).map((participant: any) => ({
        userid: String(participant.userid),
        username: participant.username ?? "",
      })),
    [travel.participants]
  );

  const nameByUserId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const participant of participants) map[participant.userid] = participant.username;
    return map;
  }, [participants]);

  /* In modalità "solo admin" chi non è admin può comunque proporre idee,
     ma non scegliere il giorno: il campo giorno sparisce dall'editor. */
  const canChooseDay = Boolean(data?.canEdit);

  const openNewStop = useCallback((day: number | null) => {
    setEditingStop(null);
    setEditorDay(day);
    setEditorOpen(true);
  }, []);

  const openEditStop = useCallback((stop: Stop) => {
    setEditingStop(stop);
    setEditorDay(stop.day);
    setEditorOpen(true);
  }, []);

  const submitStop = useCallback(
    async (param: StopInput) => {
      if (editingStop) await itinerary.editStop(editingStop._id, param);
      else await itinerary.addStop(param);
    },
    [editingStop, itinerary]
  );

  const openStopDetail = useCallback(
    (stop: Stop) => {
      navigation.navigate("ItineraryStopDetail", {
        stopId: stop._id,
        travel,
        onChanged: () => itinerary.reload(true),
      });
    },
    [navigation, travel, itinerary]
  );

  /* ---- Date del viaggio ------------------------------------
     Senza date non esistono giorni: l'itinerario resta alla sola
     wishlist finché l'admin non le imposta. */
  const onPickDate = useCallback(
    async (event: any, date?: Date) => {
      if (Platform.OS !== "ios") setDatePicker(null);
      if (event.type === "dismissed" || !date) {
        setDatePicker(null);
        return;
      }

      if (datePicker === "start") {
        setPendingStart(date);
        setDatePicker("end");
        return;
      }

      setDatePicker(null);
      setSavingDates(true);
      try {
        await updateTravelDates(
          travel,
          (pendingStart ?? date).toISOString(),
          date.toISOString()
        );
        await itinerary.reload(true);
      } catch (err) {
        console.log("Itinerario — date viaggio", err);
      } finally {
        setSavingDates(false);
      }
    },
    [datePicker, pendingStart, travel, itinerary]
  );

  const dateRange = formatDateRange(data?.startDate, data?.endDate);
  const selectedDayMeta = days.find((day) => day.index === itinerary.selectedDay);
  const dayDate = formatDayDate(selectedDayMeta?.date);
  const isTravelOver = Boolean(data?.endDate && new Date(data.endDate) < new Date());

  /* La mappa sostituisce l'intera schermata: a metà schermo, con il foglio
     delle tappe sotto, non resta spazio utile per header e tab dei giorni. */
  if (viewMode === "map" && itinerary.tab === "timeline") {
    return (
      <DayMapView
        stops={itinerary.currentDayStops}
        dayLabel={`Giorno ${itinerary.selectedDay + 1}${dayDate ? ` · ${dayDate}` : ""}`}
        onBack={() => setViewMode("list")}
        onSwitchToList={() => setViewMode("list")}
        onStopPress={openStopDetail}
      />
    );
  }

  return (
    <View style={styles.container}>
      <OverscrollBackdrop topColor={ds.colors.brand} bottomColor={ds.colors.surface} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={itinerary.refreshing} onRefresh={itinerary.refresh} />
        }
      >
        {/* Header brand: gradiente viola → blu azione, come nel design */}
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

            <View style={styles.headerActions}>
              {itinerary.tab === "timeline" && days.length > 0 ? (
                <TouchableOpacity
                  hitSlop={hitSlop}
                  onPress={() => setViewMode("map")}
                  accessibilityLabel="Vedi il giorno sulla mappa"
                >
                  <MaterialCommunityIcons name="map-outline" size={18} color={ds.colors.white} />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                hitSlop={hitSlop}
                onPress={() => navigation.navigate("ItineraryRecap", { travel })}
                accessibilityLabel="Resoconto del viaggio"
              >
                <MaterialCommunityIcons
                  name="flag-checkered"
                  size={18}
                  color={ds.colors.white}
                />
              </TouchableOpacity>

              {data?.isAdmin ? (
                <TouchableOpacity
                  hitSlop={hitSlop}
                  onPress={() =>
                    navigation.navigate("ItineraryPermissions", {
                      travel,
                      mode: data.mode,
                      onSaved: () => itinerary.reload(true),
                    })
                  }
                  accessibilityLabel="Permessi dell'itinerario"
                >
                  <MaterialCommunityIcons name="cog-outline" size={18} color={ds.colors.white} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <Text style={styles.headerTitle}>Itinerario</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {travel.name}
            {dateRange ? ` · ${dateRange}` : ""}
          </Text>

          <View style={styles.modeChip}>
            <MaterialCommunityIcons name={mode.icon as never} size={12} color={ds.colors.white} />
            <Text style={styles.modeChipText}>{mode.chip}</Text>
          </View>
        </LinearGradient>

        <View style={styles.sheetBackground}>
          <Sheet style={styles.sheet} overlap={-14}>
            <ItinerarySegmented
              options={TAB_OPTIONS}
              value={itinerary.tab}
              onChange={itinerary.setTab}
            />

            {itinerary.loading ? (
              <ActivityIndicator style={styles.loader} color={ds.colors.action} />
            ) : itinerary.error ? (
              <EmptyState
                icon="wifi-off"
                title="Itinerario non disponibile"
                description={itinerary.error}
              />
            ) : itinerary.tab === "ideas" ? (
              <IdeasTab
                itinerary={itinerary}
                nameByUserId={nameByUserId}
                onOpen={openStopDetail}
                onAssign={(stop) => setDayPickerFor(stop)}
              />
            ) : (
              <TimelineTab
                itinerary={itinerary}
                todayIdx={today}
                dayLabel={dayDate}
                savingDates={savingDates}
                isTravelOver={isTravelOver}
                onOpen={openStopDetail}
                onAddStop={() => openNewStop(itinerary.selectedDay)}
                onOpenMap={() => setViewMode("map")}
                onOpenToday={() => navigation.navigate("ItineraryToday", { travel })}
                onOpenRecap={() => navigation.navigate("ItineraryRecap", { travel })}
                onSetDates={() => {
                  setPendingStart(null);
                  setDatePicker("start");
                }}
              />
            )}
          </Sheet>
        </View>
      </ScrollView>

      <ItineraryFab onPress={() => openNewStop(itinerary.tab === "timeline" ? itinerary.selectedDay : null)} />

      <StopEditorSheet
        visible={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSubmit={submitStop}
        days={days}
        participants={participants}
        stop={editingStop}
        defaultDay={editorDay}
        canChooseDay={canChooseDay}
      />

      <DayPickerSheet
        visible={dayPickerFor !== null}
        days={days}
        onClose={() => setDayPickerFor(null)}
        onPick={async (day) => {
          const stop = dayPickerFor;
          if (!stop) return;
          try {
            await itinerary.assignToDay(stop._id, day);
            itinerary.setTab("timeline");
            if (day !== null) itinerary.setSelectedDay(day);
          } catch (err: any) {
            console.log("Itinerario — assegnazione", err?.message);
          }
        }}
      />

      {datePicker ? (
        <DateTimePicker
          mode="date"
          display="default"
          value={(datePicker === "end" ? pendingStart : null) ?? new Date()}
          minimumDate={datePicker === "end" ? pendingStart ?? undefined : undefined}
          onChange={onPickDate}
        />
      ) : null}
    </View>
  );
}

/* ---- Tab Idee ------------------------------------------------ */
function IdeasTab({
  itinerary,
  nameByUserId,
  onOpen,
  onAssign,
}: {
  itinerary: ReturnType<typeof useItinerary>;
  nameByUserId: Record<string, string>;
  onOpen: (stop: Stop) => void;
  onAssign: (stop: Stop) => void;
}) {
  const ideas = itinerary.data?.ideas ?? [];

  return (
    <>
      <SectionLabel>
        Backlog non datato · {ideas.length} {ideas.length === 1 ? "idea" : "idee"}
      </SectionLabel>

      {ideas.length === 0 ? (
        <EmptyState
          icon="lightbulb-outline"
          title="Nessuna idea, per ora"
          description="Aggiungi i posti che vi interessano: deciderete dopo in che giorno metterli."
        />
      ) : (
        ideas.map((idea) => (
          <IdeaRow
            key={idea._id}
            stop={idea}
            authorName={nameByUserId[idea.creator]}
            canAssign={Boolean(itinerary.data?.canEdit) && (itinerary.data?.days.length ?? 0) > 0}
            onPress={() => onOpen(idea)}
            onAssign={() => onAssign(idea)}
          />
        ))
      )}
    </>
  );
}

/* ---- Tab Timeline -------------------------------------------- */
function TimelineTab({
  itinerary,
  todayIdx,
  dayLabel,
  savingDates,
  isTravelOver,
  onOpen,
  onAddStop,
  onOpenMap,
  onOpenToday,
  onOpenRecap,
  onSetDates,
}: {
  itinerary: ReturnType<typeof useItinerary>;
  todayIdx: number | null;
  dayLabel: string | null;
  savingDates: boolean;
  isTravelOver: boolean;
  onOpen: (stop: Stop) => void;
  onAddStop: () => void;
  onOpenMap: () => void;
  onOpenToday: () => void;
  onOpenRecap: () => void;
  onSetDates: () => void;
}) {
  const data = itinerary.data;
  const stops = itinerary.currentDayStops;

  if (!data) return null;

  if (data.days.length === 0) {
    return (
      <>
        <EmptyState
          icon="calendar-blank-outline"
          title="Il viaggio non ha ancora date"
          description="Senza date non ci sono giorni da riempire: intanto raccogli le idee nella prima tab."
        />
        {data.isAdmin ? (
          <TouchableOpacity activeOpacity={0.85} onPress={onSetDates} disabled={savingDates}>
            <View style={styles.dateButton}>
              {savingDates ? (
                <ActivityIndicator size="small" color={ds.colors.white} />
              ) : (
                <Text style={styles.dateButtonText}>Imposta le date del viaggio</Text>
              )}
            </View>
          </TouchableOpacity>
        ) : null}
      </>
    );
  }

  const dayCost = stops
    .filter((stop) => stop.status !== "skipped")
    .reduce((sum, stop) => sum + (stop.cost || 0), 0);

  return (
    <>
      {/* Durante il viaggio la scorciatoia alla giornata in corso sta sopra
          tutto: è la cosa che serve mentre si è in giro. A viaggio finito
          lo stesso posto porta al resoconto. */}
      {todayIdx !== null ? (
        <TouchableOpacity activeOpacity={0.85} onPress={onOpenToday}>
          <View style={styles.jumpRow}>
            <MaterialCommunityIcons name="progress-clock" size={16} color={ds.colors.action} />
            <Text style={styles.jumpText}>Apri la giornata in corso</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={ds.colors.scale.neutral[8]}
            />
          </View>
        </TouchableOpacity>
      ) : isTravelOver ? (
        <TouchableOpacity activeOpacity={0.85} onPress={onOpenRecap}>
          <View style={styles.jumpRow}>
            <MaterialCommunityIcons name="flag-checkered" size={16} color={ds.colors.action} />
            <Text style={styles.jumpText}>Vedi il resoconto del viaggio</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={ds.colors.scale.neutral[8]}
            />
          </View>
        </TouchableOpacity>
      ) : null}

      <DayTabs
        days={data.days}
        selected={itinerary.selectedDay}
        conflictDays={itinerary.conflictDays}
        onSelect={itinerary.setSelectedDay}
        todayIndex={todayIdx}
      />

      <View style={styles.dayHeader}>
        <Text style={styles.dayHeaderTitle}>
          Giorno {itinerary.selectedDay + 1}
          {dayLabel ? ` · ${dayLabel}` : ""}
        </Text>
        <Text style={styles.dayHeaderMeta}>
          {stops.length} {stops.length === 1 ? "tappa" : "tappe"}
          {dayCost > 0 ? ` · ${formatCurrency(dayCost)}` : ""}
        </Text>
      </View>

      {/* Tutte le tappe del giorno sulla mappa. L'anteprima non è
          interattiva (pointerEvents none): dentro una ScrollView la mappa
          si mangerebbe lo scroll della pagina. Il tap apre la mappa piena. */}
      {mappableStops(stops).length > 0 ? (
        <TouchableOpacity activeOpacity={0.9} onPress={onOpenMap}>
          <View style={styles.mapPreview}>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <ItineraryMap stops={stops} />
            </View>

            <View style={styles.mapPreviewBadge}>
              <MaterialCommunityIcons name="arrow-expand" size={13} color={ds.colors.action} />
              <Text style={styles.mapPreviewText}>
                {mappableStops(stops).length} sulla mappa
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : null}

      <ConflictBanner conflicts={itinerary.conflicts} />

      {!data.canEdit ? (
        <InfoBanner
          icon="lock-outline"
          text={
            data.mode === "admin"
              ? "Solo chi ha creato il viaggio può modificare il piano. Puoi proporre idee dalla tab Idee."
              : "Le proposte del gruppo vengono confermate dall'admin."
          }
        />
      ) : null}

      {stops.length === 0 ? (
        <EmptyState
          icon="map-marker-path"
          title="Giornata libera"
          description="Nessuna tappa in programma per questo giorno."
        />
      ) : (
        stops.map((stop, index) => {
          const next = stops[index + 1];
          const transfer = next ? estimateTransfer(stop, next) : null;
          const inVote = data.mode === "proposal" && stop.status === "proposed";

          return (
            <StopRow
              key={stop._id}
              stop={stop}
              transfer={transfer}
              onPress={() => onOpen(stop)}
              voteLabel={
                inVote
                  ? `${stop.votes.length} ${stop.votes.length === 1 ? "voto" : "voti"} · vota`
                  : null
              }
              onVote={() => itinerary.toggleVote(stop._id).catch(() => undefined)}
            />
          );
        })
      )}

      {data.canEdit ? <AddStopRow onPress={onAddStop} /> : null}
    </>
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
    marginBottom: ds.space[5] - 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[5],
  },
  mapPreview: {
    height: 150,
    borderRadius: ds.radius.l,
    overflow: "hidden",
    marginBottom: ds.space[5],
    backgroundColor: ds.colors.scale.neutral[4],
  },
  mapPreviewBadge: {
    position: "absolute",
    right: ds.space[3],
    bottom: ds.space[3],
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[2] + 1,
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.full,
    paddingVertical: ds.space[2] + 1,
    paddingHorizontal: ds.space[3] + 2,
    ...ds.shadow.md,
  },
  mapPreviewText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.action,
  },
  jumpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3],
    borderWidth: 1,
    borderColor: ds.colors.actionSubtle,
    backgroundColor: ds.colors.actionSubtle,
    borderRadius: ds.radius.l,
    paddingVertical: ds.space[4] - 2,
    paddingHorizontal: ds.space[4],
    marginBottom: ds.space[5] - 2,
  },
  jumpText: {
    flex: 1,
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12.5,
    color: ds.colors.action,
  },
  headerTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 22,
    color: ds.colors.white,
    marginBottom: ds.space[2],
  },
  headerSubtitle: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    color: ds.colors.onBrandMuted,
    marginBottom: ds.space[5] - 2,
  },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: ds.space[2] + 2,
    backgroundColor: ds.colors.onBrandChipBg,
    borderWidth: 1,
    borderColor: ds.colors.onBrandChipBorder,
    borderRadius: ds.radius.full,
    paddingVertical: ds.space[3] - 1,
    paddingHorizontal: ds.space[4],
  },
  modeChipText: {
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
  dayHeader: {
    marginTop: ds.space[5],
    marginBottom: ds.space[4],
  },
  dayHeaderTitle: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.text,
  },
  dayHeaderMeta: {
    fontFamily: ds.fontFamily.metaRegular,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },
  dateButton: {
    height: ds.control.lg,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    alignItems: "center",
    justifyContent: "center",
    marginTop: ds.space[5],
  },
  dateButtonText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.white,
  },
});
