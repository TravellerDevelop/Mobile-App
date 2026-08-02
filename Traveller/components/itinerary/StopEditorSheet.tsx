import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";
import { InitialsAvatar } from "../ui";
import { STOP_CATEGORY_OPTIONS } from "./categories";
import { searchPlace } from "./api";
import { minutesFromTime, timeFromMinutes } from "./schedule";
import type {
  ItineraryDay,
  PlaceSearchResult,
  Stop,
  StopCategory,
  StopInput,
  StopPlace,
} from "./types";

/* ============================================================
   Editor tappa: bottom sheet unico per creazione e modifica.
   Il giorno è opzionale — senza giorno la tappa resta un'idea
   nel backlog, che è il modo previsto per buttare giù un'idea
   al volo senza decidere quando farla.
   ============================================================ */

export interface EditorParticipant {
  userid: string;
  username: string;
}

interface StopEditorSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (param: StopInput) => Promise<void>;
  days: ItineraryDay[];
  participants: EditorParticipant[];
  /** Tappa da modificare; assente = nuova tappa */
  stop?: Stop | null;
  /** Giorno preselezionato per una nuova tappa (null = idea) */
  defaultDay?: number | null;
  /** Falso quando la modalità permessi consente solo di proporre idee */
  canChooseDay?: boolean;
}

export function StopEditorSheet({
  visible,
  onClose,
  onSubmit,
  days,
  participants,
  stop,
  defaultDay = null,
  canChooseDay = true,
}: StopEditorSheetProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<StopCategory>("visit");
  const [day, setDay] = useState<number | null>(defaultDay);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [place, setPlace] = useState<StopPlace | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Ogni apertura riparte dai valori della tappa (o da vuoto): tenere
     lo stato tra due aperture faceva riapparire dati della tappa prima. */
  useEffect(() => {
    if (!visible) return;

    setTitle(stop?.title ?? "");
    setCategory(stop?.category ?? "visit");
    setDay(stop ? stop.day : defaultDay);
    setStartTime(stop?.startTime ?? null);
    setDuration(stop?.duration ? String(stop.duration) : "");
    setCost(stop?.cost != null ? String(stop.cost) : "");
    setNotes(stop?.notes ?? "");
    setPlace(stop?.place ?? null);
    setSelected(stop?.participants ?? []);
    setPlaceQuery(stop?.place?.name ?? "");
    setPlaceResults([]);
    setError(null);
  }, [visible, stop, defaultDay]);

  /* Ricerca luogo con debounce: Nominatim accetta ~1 richiesta al secondo. */
  useEffect(() => {
    if (!visible) return;
    const query = placeQuery.trim();
    if (query.length < 3 || query === place?.name) {
      setPlaceResults([]);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlace(query);
        if (!cancelled) setPlaceResults(results);
      } catch (err) {
        if (!cancelled) setPlaceResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placeQuery, visible, place?.name]);

  const toggleParticipant = useCallback((userid: string) => {
    setSelected((prev) =>
      prev.includes(userid) ? prev.filter((id) => id !== userid) : [...prev, userid]
    );
  }, []);

  const pickPlace = useCallback((result: PlaceSearchResult) => {
    setPlace({
      name: result.name,
      address: result.address,
      lat: result.lat,
      lon: result.lon,
      osmId: result.osmId,
    });
    setPlaceQuery(result.name);
    setPlaceResults([]);
  }, []);

  const canSave = title.trim().length > 0 && !saving;

  const submit = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        category,
        day,
        startTime,
        duration: duration.trim() === "" ? null : Number(duration.replace(",", ".")),
        cost: cost.trim() === "" ? null : Number(cost.replace(",", ".")),
        notes: notes.trim(),
        place,
        participants: selected,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Non sono riuscito a salvare la tappa");
    } finally {
      setSaving(false);
    }
  }, [canSave, onSubmit, title, category, day, startTime, duration, cost, notes, place, selected, onClose]);

  const timeValue = useMemo(() => {
    const minutes = minutesFromTime(startTime);
    const date = new Date();
    if (minutes !== null) {
      date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    }
    return date;
  }, [startTime]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.grabber} />

        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{stop ? "Modifica tappa" : "Nuova tappa"}</Text>
          <TouchableOpacity onPress={submit} disabled={!canSave} hitSlop={hitSlop}>
            {saving ? (
              <ActivityIndicator size="small" color={ds.colors.action} />
            ) : (
              <Text style={[styles.save, !canSave && styles.saveDisabled]}>Salva</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Titolo</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Es. Colosseo"
            placeholderTextColor={ds.colors.textPlaceholder}
          />

          <Text style={styles.label}>Categoria</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {STOP_CATEGORY_OPTIONS.map((option) => {
              const active = option.value === category;
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.85}
                  onPress={() => setCategory(option.value)}
                >
                  <View style={[styles.categoryChip, active && styles.categoryChipActive]}>
                    <MaterialCommunityIcons
                      name={option.icon as never}
                      size={12}
                      color={active ? ds.colors.white : ds.colors.textSecondary}
                    />
                    <Text
                      style={[styles.categoryText, active && styles.categoryTextActive]}
                    >
                      {option.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>Luogo</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={ds.colors.textPlaceholder}
            />
            <TextInput
              style={styles.inputRowText}
              value={placeQuery}
              onChangeText={(text) => {
                setPlaceQuery(text);
                if (place) setPlace(null);
              }}
              placeholder="Cerca luogo…"
              placeholderTextColor={ds.colors.textPlaceholder}
            />
            {searching ? <ActivityIndicator size="small" color={ds.colors.action} /> : null}
          </View>

          {place?.address ? <Text style={styles.placeAddress}>{place.address}</Text> : null}

          {placeResults.map((result) => (
            <TouchableOpacity
              key={result.osmId}
              activeOpacity={0.85}
              onPress={() => pickPlace(result)}
            >
              <View style={styles.placeResult}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={14}
                  color={ds.colors.action}
                />
                <View style={styles.placeResultBody}>
                  <Text style={styles.placeResultName} numberOfLines={1}>
                    {result.name}
                  </Text>
                  <Text style={styles.placeResultAddress} numberOfLines={1}>
                    {result.address}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {canChooseDay ? (
            <>
              <Text style={styles.label}>Giorno</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                <TouchableOpacity activeOpacity={0.85} onPress={() => setDay(null)}>
                  <View style={[styles.dayChip, day === null && styles.dayChipActive]}>
                    <Text style={[styles.dayChipText, day === null && styles.dayChipTextActive]}>
                      Solo idea
                    </Text>
                  </View>
                </TouchableOpacity>

                {days.map((item) => {
                  const active = day === item.index;
                  return (
                    <TouchableOpacity
                      key={item.index}
                      activeOpacity={0.85}
                      onPress={() => setDay(item.index)}
                    >
                      <View style={[styles.dayChip, active && styles.dayChipActive]}>
                        <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                          Giorno {item.index + 1}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : (
            <Text style={styles.hint}>
              Con la modalità attuale la tua proposta resta tra le idee: sarà l'admin a
              metterla in un giorno.
            </Text>
          )}

          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <Text style={styles.label}>Orario (opzionale)</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => setTimePickerOpen(true)}>
                <View style={styles.input}>
                  <Text style={startTime ? styles.inputText : styles.inputPlaceholder}>
                    {startTime || "In giornata"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.column, styles.columnLast]}>
              <Text style={styles.label}>Durata (min)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="90"
                placeholderTextColor={ds.colors.textPlaceholder}
              />
            </View>
          </View>

          {startTime ? (
            <TouchableOpacity onPress={() => setStartTime(null)} hitSlop={hitSlop}>
              <Text style={styles.clearTime}>Togli l'orario</Text>
            </TouchableOpacity>
          ) : null}

          {timePickerOpen ? (
            <DateTimePicker
              mode="time"
              display="default"
              is24Hour
              value={timeValue}
              onChange={(event, date) => {
                if (Platform.OS !== "ios") setTimePickerOpen(false);
                if (event.type === "dismissed" || !date) return;
                setStartTime(timeFromMinutes(date.getHours() * 60 + date.getMinutes()));
              }}
            />
          ) : null}

          {Platform.OS === "ios" && timePickerOpen ? (
            <TouchableOpacity onPress={() => setTimePickerOpen(false)}>
              <Text style={styles.pickerDone}>Fatto</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.label}>Costo previsto</Text>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
            placeholder="€ 0,00"
            placeholderTextColor={ds.colors.textPlaceholder}
          />

          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Prenotazione, orari, cose da ricordare…"
            placeholderTextColor={ds.colors.textPlaceholder}
          />

          <Text style={styles.label}>Partecipanti</Text>
          <View style={styles.participants}>
            {participants.map((participant) => {
              const active = selected.includes(participant.userid);
              return (
                <TouchableOpacity
                  key={participant.userid}
                  activeOpacity={0.85}
                  onPress={() => toggleParticipant(participant.userid)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={participant.username}
                >
                  <InitialsAvatar
                    name={participant.username}
                    size={34}
                    style={active ? styles.avatarActive : styles.avatarInactive}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.hint}>
            Nessuno selezionato significa "tutto il gruppo".
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ---- Selettore giorno ---------------------------------------
   Alternativa accessibile al trascinamento: sposta un'idea (o una
   tappa) in un giorno con due tap.
   ------------------------------------------------------------ */
interface DayPickerSheetProps {
  visible: boolean;
  days: ItineraryDay[];
  title?: string;
  onClose: () => void;
  onPick: (day: number | null) => void;
  /** Mostra la voce per riportare la tappa tra le idee */
  allowBacklog?: boolean;
}

export function DayPickerSheet({
  visible,
  days,
  title = "Aggiungi al giorno",
  onClose,
  onPick,
  allowBacklog = false,
}: DayPickerSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />

      <View style={[styles.sheet, styles.pickerSheet]}>
        <View style={styles.grabber} />
        <Text style={styles.headerTitle}>{title}</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {days.length === 0 ? (
            <Text style={styles.hint}>
              Il viaggio non ha ancora date: impostale per creare i giorni.
            </Text>
          ) : null}

          {days.map((day) => (
            <TouchableOpacity
              key={day.index}
              activeOpacity={0.85}
              onPress={() => {
                onPick(day.index);
                onClose();
              }}
            >
              <View style={styles.pickerRow}>
                <Text style={styles.pickerLabel}>Giorno {day.index + 1}</Text>
                {day.date ? <Text style={styles.pickerDate}>{day.date}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}

          {allowBacklog ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onPick(null);
                onClose();
              }}
            >
              <View style={styles.pickerRow}>
                <Text style={[styles.pickerLabel, { color: ds.colors.action }]}>
                  Riporta tra le idee
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ds.colors.scrim,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88%",
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.radius.xl,
    borderTopRightRadius: ds.radius.xl,
    paddingHorizontal: ds.space[6],
    paddingTop: ds.space[4],
    paddingBottom: ds.space[9],
    ...ds.shadow.lg,
  },
  pickerSheet: {
    maxHeight: "60%",
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[6],
    alignSelf: "center",
    marginBottom: ds.space[5],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ds.space[5],
  },
  headerTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 18,
    color: ds.colors.text,
  },
  save: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.action,
  },
  saveDisabled: {
    color: ds.colors.disabledText,
  },
  error: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 12,
    color: ds.colors.errorText,
    marginBottom: ds.space[4],
  },
  label: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[2] + 2,
  },
  input: {
    height: ds.control.md,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.m,
    paddingHorizontal: ds.space[4],
    justifyContent: "center",
    marginBottom: ds.space[5] - 2,
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    color: ds.colors.text,
  },
  inputText: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    color: ds.colors.text,
  },
  inputPlaceholder: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    color: ds.colors.textPlaceholder,
  },
  textArea: {
    height: 84,
    paddingTop: ds.space[3],
    textAlignVertical: "top",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3],
    height: ds.control.md,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.m,
    paddingHorizontal: ds.space[4],
    marginBottom: ds.space[3],
  },
  inputRowText: {
    flex: 1,
    padding: 0,
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    color: ds.colors.text,
  },
  placeAddress: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[5] - 2,
  },
  placeResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3],
    paddingVertical: ds.space[3],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  placeResultBody: {
    flex: 1,
    minWidth: 0,
  },
  placeResultName: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  placeResultAddress: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  categoryRow: {
    gap: ds.space[3] - 1,
    paddingRight: ds.space[5],
    marginBottom: ds.space[5] - 2,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[2] + 1,
    paddingVertical: ds.space[3] - 1,
    paddingHorizontal: ds.space[4] - 1,
    borderRadius: ds.radius.full,
    borderWidth: 1,
    borderColor: ds.colors.border,
    backgroundColor: ds.colors.surface,
  },
  categoryChipActive: {
    backgroundColor: ds.colors.action,
    borderColor: ds.colors.action,
  },
  categoryText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11.5,
    color: ds.colors.textSecondary,
  },
  categoryTextActive: {
    color: ds.colors.white,
  },
  dayChip: {
    paddingVertical: ds.space[3] - 1,
    paddingHorizontal: ds.space[4],
    borderRadius: ds.radius.full,
    borderWidth: 1,
    borderColor: ds.colors.border,
    backgroundColor: ds.colors.surface,
  },
  dayChipActive: {
    backgroundColor: ds.colors.action,
    borderColor: ds.colors.action,
  },
  dayChipText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11.5,
    color: ds.colors.textSecondary,
  },
  dayChipTextActive: {
    color: ds.colors.white,
  },
  twoColumns: {
    flexDirection: "row",
  },
  column: {
    flex: 1,
    marginRight: ds.space[4] - 2,
  },
  columnLast: {
    marginRight: 0,
  },
  clearTime: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11.5,
    color: ds.colors.action,
    marginBottom: ds.space[5] - 2,
  },
  pickerDone: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.action,
    textAlign: "right",
    marginBottom: ds.space[4],
  },
  participants: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ds.space[3],
    marginBottom: ds.space[3],
  },
  avatarActive: {
    borderWidth: 2,
    borderColor: ds.colors.action,
  },
  avatarInactive: {
    opacity: 0.45,
  },
  hint: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[5] - 2,
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
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.text,
  },
  pickerDate: {
    fontFamily: ds.fontFamily.metaRegular,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
});
