import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ds } from "../../global/designSystem";
import { FieldInput } from "../../components/newPost/fields";
import { useEditTravelForm } from "../../components/newTravel/useEditTravelForm";
import type { EditableTravel } from "../../components/newTravel/types";

interface EditTravelProps {
  navigation: { goBack: () => void };
  route: { params: EditableTravel };
}

type DateField = "start" | "end";

const formatDate = (date: Date | null) =>
  date ? date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "";

/* Campo con icona a sinistra (nome, destinazione, date) — stesso pattern
   di components/newTravel/CreateTravelForm.tsx, duplicato qui perché
   quello resta interno al form di creazione. */
interface IconFieldProps {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChangeText?: (value: string) => void;
  onPress?: () => void;
  compact?: boolean;
}

function IconField({ label, icon, placeholder, value, onChangeText, onPress, compact }: IconFieldProps) {
  const content = (
    <View style={[styles.iconField, compact && styles.iconFieldCompact]}>
      <MaterialCommunityIcons name={icon as never} size={compact ? 15 : 16} color={ds.colors.textSecondary} />

      {onPress ? (
        <Text style={[styles.iconFieldText, compact && styles.iconFieldTextCompact, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={ds.colors.textPlaceholder}
          style={[styles.iconFieldText, compact && styles.iconFieldTextCompact]}
        />
      )}
    </View>
  );

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {onPress ? (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
    </View>
  );
}

/* Schermata "Modifica viaggio": modale con header X/Salva, riprende i campi
   del flusso "Nuovo viaggio" (copertina, nome, destinazione, date,
   descrizione, privacy) precompilati, più l'eliminazione del viaggio. */
export default function EditTravel({ navigation, route }: EditTravelProps) {
  const travel = route.params;
  const [pickerField, setPickerField] = useState<DateField | null>(null);

  const form = useEditTravelForm({ travel, onDone: navigation.goBack });

  const onChangeDate = (event: { type: string }, selected?: Date) => {
    const field = pickerField;
    if (Platform.OS !== "ios") setPickerField(null);
    if (event.type !== "set" || !selected || !field) return;

    if (field === "start") form.setStartDate(selected);
    else form.setEndDate(selected);
  };

  const confirmDelete = () => {
    Alert.alert(
      "Eliminare il viaggio?",
      `"${travel.name}" e tutti i post collegati verranno eliminati definitivamente.`,
      [
        { text: "Annulla", style: "cancel" },
        { text: "Elimina", style: "destructive", onPress: () => form.deleteTravel() },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Intestazione */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={navigation.goBack}
          >
            <View style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={17} color={ds.colors.text} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifica viaggio</Text>
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={form.submit} disabled={!form.canSubmit || form.isSubmitting}>
          <Text style={[styles.headerSave, (!form.canSubmit || form.isSubmitting) && styles.headerSaveDisabled]}>
            Salva
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        {/* Copertina */}
        <TouchableOpacity activeOpacity={0.85} onPress={form.pickCover}>
          <View style={styles.cover}>
            {form.coverUri ? (
              <Image source={{ uri: form.coverUri }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverFallback} />
            )}
            <View style={styles.coverOverlay} />
            <View style={styles.coverBadge}>
              <MaterialCommunityIcons name="image-edit-outline" size={14} color={ds.colors.action} />
              <Text style={styles.coverBadgeText}>Cambia copertina</Text>
            </View>
          </View>
        </TouchableOpacity>

        <IconField
          label="Nome del viaggio"
          icon="bag-suitcase-outline"
          placeholder="Es. Settimana bianca a Cortina"
          value={form.name}
          onChangeText={form.setName}
        />

        <IconField
          label="Destinazione"
          icon="map-marker-outline"
          placeholder="Dove andate?"
          value={form.destination}
          onChangeText={form.setDestination}
        />

        <View style={styles.datesRow}>
          <View style={styles.dateSlot}>
            <IconField
              label="Data inizio"
              icon="calendar-blank-outline"
              placeholder="gg/mm/aa"
              value={formatDate(form.startDate)}
              onPress={() => setPickerField("start")}
              compact
            />
          </View>
          <View style={[styles.dateSlot, styles.dateSlotLast]}>
            <IconField
              label="Data fine"
              icon="calendar-blank-outline"
              placeholder="gg/mm/aa"
              value={formatDate(form.endDate)}
              onPress={() => setPickerField("end")}
              compact
            />
          </View>
        </View>

        {pickerField && (
          <DateTimePicker
            mode="date"
            display="default"
            value={(pickerField === "start" ? form.startDate : form.endDate) ?? new Date()}
            minimumDate={pickerField === "end" ? form.startDate ?? undefined : undefined}
            onChange={onChangeDate}
          />
        )}

        {Platform.OS === "ios" && pickerField && (
          <TouchableOpacity onPress={() => setPickerField(null)}>
            <Text style={styles.pickerDone}>Fatto</Text>
          </TouchableOpacity>
        )}

        <FieldInput
          label="Descrizione"
          placeholder="Racconta di cosa si tratta…"
          value={form.description}
          onChangeText={form.setDescription}
          multiline
          style={styles.multiline}
          cardStyle={styles.descriptionCard}
        />

        <FieldInput
          label="Budget del viaggio (€)"
          placeholder="Es. 1200"
          value={form.budget}
          onChangeText={form.setBudget}
          inputMode="decimal"
          keyboardType="decimal-pad"
          cardStyle={styles.descriptionCard}
        />

        {/* Privacy */}
        <View style={styles.privacyCard}>
          <View style={styles.privacyLeft}>
            <View style={styles.privacyIcon}>
              <MaterialCommunityIcons
                name={form.isPrivate ? "lock-outline" : "earth"}
                size={15}
                color={ds.colors.action}
              />
            </View>
            <View style={styles.privacyText}>
              <Text style={styles.privacyTitle}>
                {form.isPrivate ? "Viaggio privato" : "Viaggio pubblico"}
              </Text>
              <Text style={styles.privacyDescription}>
                {form.isPrivate
                  ? "Solo su invito, non visibile pubblicamente"
                  : "Visibile a tutti gli utenti di Traveller"}
              </Text>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={form.togglePrivate}>
            <View style={[styles.track, form.isPrivate && styles.trackOn]}>
              <View style={[styles.knob, form.isPrivate && styles.knobOn]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Elimina viaggio */}
        <TouchableOpacity activeOpacity={0.8} onPress={confirmDelete} disabled={form.isDeleting}>
          <View style={styles.deleteRow}>
            {form.isDeleting ? (
              <ActivityIndicator color={ds.colors.errorText} size="small" />
            ) : (
              <MaterialCommunityIcons name="delete-outline" size={16} color={ds.colors.errorText} />
            )}
            <Text style={styles.deleteLabel}>Elimina viaggio</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Azione principale */}
      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={form.submit} disabled={!form.canSubmit || form.isSubmitting}>
          <View style={[styles.submit, !form.canSubmit && styles.submitDisabled]}>
            {form.isSubmitting ? (
              <ActivityIndicator color={ds.colors.white} />
            ) : (
              <Text style={styles.submitText}>Salva modifiche</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ds.colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 64,
    paddingHorizontal: ds.layout.screenPadding,
    paddingBottom: ds.space[4] + 2,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[3],
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 16,
    color: ds.colors.text,
    marginLeft: ds.space[4],
  },
  headerSave: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.action,
  },
  headerSaveDisabled: {
    color: ds.colors.disabledText,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: ds.layout.screenPadding,
    paddingTop: ds.space[6],
    paddingBottom: ds.space[8],
  },
  cover: {
    height: 132,
    borderRadius: ds.radius.l,
    overflow: "hidden",
    marginBottom: ds.space[6],
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  coverFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ds.colors.scale.primary[11],
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(1,13,55,0.32)",
  },
  coverBadge: {
    position: "absolute",
    right: ds.space[3],
    bottom: ds.space[3],
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: ds.radius.full,
    paddingVertical: ds.space[3] - 1,
    paddingHorizontal: ds.space[4],
  },
  coverBadgeText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.action,
    marginLeft: ds.space[2],
  },
  fieldBlock: {
    marginBottom: ds.space[5],
  },
  fieldLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[3],
  },
  iconField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    paddingVertical: ds.space[4] + 1,
    paddingHorizontal: ds.space[4] + 2,
  },
  iconFieldCompact: {
    paddingHorizontal: ds.space[4],
  },
  iconFieldText: {
    flex: 1,
    padding: 0,
    marginLeft: ds.space[3] - 1,
    fontFamily: ds.fontFamily.regular,
    fontSize: 14,
    color: ds.colors.text,
  },
  iconFieldTextCompact: {
    fontSize: 13,
    marginLeft: ds.space[3] - 2,
  },
  placeholder: {
    color: ds.colors.textPlaceholder,
  },
  datesRow: {
    flexDirection: "row",
  },
  dateSlot: {
    flex: 1,
    marginRight: ds.space[3] + 2,
  },
  dateSlotLast: {
    marginRight: 0,
  },
  pickerDone: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.action,
    textAlign: "right",
    marginBottom: ds.space[4],
  },
  descriptionCard: {
    marginBottom: ds.space[6],
  },
  multiline: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    paddingVertical: ds.space[4] + 2,
    paddingHorizontal: ds.space[5],
    marginBottom: ds.space[5],
  },
  privacyLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.actionSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  privacyText: {
    flex: 1,
    marginLeft: ds.space[3] + 2,
    marginRight: ds.space[3],
  },
  privacyTitle: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  privacyDescription: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  track: {
    width: 40,
    height: 24,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[5],
    justifyContent: "center",
  },
  trackOn: {
    backgroundColor: ds.colors.action,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.white,
    marginLeft: 2,
    ...ds.shadow.md,
  },
  knobOn: {
    marginLeft: 18,
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3],
    borderWidth: 1,
    borderColor: ds.colors.errorSoft,
    borderRadius: ds.radius.l,
    paddingVertical: ds.space[4] + 2,
    paddingHorizontal: ds.space[5],
  },
  deleteLabel: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.errorText,
  },
  footer: {
    paddingTop: ds.space[4],
    paddingHorizontal: ds.layout.screenPadding,
    paddingBottom: ds.layout.contentBottomPadding,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },
  submit: {
    height: ds.control.lg,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    alignItems: "center",
    justifyContent: "center",
    ...ds.shadow.md,
  },
  submitDisabled: {
    backgroundColor: ds.colors.disabledBg,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.white,
  },
});
