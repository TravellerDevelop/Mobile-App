import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";
import { StatusBadge } from "../ui";
import { categoryOption, statusOption } from "./categories";
import { formatDuration, formatStopTime } from "./schedule";
import type { DayConflict, ItineraryDay, Stop, TransferInfo } from "./types";

/* ============================================================
   Blocchi UI dell'itinerario.
   Presentazionali: nessuna chiamata di rete, tutto per props.
   ============================================================ */

/* ---- Segmentato Idee / Timeline ------------------------------ */
interface ItinerarySegmentedProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}

export function ItinerarySegmented<T extends string>({
  options,
  value,
  onChange,
}: ItinerarySegmentedProps<T>) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.85}
            style={styles.segmentSlot}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.segment, active && styles.segmentActive]}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ---- Tab dei giorni ------------------------------------------
   Il puntino rosso segnala un giorno con avvisi di fattibilità.
   ------------------------------------------------------------ */
interface DayTabsProps {
  days: ItineraryDay[];
  selected: number;
  conflictDays: Set<number>;
  onSelect: (index: number) => void;
  todayIndex?: number | null;
}

export function DayTabs({ days, selected, conflictDays, onSelect, todayIndex }: DayTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dayTabs}
    >
      {days.map((day) => {
        const active = day.index === selected;
        const isToday = todayIndex === day.index;

        return (
          <TouchableOpacity
            key={day.index}
            activeOpacity={0.85}
            onPress={() => onSelect(day.index)}
            accessibilityRole="tab"
            accessibilityLabel={`Giorno ${day.index + 1}${isToday ? ", oggi" : ""}`}
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.dayTab, active && styles.dayTabActive]}>
              <Text style={[styles.dayTabText, active && styles.dayTabTextActive]}>
                {isToday ? "Oggi" : day.label}
              </Text>
              {conflictDays.has(day.index) ? (
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={13}
                  color={ds.colors.error}
                  style={styles.dayTabAlert}
                />
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/* ---- Banner di avviso ---------------------------------------- */
export function ConflictBanner({ conflicts }: { conflicts: DayConflict[] }) {
  if (conflicts.length === 0) return null;

  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={15}
        color={ds.colors.errorText}
        style={styles.bannerIcon}
      />
      <Text style={styles.bannerText}>{conflicts[0].message}</Text>
    </View>
  );
}

/* ---- Banner informativo (permessi, offline, ecc.) ------------- */
export function InfoBanner({ icon = "information-outline", text }: { icon?: string; text: string }) {
  return (
    <View style={styles.infoBanner}>
      <MaterialCommunityIcons
        name={icon as never}
        size={14}
        color={ds.colors.infoText}
        style={styles.bannerIcon}
      />
      <Text style={styles.infoBannerText}>{text}</Text>
    </View>
  );
}

/* ---- Riga idea (backlog) -------------------------------------
   L'azione "Aggiungi al giorno…" è il passaggio idea → tappa.
   ------------------------------------------------------------ */
interface IdeaRowProps {
  stop: Stop;
  authorName?: string;
  canAssign: boolean;
  voteCount?: number;
  onPress: () => void;
  onAssign: () => void;
}

export function IdeaRow({ stop, authorName, canAssign, onPress, onAssign }: IdeaRowProps) {
  const category = categoryOption(stop.category);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View style={styles.ideaRow}>
        <View style={[styles.ideaIcon, { backgroundColor: category.color }]}>
          <MaterialCommunityIcons name={category.icon as never} size={17} color={ds.colors.white} />
        </View>

        <View style={styles.ideaBody}>
          <Text style={styles.ideaTitle} numberOfLines={1}>
            {stop.title}
          </Text>
          <Text style={styles.ideaMeta} numberOfLines={1}>
            {category.label}
            {authorName ? ` · proposta da ${authorName}` : ""}
          </Text>
        </View>

        {canAssign ? (
          <TouchableOpacity activeOpacity={0.85} onPress={onAssign} hitSlop={hitSlop}>
            <View style={styles.ideaAction}>
              <Text style={styles.ideaActionText}>Aggiungi al giorno…</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={ds.colors.scale.neutral[8]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ---- Riga tappa (timeline) ------------------------------------ */
interface StopRowProps {
  stop: Stop;
  transfer?: TransferInfo | null;
  onPress: () => void;
  /** Mostrato solo in modalità "proposte + voto" sulle tappe in votazione. */
  voteLabel?: string | null;
  onVote?: () => void;
}

export function StopRow({ stop, transfer, onPress, voteLabel, onVote }: StopRowProps) {
  const category = categoryOption(stop.category);
  const status = statusOption(stop.status);
  const dimmed = stop.status === "skipped";

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View style={styles.stopRow}>
        <View style={styles.stopTimeColumn}>
          <Text style={styles.stopTime}>{formatStopTime(stop)}</Text>
        </View>

        <View style={styles.stopIcon}>
          <MaterialCommunityIcons
            name={category.icon as never}
            size={15}
            color={category.color}
          />
        </View>

        <View style={styles.stopBody}>
          <View style={styles.stopTitleRow}>
            <Text
              style={[styles.stopTitle, dimmed && styles.stopTitleDimmed]}
              numberOfLines={1}
            >
              {stop.title}
            </Text>
            <StatusBadge label={status.label} intent={status.intent} />
          </View>

          <Text style={styles.stopMeta} numberOfLines={1}>
            {category.label} · {formatDuration(stop.duration)}
          </Text>

          {transfer ? (
            <View style={styles.transferRow}>
              <MaterialCommunityIcons
                name={transfer.mode === "walk" ? "walk" : "car-outline"}
                size={11}
                color={ds.colors.textSecondary}
              />
              <Text style={styles.transferText}>{transfer.label}</Text>
            </View>
          ) : null}

          {voteLabel ? (
            <TouchableOpacity activeOpacity={0.85} onPress={onVote} hitSlop={hitSlop}>
              <View style={styles.voteButton}>
                <MaterialCommunityIcons
                  name="thumb-up-outline"
                  size={12}
                  color={ds.colors.action}
                />
                <Text style={styles.voteText}>{voteLabel}</Text>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ---- Riga "Aggiungi tappa" ------------------------------------ */
export function AddStopRow({ onPress, label = "Aggiungi tappa" }: { onPress: () => void; label?: string }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View style={styles.addRow}>
        <MaterialCommunityIcons name="plus" size={16} color={ds.colors.action} />
        <Text style={styles.addRowText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ---- Pulsante flottante --------------------------------------- */
export function ItineraryFab({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.fab}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Aggiungi un'idea"
    >
      <MaterialCommunityIcons name="plus" size={24} color={ds.colors.white} />
    </TouchableOpacity>
  );
}

const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

const styles = StyleSheet.create({
  segmented: {
    flexDirection: "row",
    backgroundColor: ds.colors.scale.neutral[3],
    borderRadius: ds.radius.full,
    padding: 3,
    marginBottom: ds.space[5] + 2,
  },
  segmentSlot: {
    flex: 1,
  },
  segment: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: ds.radius.full,
  },
  segmentActive: {
    backgroundColor: ds.colors.action,
    ...ds.shadow.md,
  },
  segmentText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.textSecondary,
  },
  segmentTextActive: {
    color: ds.colors.white,
  },
  dayTabs: {
    gap: ds.space[3],
    paddingRight: ds.space[5],
    paddingTop: ds.space[1],
  },
  dayTab: {
    paddingVertical: ds.space[3],
    paddingHorizontal: ds.space[5] - 2,
    borderRadius: ds.radius.full,
    borderWidth: 1,
    borderColor: ds.colors.border,
    backgroundColor: ds.colors.surface,
  },
  dayTabActive: {
    backgroundColor: ds.colors.action,
    borderColor: ds.colors.action,
  },
  dayTabText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  dayTabTextActive: {
    color: ds.colors.white,
  },
  dayTabAlert: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: ds.colors.errorSoft,
    borderRadius: ds.radius.m,
    paddingVertical: ds.space[3] + 2,
    paddingHorizontal: ds.space[4],
    marginBottom: ds.space[5],
  },
  bannerIcon: {
    marginRight: ds.space[3],
    marginTop: 1,
  },
  bannerText: {
    flex: 1,
    fontFamily: ds.fontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
    color: ds.colors.errorText,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: ds.colors.infoSoft,
    borderRadius: ds.radius.m,
    paddingVertical: ds.space[3] + 2,
    paddingHorizontal: ds.space[4],
    marginBottom: ds.space[5],
  },
  infoBannerText: {
    flex: 1,
    fontFamily: ds.fontFamily.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: ds.colors.infoText,
  },
  ideaRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: ds.space[4],
    marginBottom: ds.space[3] + 2,
  },
  ideaIcon: {
    width: 40,
    height: 40,
    borderRadius: ds.radius.m,
    alignItems: "center",
    justifyContent: "center",
    marginRight: ds.space[4],
  },
  ideaBody: {
    flex: 1,
    minWidth: 0,
  },
  ideaTitle: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.text,
  },
  ideaMeta: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginTop: 1,
  },
  ideaAction: {
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.m,
    paddingVertical: ds.space[3] - 2,
    paddingHorizontal: ds.space[4] - 2,
    marginLeft: ds.space[3],
  },
  ideaActionText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.action,
  },
  stopRow: {
    flexDirection: "row",
    paddingVertical: ds.space[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  stopTimeColumn: {
    width: 44,
    alignItems: "flex-end",
    paddingTop: 2,
  },
  stopTime: {
    fontFamily: ds.fontFamily.metaSemibold,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.scale.neutral[2],
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: ds.space[4],
  },
  stopBody: {
    flex: 1,
    minWidth: 0,
  },
  stopTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ds.space[3],
  },
  stopTitle: {
    flex: 1,
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13.5,
    color: ds.colors.text,
  },
  stopTitleDimmed: {
    color: ds.colors.textSecondary,
    textDecorationLine: "line-through",
  },
  stopMeta: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },
  transferRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[2],
    marginTop: ds.space[2] + 1,
  },
  transferText: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 10.5,
    color: ds.colors.textSecondary,
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: ds.space[2],
    borderWidth: 1,
    borderColor: ds.colors.actionSubtle,
    backgroundColor: ds.colors.actionSubtle,
    borderRadius: ds.radius.full,
    paddingVertical: ds.space[2],
    paddingHorizontal: ds.space[3] + 2,
    marginTop: ds.space[3],
  },
  voteText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.action,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3],
    paddingTop: ds.space[5],
    paddingLeft: 56,
  },
  addRowText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.action,
  },
  fab: {
    position: "absolute",
    right: ds.space[6],
    // Sopra la tab bar flottante, come la barra azioni delle altre schermate.
    bottom: ds.layout.actionBarBottom + 4,
    width: 52,
    height: 52,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.action,
    alignItems: "center",
    justifyContent: "center",
    ...ds.shadow.lg,
  },
});
