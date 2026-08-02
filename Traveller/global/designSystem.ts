/* ============================================================
   Traveller — Design system PierTour
   Traduzione in React Native dei token del bundle di design
   (ds/colors.css, ds/typography.css, ds/spacing.css, ds/elevation.css)
   con l'override di brand Traveller (viola/blu).

   Uso: import { ds } from "../global/designSystem";
   ============================================================ */

import type { TextStyle, ViewStyle } from "react-native";

/* ---- Scale colore (Radix-style, 12 step) --------------------
   1–2   sfondi
   3–5   riempimenti interattivi
   6–8   bordi e separatori
   9–10  colori pieni (fill, bottoni)
   11–12 testo accessibile
   ------------------------------------------------------------ */
const scale = {
  primary: {
    1: "rgb(252, 253, 255)",
    2: "rgb(245, 249, 255)",
    3: "rgb(234, 243, 255)",
    4: "rgb(218, 234, 255)",
    5: "rgb(201, 224, 255)",
    6: "rgb(181, 210, 255)",
    7: "rgb(153, 191, 255)",
    8: "rgb(115, 164, 255)",
    9: "rgb(1, 21, 93)",
    10: "rgb(17, 47, 119)",
    11: "rgb(53, 95, 192)",
    12: "rgb(12, 41, 113)",
  },
  // Accent sovrascritto sul blu azione Traveller (#4960FF)
  accent: {
    1: "rgb(251, 253, 255)",
    2: "rgb(245, 249, 255)",
    3: "rgb(233, 243, 255)",
    4: "#dbe0ff",
    5: "rgb(200, 226, 255)",
    6: "rgb(179, 213, 255)",
    7: "rgb(153, 196, 252)",
    8: "rgb(113, 172, 248)",
    9: "#4960FF",
    10: "#3549e6",
    11: "#3b4ad1",
    12: "rgb(6, 51, 102)",
  },
  neutral: {
    1: "rgb(252, 253, 253)",
    2: "rgb(249, 250, 250)",
    3: "rgb(243, 244, 244)",
    4: "rgb(231, 233, 233)",
    5: "rgb(224, 225, 225)",
    6: "rgb(216, 217, 217)",
    7: "rgb(205, 206, 206)",
    8: "rgb(186, 187, 187)",
    9: "rgb(139, 140, 140)",
    10: "rgb(129, 130, 130)",
    11: "rgb(98, 99, 99)",
    12: "rgb(31, 32, 32)",
  },
  success: {
    3: "rgb(225, 248, 234)",
    9: "rgb(1, 107, 66)",
    10: "rgb(0, 92, 52)",
    11: "rgb(30, 122, 80)",
  },
  warning: {
    3: "rgb(255, 239, 210)",
    9: "rgb(158, 94, 0)",
    10: "rgb(143, 80, 0)",
    11: "rgb(167, 102, 18)",
  },
  error: {
    3: "rgb(255, 235, 232)",
    9: "rgb(209, 16, 24)",
    10: "rgb(192, 0, 0)",
    11: "rgb(214, 25, 29)",
  },
};

const colors = {
  scale,

  /* Assoluti */
  white: "rgb(255, 255, 255)",
  black: "rgb(1, 13, 55)", // navy quasi nero del brand (#010d37)

  /* Superfici e sfondi */
  bgApp: scale.neutral[3],
  surface: "rgb(255, 255, 255)",
  surfaceSunken: scale.neutral[2],
  surfaceHover: scale.neutral[3],

  /* Testo */
  text: "rgb(1, 13, 55)",
  textBody: scale.neutral[12],
  textSecondary: scale.neutral[11],
  textPlaceholder: scale.neutral[8],
  textOnAccent: "rgb(255, 255, 255)",
  textLink: "#4960FF",

  /* Bordi */
  border: scale.neutral[6],
  borderStrong: scale.neutral[8],
  borderSubtle: scale.neutral[4],

  /* Azione (blu interattivo) */
  action: "#4960FF",
  actionHover: "#3549e6",
  actionActive: "#2e3fc2",
  actionSubtle: "#eceeff",
  actionRing: scale.accent[8],

  /* Brand (viola — header, tab bar, loghi) */
  brand: "#4900FF",
  brandHover: "#3b00cc",

  /* Disabilitato */
  disabledBg: scale.neutral[5],
  disabledText: scale.neutral[8],

  /* Stati */
  success: scale.success[9],
  successSoft: scale.success[3],
  successText: scale.success[11],
  warning: scale.warning[9],
  warningSoft: scale.warning[3],
  warningText: scale.warning[11],
  error: scale.error[9],
  errorSoft: scale.error[3],
  errorText: scale.error[11],
  info: "#4900FF",
  infoSoft: "#ece4ff",
  infoText: "#4900FF",

  /* Trasparenze su header brand */
  onBrandMuted: "rgba(255,255,255,0.68)",
  onBrandFaint: "rgba(255,255,255,0.55)",
  onBrandChipBg: "rgba(255,255,255,0.12)",
  onBrandChipBorder: "rgba(255,255,255,0.22)",
  onCoverMuted: "rgba(255,255,255,0.75)",
  scrim: "rgba(1, 13, 55, 0.40)",
};

/* ---- Famiglie e pesi ---------------------------------------- */
const fontFamily = {
  regular: "poppins-regular",
  medium: "poppins-medium",
  semibold: "poppins-semibold",
  bold: "poppins-bold",
  metaRegular: "inter-regular",
  metaMedium: "inter-medium",
  metaSemibold: "inter-semibold",
  metaBold: "inter-bold",
};

/* ---- Scala tipografica (px) --------------------------------- */
const fontSize = {
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  16: 16,
  18: 18,
  19: 19,
  20: 20,
  22: 22,
  24: 24,
  26: 26,
  30: 30,
};

/* ---- Stili di testo pronti all'uso -------------------------- */
const type: Record<string, TextStyle> = {
  h1: { fontFamily: fontFamily.bold, fontSize: 22, color: colors.text },
  h2: { fontFamily: fontFamily.bold, fontSize: 18, color: colors.text },
  h3: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text },
  body: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textBody },
  bodyLoose: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textBody,
  },
  bodyStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    color: colors.text,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  /* Etichetta di sezione: SemiBold 12, maiuscolo, tracking 0.04em */
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    letterSpacing: 0.48,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  meta: {
    fontFamily: fontFamily.metaRegular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  metaStrong: {
    fontFamily: fontFamily.metaSemibold,
    fontSize: 11,
    color: colors.textSecondary,
  },
  amount: {
    fontFamily: fontFamily.metaBold,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    color: colors.textOnAccent,
  },
};

/* ---- Spaziature, raggi, altezze controlli -------------------- */
const space = {
  0: 0,
  1: 2,
  2: 4,
  3: 8,
  4: 12,
  5: 16,
  6: 20,
  7: 24,
  8: 32,
  9: 40,
  10: 48,
  12: 64,
};

const radius = {
  s: 4,
  m: 8,
  l: 12,
  xl: 16,
  "2xl": 24,
  full: 999,
};

const control = {
  sm: 32,
  md: 40,
  lg: 48,
};

/* ---- Elevazione --------------------------------------------- */
const shadow: Record<string, ViewStyle> = {
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "rgb(1, 13, 55)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
};

/* ---- Costanti di layout ricorrenti nel design ---------------- */
const layout = {
  screenPadding: 16,
  headerPaddingH: 20,
  headerPaddingTop: 66,
  sheetRadius: radius.xl,
  sheetOverlap: -14, // il foglio bianco risale sopra l'header brand
  tabBarWidth: 230,
  tabBarHeight: 56,
  tabBarBottom: 20,
  contentBottomPadding: 100,
  /* Le barre azioni ancorate in fondo devono stare SOPRA la tab bar
     flottante (20 dal fondo + 56 di altezza), altrimenti finiscono
     coperte: 88 = 20 + 56 + 12 di respiro. */
  actionBarBottom: 88,
  /* Padding di un contenuto scrollabile che finisce sotto una barra
     azioni: spazio per la tab bar, la barra (50) e un margine. */
  actionBarContentPadding: 160,
};

/* Palette usata per gli avatar con iniziali: deterministica sul nome */
const avatarPalette = [
  colors.scale.accent[9],
  colors.scale.primary[11],
  colors.scale.warning[9],
  colors.scale.success[9],
  colors.scale.accent[11],
  colors.scale.neutral[11],
];

export function avatarColor(seed?: string | null): string {
  const key = String(seed || "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return avatarPalette[hash % avatarPalette.length];
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = String(name).trim().replace(/^@/, "").split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const ds = {
  colors,
  fontFamily,
  fontSize,
  type,
  space,
  radius,
  control,
  shadow,
  layout,
  avatarPalette,
};

export default ds;
