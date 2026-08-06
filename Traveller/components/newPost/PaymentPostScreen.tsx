import React from "react";
import {
  ActivityIndicator,
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
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds, avatarColor, initials } from "../../global/designSystem";
import { OverscrollBackdrop } from "../ui";
import { FieldInput, SectionLabel, SegmentedControl, ToggleRow } from "./fields";
import { POST_TYPE_OPTIONS } from "./postTypes";
import type { NewPostForm } from "./useNewPostForm";
import type { RecipientMode } from "./types";

interface PaymentPostScreenProps {
  form: NewPostForm;
  onClose: () => void;
}

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

/* Schermata dedicata al tipo "Pagamento" del flusso Nuovo post:
   hero a gradiente con importo grande al centro, come da design. */
export default function PaymentPostScreen({ form, onClose }: PaymentPostScreenProps) {
  const shownRecipients =
    form.recipientMode === "custom"
      ? form.otherParticipants.filter((p) => form.selectedRecipients.includes(p.userid))
      : form.recipientMode === "all"
        ? form.otherParticipants
        : [];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <OverscrollBackdrop topColor={ds.colors.brand} bottomColor={ds.colors.surface} />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[ds.colors.brand, ds.colors.action]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <MaterialCommunityIcons
            name="wallet"
            size={120}
            color="rgba(255,255,255,0.07)"
            style={styles.heroDecor}
          />

          <View style={styles.heroTopRow}>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={onClose}
            >
              <View style={styles.closeChip}>
                <MaterialCommunityIcons name="close" size={17} color={ds.colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Nuovo pagamento</Text>
            <View style={styles.closeChipSpacer} />
          </View>

          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Importo del pagamento</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>€</Text>
              <TextInput
                value={form.amount}
                onChangeText={form.setAmount}
                placeholder="0,00"
                placeholderTextColor="rgba(255,255,255,0.5)"
                inputMode="decimal"
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
            </View>
          </View>

          <View style={styles.typeTabs}>
            {POST_TYPE_OPTIONS.map((option) => {
              const isActive = option.type === form.type;

              return (
                <TouchableOpacity
                  key={option.type}
                  activeOpacity={0.8}
                  onPress={() => form.setType(option.type)}
                >
                  <View style={[styles.typeTab, isActive && styles.typeTabActive]}>
                    <MaterialCommunityIcons
                      name={option.icon as never}
                      size={16}
                      color={isActive ? option.color : ds.colors.white}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>

        <View style={styles.sheet}>
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

          <SectionLabel>Scontrino</SectionLabel>

          {form.receipt ? (
            <View style={styles.receiptPreviewWrap}>
              <Image source={{ uri: form.receipt.uri }} style={styles.receiptPreview} />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={form.removeReceipt}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.receiptRemove}
              >
                <MaterialCommunityIcons name="close" size={14} color={ds.colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity activeOpacity={0.8} onPress={form.pickReceipt}>
              <View style={styles.receiptAdd}>
                <MaterialCommunityIcons
                  name="receipt-text-outline"
                  size={16}
                  color={ds.colors.action}
                />
                <Text style={styles.receiptAddText}>Allega scontrino</Text>
              </View>
            </TouchableOpacity>
          )}

          <ToggleRow
            icon="pin-outline"
            label="Fissa il post in alto"
            value={form.pinned}
            onToggle={form.togglePinned}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={form.submit}
            disabled={!form.canSubmit || form.isSubmitting}
            style={styles.submitWrap}
          >
            <View style={[styles.submit, !form.canSubmit && styles.submitDisabled]}>
              {form.isSubmitting ? (
                <ActivityIndicator color={ds.colors.white} />
              ) : (
                <Text style={styles.submitText}>Crea post</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ds.colors.bgApp,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: ds.layout.contentBottomPadding,
  },
  hero: {
    paddingTop: 60,
    paddingHorizontal: ds.layout.headerPaddingH,
    paddingBottom: ds.space[8] + 2,
    position: "relative",
    overflow: "hidden",
  },
  heroDecor: {
    position: "absolute",
    right: -16,
    top: 6,
    transform: [{ rotate: "10deg" }],
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ds.space[6] + 2,
  },
  closeChip: {
    width: 32,
    height: 32,
    borderRadius: ds.radius.full,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeChipSpacer: {
    width: 32,
  },
  heroTitle: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  amountBlock: {
    alignItems: "center",
    marginBottom: ds.space[6] + 2,
  },
  amountLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.68)",
    marginBottom: ds.space[3],
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  currency: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 24,
    color: "rgba(255,255,255,0.75)",
    marginRight: ds.space[2] + 2,
  },
  amountInput: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 44,
    letterSpacing: -0.4,
    color: ds.colors.white,
    padding: 0,
    minWidth: 60,
  },
  typeTabs: {
    flexDirection: "row",
    gap: ds.space[3],
    justifyContent: "center",
  },
  typeTab: {
    width: 38,
    height: 38,
    borderRadius: ds.radius.m,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  typeTabActive: {
    backgroundColor: ds.colors.white,
  },
  sheet: {
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.layout.sheetRadius,
    borderTopRightRadius: ds.layout.sheetRadius,
    marginTop: ds.layout.sheetOverlap,
    padding: ds.layout.screenPadding,
    paddingTop: ds.space[6] + 2,
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
    marginBottom: ds.space[6],
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
  receiptAdd: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: ds.control.md,
    borderRadius: ds.radius.m,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: ds.colors.action,
    marginBottom: ds.space[5],
  },
  receiptAddText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.action,
    marginLeft: ds.space[2],
  },
  receiptPreviewWrap: {
    position: "relative",
    alignSelf: "flex-start",
    marginBottom: ds.space[5],
  },
  receiptPreview: {
    width: 96,
    height: 96,
    borderRadius: ds.radius.l,
    backgroundColor: ds.colors.scale.neutral[4],
  },
  receiptRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[9],
    alignItems: "center",
    justifyContent: "center",
  },
  submitWrap: {
    marginTop: ds.space[6],
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
