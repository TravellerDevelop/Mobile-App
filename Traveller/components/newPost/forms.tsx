import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds, avatarColor, initials } from "../../global/designSystem";
import { AddButton, FieldCard, FieldInput, SectionLabel, SegmentedControl } from "./fields";
import type { NewPostForm } from "./useNewPostForm";
import type { RecipientMode } from "./types";

interface FormProps {
  form: NewPostForm;
}

/* ---- Testo --------------------------------------------------- */
export function TextForm({ form }: FormProps) {
  return (
    <FieldInput
      label="Testo del post"
      placeholder="Scrivi qualcosa per il gruppo…"
      value={form.text}
      onChangeText={form.setText}
      multiline
      style={styles.multiline}
    />
  );
}

/* ---- Sondaggio ----------------------------------------------- */
export function VoteForm({ form }: FormProps) {
  return (
    <>
      <FieldInput
        label="Domanda"
        placeholder="Es. Dove ceniamo venerdì?"
        value={form.question}
        onChangeText={form.setQuestion}
      />

      <SectionLabel>Risposte</SectionLabel>

      {form.answers.map((answer, index) => (
        <View key={answer.key} style={styles.answerRow}>
          <View style={styles.answerField}>
            <FieldInput
              label={`Risposta ${index + 1}`}
              placeholder="Scrivi un'opzione"
              value={answer.label}
              onChangeText={(value) => form.updateAnswer(answer.key, value)}
              cardStyle={styles.answerCard}
            />
          </View>

          {form.answers.length > 2 && (
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => form.removeAnswer(answer.key)}
              style={styles.removeButton}
            >
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={18}
                color={ds.colors.errorText}
              />
            </TouchableOpacity>
          )}
        </View>
      ))}

      <AddButton label="Aggiungi risposta" onPress={form.addAnswer} />
    </>
  );
}

/* ---- Pagamento ----------------------------------------------- */
const recipientOptions: ReadonlyArray<{ value: RecipientMode; label: string }> = [
  { value: "all", label: "Tutti" },
  { value: "custom", label: "Personalizzato" },
  { value: "me", label: "Personale" },
];

const recipientHints: Record<RecipientMode, string> = {
  all: "Tutti i partecipanti del viaggio riceveranno la richiesta di pagamento.",
  custom: "Seleziona i partecipanti che riceveranno la richiesta di pagamento.",
  me: "Solo tu riceverai la richiesta di pagamento.",
};

export function PaymentForm({ form }: FormProps) {
  const shownRecipients =
    form.recipientMode === "custom"
      ? form.otherParticipants.filter((p) => form.selectedRecipients.includes(p.userid))
      : form.recipientMode === "all"
        ? form.otherParticipants
        : [];

  return (
    <>
      <FieldCard label="Importo del pagamento">
        <View style={styles.amountRow}>
          <Text style={styles.currency}>€</Text>
          <FieldInput
            label=""
            value={form.amount}
            onChangeText={form.setAmount}
            placeholder="0,00"
            inputMode="decimal"
            keyboardType="decimal-pad"
            cardStyle={styles.amountInputCard}
            style={styles.amountInput}
          />
        </View>
      </FieldCard>

      <FieldInput
        label="Note del pagamento"
        placeholder="Es. Airbnb, skipass, cena di gruppo…"
        value={form.paymentNote}
        onChangeText={form.setPaymentNote}
      />

      <SectionLabel>Destinatari</SectionLabel>

      <SegmentedControl
        options={recipientOptions}
        value={form.recipientMode}
        onChange={form.setRecipientMode}
      />

      <Text style={styles.hint}>{recipientHints[form.recipientMode]}</Text>

      {form.recipientMode === "custom" && (
        <View style={styles.recipientList}>
          {form.otherParticipants.map((participant) => {
            const isSelected = form.selectedRecipients.includes(participant.userid);

            return (
              <TouchableOpacity
                key={participant.userid}
                activeOpacity={0.7}
                onPress={() => form.toggleRecipient(participant.userid)}
              >
                <View style={styles.recipientRow}>
                  <MaterialCommunityIcons
                    name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={18}
                    color={isSelected ? ds.colors.action : ds.colors.scale.neutral[8]}
                  />
                  <Text style={styles.recipientName}>@{participant.username}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {shownRecipients.length > 0 && (
        <View style={styles.avatarStack}>
          {shownRecipients.map((participant, index) => (
            <View
              key={participant.userid}
              style={[
                styles.stackedAvatar,
                { backgroundColor: avatarColor(participant.username) },
                index === 0 && { marginLeft: 0 },
              ]}
            >
              <Text style={styles.stackedAvatarText}>{initials(participant.username)}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

/* ---- Immagini ------------------------------------------------- */
export function ImagesForm({ form }: FormProps) {
  return (
    <>
      <TouchableOpacity activeOpacity={0.85} onPress={form.pickImages}>
        <View style={styles.picker}>
          <MaterialCommunityIcons
            name="image-plus"
            size={22}
            color={ds.colors.action}
          />
          <Text style={styles.pickerTitle}>Aggiungi immagini</Text>
          <Text style={styles.pickerHint}>Puoi selezionarne più di una</Text>
        </View>
      </TouchableOpacity>

      {form.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.preview}>
          {form.images.map((image) => (
            <View key={image.uri} style={styles.previewItem}>
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.previewRemove}
                onPress={() => form.removeImage(image.uri)}
              >
                <MaterialCommunityIcons name="close" size={12} color={ds.colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <FieldInput
        label="Descrizione"
        placeholder="Racconta queste foto…"
        value={form.imagesDescription}
        onChangeText={form.setImagesDescription}
      />
    </>
  );
}

/* ---- To Do ---------------------------------------------------- */
export function TodoForm({ form }: FormProps) {
  return (
    <>
      <FieldInput
        label="Titolo della lista"
        placeholder="Es. Checklist attrezzatura"
        value={form.todoDescription}
        onChangeText={form.setTodoDescription}
      />

      <SectionLabel>Voci della lista</SectionLabel>

      {form.todoItems.map((item, index) => (
        <View key={item.key} style={styles.answerRow}>
          <View style={styles.answerField}>
            <FieldInput
              label={`Voce ${index + 1}`}
              placeholder="Cosa c'è da fare?"
              value={item.label}
              onChangeText={(value) => form.updateTodoItem(item.key, value)}
              cardStyle={styles.answerCard}
            />
          </View>

          {form.todoItems.length > 1 && (
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => form.removeTodoItem(item.key)}
              style={styles.removeButton}
            >
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={18}
                color={ds.colors.errorText}
              />
            </TouchableOpacity>
          )}
        </View>
      ))}

      <AddButton label="Aggiungi voce" onPress={form.addTodoItem} />
    </>
  );
}

const styles = StyleSheet.create({
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  answerField: {
    flex: 1,
  },
  answerCard: {
    marginBottom: ds.space[3],
  },
  removeButton: {
    marginLeft: ds.space[3],
    marginBottom: ds.space[3],
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: ds.colors.action,
    paddingBottom: ds.space[3],
  },
  currency: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 26,
    lineHeight: 32,
    color: ds.colors.textSecondary,
    marginRight: ds.space[2] + 2,
  },
  amountInputCard: {
    flex: 1,
    borderWidth: 0,
    padding: 0,
    marginBottom: 0,
  },
  amountInput: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 32,
    lineHeight: 32,
    color: ds.colors.text,
  },
  hint: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[4],
  },
  recipientList: {
    marginBottom: ds.space[4],
  },
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: ds.space[3],
  },
  recipientName: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 13,
    color: ds.colors.text,
    marginLeft: ds.space[3],
  },
  avatarStack: {
    flexDirection: "row",
    marginBottom: ds.space[7] - 2,
  },
  stackedAvatar: {
    width: 32,
    height: 32,
    borderRadius: ds.radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: ds.colors.surface,
    marginLeft: -8,
  },
  stackedAvatarText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.white,
  },
  picker: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: ds.space[7],
    borderRadius: ds.radius.l,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: ds.colors.action,
    backgroundColor: ds.colors.actionSubtle,
    marginBottom: ds.space[4] + 2,
  },
  pickerTitle: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.action,
    marginTop: ds.space[3],
  },
  pickerHint: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginTop: ds.space[1],
  },
  preview: {
    marginBottom: ds.space[4] + 2,
  },
  previewItem: {
    marginRight: ds.space[3],
  },
  previewImage: {
    width: 96,
    height: 96,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.scale.neutral[3],
  },
  previewRemove: {
    position: "absolute",
    top: ds.space[2],
    right: ds.space[2],
    width: 20,
    height: 20,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scrim,
    alignItems: "center",
    justifyContent: "center",
  },
});
