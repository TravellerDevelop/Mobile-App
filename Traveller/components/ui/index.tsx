/* ============================================================
   Traveller — Componenti UI del design system PierTour
   Blocchi condivisi da tutte le schermate ridisegnate.
   ============================================================ */

import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds, avatarColor, initials as toInitials } from "../../global/designSystem";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/* ---- Header brand ------------------------------------------
   Fascia viola in cima alla schermata. Il contenuto sottostante
   va avvolto in <Sheet> per ottenere l'aggancio con gli angoli
   arrotondati previsto dal design.
   ------------------------------------------------------------ */
interface BrandHeaderProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  paddingTop?: number;
  paddingBottom?: number;
}

export function BrandHeader({ children, style, paddingTop, paddingBottom }: BrandHeaderProps) {
  return (
    <View
      style={[
        styles.brandHeader,
        paddingTop != null && { paddingTop },
        paddingBottom != null && { paddingBottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ---- Foglio bianco -----------------------------------------
   Superficie con angoli superiori arrotondati che risale di
   14px sopra l'header brand.
   ------------------------------------------------------------ */
interface SheetProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  overlap?: number;
}

export function Sheet({ children, style, overlap = ds.layout.sheetOverlap }: SheetProps) {
  return (
    <View style={[styles.sheet, { marginTop: overlap }, style]}>{children}</View>
  );
}

/* ---- Etichetta di sezione (maiuscolo + tracking) ------------ */
export function SectionLabel({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[ds.type.sectionLabel, styles.sectionLabel, style]}>{children}</Text>;
}

/* ---- Avatar con iniziali ------------------------------------
   Colore deterministico sul nome, così lo stesso utente ha
   sempre lo stesso colore in tutta l'app.
   ------------------------------------------------------------ */
interface InitialsAvatarProps {
  name?: string | null;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function InitialsAvatar({
  name,
  size = 32,
  color,
  style,
  textStyle,
}: InitialsAvatarProps) {
  const label = toInitials(name);
  const bg = color || avatarColor(name);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: ds.radius.full,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.avatarLabel,
          { fontSize: Math.max(10, Math.round(size * 0.4)) },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/* ---- Badge di stato ----------------------------------------- */
export type BadgeIntent = "success" | "warning" | "error" | "info" | "neutral";

const badgeIntents: Record<BadgeIntent, { bg: string; fg: string }> = {
  success: { bg: ds.colors.successSoft, fg: ds.colors.successText },
  warning: { bg: ds.colors.warningSoft, fg: ds.colors.warningText },
  error: { bg: ds.colors.errorSoft, fg: ds.colors.errorText },
  info: { bg: ds.colors.infoSoft, fg: ds.colors.infoText },
  neutral: { bg: ds.colors.scale.neutral[3], fg: ds.colors.textSecondary },
};

interface StatusBadgeProps {
  label: string;
  intent?: BadgeIntent;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function StatusBadge({ label, intent = "neutral", style, textStyle }: StatusBadgeProps) {
  const tone = badgeIntents[intent] ?? badgeIntents.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }, style]}>
      <Text style={[styles.badgeText, { color: tone.fg }, textStyle]}>{label}</Text>
    </View>
  );
}

/* ---- Chip sull'header brand ---------------------------------
   variant "ghost" = translucido sul viola, "solid" = pillola bianca
   ------------------------------------------------------------ */
interface HeaderChipProps {
  icon?: IconName;
  label: string;
  onPress?: () => void;
  variant?: "ghost" | "solid";
  style?: StyleProp<ViewStyle>;
}

export function HeaderChip({ icon, label, onPress, variant = "ghost", style }: HeaderChipProps) {
  const solid = variant === "solid";
  const fg = solid ? ds.colors.action : ds.colors.white;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View style={[solid ? styles.chipSolid : styles.chipGhost, style]}>
        {icon ? (
          <MaterialCommunityIcons name={icon} size={14} color={fg} style={styles.chipIcon} />
        ) : null}
        <Text style={[styles.chipLabel, { color: fg }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ---- Campo di ricerca --------------------------------------- */
interface SearchFieldProps extends TextInputProps {
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function SearchField({ style, inputStyle, ...props }: SearchFieldProps) {
  return (
    <View style={[styles.searchField, style]}>
      <MaterialCommunityIcons
        name="magnify"
        size={16}
        color={ds.colors.textPlaceholder}
        style={{ marginRight: ds.space[3] }}
      />
      <TextInput
        placeholderTextColor={ds.colors.textPlaceholder}
        style={[styles.searchInput, inputStyle]}
        {...props}
      />
    </View>
  );
}

/* ---- Card generica (bordo sottile, niente ombra) ------------ */
export function Card({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ---- Bottone primario --------------------------------------- */
interface PrimaryButtonProps {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  style,
  textStyle,
  disabled,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled}>
      <View style={[styles.primaryButton, disabled && styles.primaryButtonDisabled, style]}>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={16}
            color={ds.colors.white}
            style={styles.chipIcon}
          />
        ) : null}
        <Text style={[styles.primaryButtonText, textStyle]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ---- Bottone secondario (contorno) -------------------------- */
interface SecondaryButtonProps {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  tone?: string;
}

export function SecondaryButton({
  label,
  onPress,
  style,
  textStyle,
  tone,
}: SecondaryButtonProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.secondaryButton, style]}>
        <Text
          style={[styles.secondaryButtonText, tone ? { color: tone } : null, textStyle]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* ---- Stato vuoto -------------------------------------------- */
interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = "compass-outline",
  title,
  description,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.emptyState, style]}>
      <MaterialCommunityIcons name={icon} size={28} color={ds.colors.textPlaceholder} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyDescription}>{description}</Text> : null}
    </View>
  );
}

/* ---- Sfondo statico per il rimbalzo iOS ----------------------
   Su iOS lo scroll oltre i bordi ("bounce") rivela lo sfondo reale
   dello ScrollView: se è un unico colore piatto, in cima si vede lo
   sfondo del contenuto sotto l'header (bianco/grigio) invece del
   colore dell'header, e in fondo si vede il colore dell'header
   invece di quello del contenuto — un "distacco" vistoso.

   Questo componente va messo come primo figlio del contenitore
   (fratello dello ScrollView, con lo ScrollView a sfondo
   trasparente): è statico, quindi resta fermo durante lo scroll e
   mostra sempre il colore giusto nel breve lampo del rimbalzo,
   sia in cima che in fondo.
   ------------------------------------------------------------ */
interface OverscrollBackdropProps {
  /** Colore rivelato rimbalzando oltre il bordo superiore (di solito l'header) */
  topColor: string;
  /** Colore rivelato rimbalzando oltre il bordo inferiore (di solito il foglio/contenuto) */
  bottomColor?: string;
  /** Altezza della fascia superiore: deve solo superare la massima distanza di rimbalzo */
  topHeight?: number;
}

export function OverscrollBackdrop({
  topColor,
  bottomColor = ds.colors.bgApp,
  topHeight = 280,
}: OverscrollBackdropProps) {
  return (
    <View style={styles.overscrollBackdrop} pointerEvents="none">
      <View style={{ height: topHeight, backgroundColor: topColor }} />
      <View style={{ flex: 1, backgroundColor: bottomColor }} />
    </View>
  );
}

/* ---- Barra di avanzamento ----------------------------------- */
interface ProgressTrackProps {
  progress?: number;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressTrack({
  progress = 0,
  color = ds.colors.action,
  height = 8,
  style,
}: ProgressTrackProps) {
  const pct = Math.max(0, Math.min(1, Number.isNaN(progress) ? 0 : progress));

  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }, style]}>
      <View
        style={{
          width: `${pct * 100}%`,
          height: "100%",
          backgroundColor: color,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  brandHeader: {
    backgroundColor: ds.colors.brand,
    paddingHorizontal: ds.layout.headerPaddingH,
    paddingTop: ds.layout.headerPaddingTop,
    paddingBottom: ds.space[7],
  },
  sheet: {
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.layout.sheetRadius,
    borderTopRightRadius: ds.layout.sheetRadius,
    paddingHorizontal: ds.layout.screenPadding,
    paddingTop: ds.space[6],
    minHeight: 520,
    flexGrow: 1,
  },
  sectionLabel: {
    marginBottom: ds.space[3],
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    color: ds.colors.white,
    fontFamily: ds.fontFamily.semibold,
  },
  badge: {
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[2],
    borderRadius: ds.radius.s,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontFamily: ds.fontFamily.metaSemibold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  chipGhost: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: ds.colors.onBrandChipBg,
    borderWidth: 1,
    borderColor: ds.colors.onBrandChipBorder,
    borderRadius: ds.radius.full,
    paddingVertical: ds.space[3],
    paddingHorizontal: ds.space[4] + 2,
  },
  chipSolid: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: ds.colors.white,
    borderRadius: ds.radius.full,
    paddingVertical: ds.space[3],
    paddingHorizontal: ds.space[4] + 2,
  },
  chipIcon: {
    marginRight: ds.space[2] + 2,
  },
  chipLabel: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ds.colors.surfaceSunken,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.m,
    height: ds.control.md,
    paddingHorizontal: ds.space[4],
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    color: ds.colors.text,
  },
  card: {
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    backgroundColor: ds.colors.surface,
    padding: ds.space[5] - 2,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: ds.control.lg + 2,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    ...ds.shadow.lg,
  },
  primaryButtonDisabled: {
    backgroundColor: ds.colors.disabledBg,
  },
  primaryButtonText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.white,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    height: ds.control.md,
    borderRadius: ds.radius.m,
    borderWidth: 1,
    borderColor: ds.colors.border,
    backgroundColor: ds.colors.surface,
  },
  secondaryButtonText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.action,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: ds.space[8],
  },
  emptyTitle: {
    ...ds.type.bodyStrong,
    marginTop: ds.space[3],
    textAlign: "center",
  },
  emptyDescription: {
    ...ds.type.caption,
    marginTop: ds.space[1],
    textAlign: "center",
  },
  progressTrack: {
    width: "100%",
    backgroundColor: ds.colors.scale.neutral[3],
    overflow: "hidden",
  },
  overscrollBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
});

export { ds };
