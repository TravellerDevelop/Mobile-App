import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";
import { OverscrollBackdrop } from "../ui";
import { ToggleRow } from "./fields";
import { POST_TYPE_OPTIONS } from "./postTypes";
import type { NewPostForm } from "./useNewPostForm";

interface PostHeroScreenProps {
  form: NewPostForm;
  onClose: () => void;
  /** Icona grande e semitrasparente sullo sfondo dell'hero */
  icon: string;
  /** Titolo mostrato al centro della barra superiore */
  title: string;
  /** Sottotitolo descrittivo, come nelle altre hero (Money, Biglietti) */
  description: string;
  /** Coppia di colori del gradiente 135deg, specifica per tipo */
  gradientColors: readonly [string, string];
  /** Campi specifici del tipo di post */
  children: React.ReactNode;
}

/* Shell condivisa dalle schermate dedicate del flusso "Nuovo post":
   hero a gradiente (colorata per tipo) + tab di cambio tipo + foglio
   bianco con i campi, il toggle "fissa" e il bottone di invio. */
export default function PostHeroScreen({
  form,
  onClose,
  icon,
  title,
  description,
  gradientColors,
  children,
}: PostHeroScreenProps) {
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <OverscrollBackdrop topColor={gradientColors[0]} bottomColor={ds.colors.surface} />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <MaterialCommunityIcons
            name={icon as never}
            size={120}
            color="rgba(255,255,255,0.08)"
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
            <Text style={styles.heroTitle}>{title}</Text>
            <View style={styles.closeChipSpacer} />
          </View>

          <Text style={styles.heroDescription}>{description}</Text>

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
          {children}

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
    paddingBottom: ds.space[7],
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
    marginBottom: ds.space[3] + 2,
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
    fontFamily: ds.fontFamily.bold,
    fontSize: 16,
    color: ds.colors.white,
  },
  heroDescription: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.75)",
    maxWidth: 280,
    marginBottom: ds.space[6],
  },
  typeTabs: {
    flexDirection: "row",
    gap: ds.space[3],
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
  submitWrap: {
    marginTop: ds.space[3],
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
