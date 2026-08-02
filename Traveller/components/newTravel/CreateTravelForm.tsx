import React, { useState } from "react";
import {
  Image,
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ds } from "../../global/designSystem";
import { InitialsAvatar } from "../ui";
import { FieldCard, FieldInput, SectionLabel } from "../newPost/fields";
import type { CreateTravelForm as CreateTravelFormState } from "./useCreateTravelForm";
import type { Friend } from "./types";

interface CreateTravelFormProps {
  form: CreateTravelFormState;
}

type DateField = "start" | "end";

const formatDate = (date: Date | null) =>
  date ? date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "";

/* ---- Campo con icona a sinistra (nome, destinazione, date) --- */
interface IconFieldProps {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChangeText?: (value: string) => void;
  onPress?: () => void;
  compact?: boolean;
}

function IconField({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  onPress,
  compact,
}: IconFieldProps) {
  const content = (
    <View style={[styles.iconField, compact && styles.iconFieldCompact]}>
      <MaterialCommunityIcons
        name={icon as never}
        size={compact ? 15 : 16}
        color={ds.colors.textSecondary}
      />

      {onPress ? (
        <Text
          style={[
            styles.iconFieldText,
            compact && styles.iconFieldTextCompact,
            !value && styles.placeholder,
          ]}
        >
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

export default function CreateTravelForm({ form }: CreateTravelFormProps) {
  const [pickerField, setPickerField] = useState<DateField | null>(null);
  const [isFriendPickerOpen, setFriendPickerOpen] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");

  const onChangeDate = (event: { type: string }, selected?: Date) => {
    const field = pickerField;
    if (Platform.OS !== "ios") setPickerField(null);
    if (event.type !== "set" || !selected || !field) return;

    if (field === "start") form.setStartDate(selected);
    else form.setEndDate(selected);
  };

  const visibleFriends = form.friends.filter((friend) =>
    friendQuery.trim() === ""
      ? true
      : `${friend.name} ${friend.surname} ${friend.username}`
          .toLowerCase()
          .includes(friendQuery.trim().toLowerCase())
  );

  /* Avatar della riga "Invita amici": mostra prima gli invitati */
  const friendRow: Friend[] = [
    ...form.invited,
    ...form.friends.filter((friend) => !form.isInvited(friend)),
  ].slice(0, 6);

  return (
    <>
      {/* Copertina */}
      <TouchableOpacity activeOpacity={0.85} onPress={form.pickCover}>
        {form.cover ? (
          <View style={styles.coverFilled}>
            <Image source={{ uri: form.cover.uri }} style={styles.coverImage} />
            <View style={styles.coverBadge}>
              <MaterialCommunityIcons name="pencil" size={13} color={ds.colors.white} />
            </View>
          </View>
        ) : (
          <View style={styles.cover}>
            <View style={styles.coverIcon}>
              <MaterialCommunityIcons
                name="image-plus"
                size={20}
                color={ds.colors.action}
              />
            </View>
            <Text style={styles.coverLabel}>Aggiungi copertina</Text>
          </View>
        )}
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
          value={
            (pickerField === "start" ? form.startDate : form.endDate) ?? new Date()
          }
          minimumDate={pickerField === "end" ? form.startDate ?? undefined : undefined}
          onChange={onChangeDate}
        />
      )}

      {Platform.OS === "ios" && pickerField && (
        <TouchableOpacity onPress={() => setPickerField(null)}>
          <Text style={styles.pickerDone}>Fatto</Text>
        </TouchableOpacity>
      )}

      {/* Invita amici */}
      <View style={styles.sectionRow}>
        <SectionLabel>Invita amici</SectionLabel>
        {form.friends.length > 0 && (
          <TouchableOpacity activeOpacity={0.7} onPress={() => setFriendPickerOpen(true)}>
            <Text style={styles.sectionAction}>Vedi tutti</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.friendsRow}
        contentContainerStyle={styles.friendsRowContent}
      >
        {friendRow.map((friend) => {
          const selected = form.isInvited(friend);

          return (
            <TouchableOpacity
              key={friend._id}
              activeOpacity={0.8}
              onPress={() => form.toggleFriend(friend)}
            >
              <View style={styles.friend}>
                <View>
                  <InitialsAvatar
                    name={`${friend.name} ${friend.surname}`}
                    size={48}
                    style={selected ? styles.friendSelected : undefined}
                  />
                  {selected && (
                    <View style={styles.friendCheck}>
                      <MaterialCommunityIcons
                        name="check"
                        size={11}
                        color={ds.colors.white}
                      />
                    </View>
                  )}
                </View>
                <Text style={styles.friendName} numberOfLines={1}>
                  {friend.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity activeOpacity={0.8} onPress={() => setFriendPickerOpen(true)}>
          <View style={styles.friend}>
            <View style={styles.friendAdd}>
              <MaterialCommunityIcons
                name="plus"
                size={18}
                color={ds.colors.textSecondary}
              />
            </View>
            <Text style={styles.friendName}>Aggiungi</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

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

      {/* Campi facoltativi conservati dal form precedente */}
      <SectionLabel>Dettagli facoltativi</SectionLabel>

      <FieldInput
        label="Descrizione"
        placeholder="Racconta di cosa si tratta…"
        value={form.description}
        onChangeText={form.setDescription}
        multiline
        style={styles.multiline}
      />

      <FieldInput
        label="Budget del viaggio (€)"
        placeholder="Es. 1200"
        value={form.budget}
        onChangeText={form.setBudget}
        inputMode="decimal"
        keyboardType="decimal-pad"
      />

      {/* Selettore amici a tutta pagina */}
      <Modal
        visible={isFriendPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFriendPickerOpen(false)}
      >
        <View style={styles.pickerScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFriendPickerOpen(false)} />

          <View style={styles.pickerSheet}>
            <View style={styles.grabber} />
            <Text style={styles.pickerTitle}>Invita amici</Text>

            <FieldCard label="Cerca">
              <TextInput
                value={friendQuery}
                onChangeText={setFriendQuery}
                placeholder="Nome o username"
                placeholderTextColor={ds.colors.textPlaceholder}
                style={styles.pickerSearch}
              />
            </FieldCard>

            <ScrollView style={styles.pickerList}>
              {visibleFriends.map((friend) => {
                const selected = form.isInvited(friend);

                return (
                  <TouchableOpacity
                    key={friend._id}
                    activeOpacity={0.7}
                    onPress={() => form.toggleFriend(friend)}
                  >
                    <View style={styles.pickerRow}>
                      <InitialsAvatar name={`${friend.name} ${friend.surname}`} size={38} />
                      <View style={styles.pickerRowText}>
                        <Text style={styles.pickerRowName}>
                          {friend.name} {friend.surname}
                        </Text>
                        <Text style={styles.pickerRowUsername}>@{friend.username}</Text>
                      </View>
                      <MaterialCommunityIcons
                        name={selected ? "checkbox-marked" : "checkbox-blank-outline"}
                        size={20}
                        color={selected ? ds.colors.action : ds.colors.scale.neutral[8]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}

              {visibleFriends.length === 0 && (
                <Text style={styles.pickerEmpty}>Nessun amico trovato</Text>
              )}
            </ScrollView>

            <TouchableOpacity activeOpacity={0.85} onPress={() => setFriendPickerOpen(false)}>
              <View style={styles.pickerDoneButton}>
                <Text style={styles.pickerDoneText}>
                  {form.invited.length > 0
                    ? `Invita ${form.invited.length} ${form.invited.length === 1 ? "amico" : "amici"}`
                    : "Chiudi"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cover: {
    height: 132,
    borderRadius: ds.radius.l,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: ds.colors.border,
    backgroundColor: ds.colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ds.space[6],
  },
  coverFilled: {
    height: 132,
    borderRadius: ds.radius.l,
    overflow: "hidden",
    marginBottom: ds.space[6],
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverBadge: {
    position: "absolute",
    right: ds.space[3],
    bottom: ds.space[3],
    width: 28,
    height: 28,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  coverIcon: {
    width: 44,
    height: 44,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.actionSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ds.space[3],
  },
  coverLabel: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.action,
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
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionAction: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.action,
    marginBottom: ds.space[3] + 2,
  },
  friendsRow: {
    marginBottom: ds.space[6],
  },
  friendsRowContent: {
    alignItems: "flex-start",
  },
  friend: {
    alignItems: "center",
    marginRight: ds.space[3] + 2,
    width: 56,
  },
  friendSelected: {
    borderWidth: 2,
    borderColor: ds.colors.action,
  },
  friendCheck: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.action,
    borderWidth: 2,
    borderColor: ds.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  friendAdd: {
    width: 48,
    height: 48,
    borderRadius: ds.radius.full,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: ds.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  friendName: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 10,
    color: ds.colors.textSecondary,
    marginTop: ds.space[2] + 1,
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
    marginBottom: ds.space[7],
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
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  pickerScrim: {
    flex: 1,
    backgroundColor: ds.colors.scrim,
    justifyContent: "flex-end",
  },
  pickerSheet: {
    maxHeight: "80%",
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.layout.sheetRadius,
    borderTopRightRadius: ds.layout.sheetRadius,
    paddingTop: ds.space[4] + 2,
    paddingHorizontal: ds.space[5],
    paddingBottom: ds.space[8],
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
    fontSize: 17,
    color: ds.colors.text,
    marginBottom: ds.space[4],
  },
  pickerSearch: {
    padding: 0,
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    color: ds.colors.text,
  },
  pickerList: {
    marginBottom: ds.space[4],
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: ds.space[3] + 2,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  pickerRowText: {
    flex: 1,
    marginLeft: ds.space[3] + 2,
  },
  pickerRowName: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  pickerRowUsername: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  pickerEmpty: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    color: ds.colors.textSecondary,
    textAlign: "center",
    paddingVertical: ds.space[6],
  },
  pickerDoneButton: {
    height: ds.control.lg,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerDoneText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.white,
  },
});
