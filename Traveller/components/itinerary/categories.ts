import { ds } from "../../global/designSystem";
import type { ItineraryPermissionMode, StopCategory, StopStatus } from "./types";

/* Catalogo delle categorie di tappa: guida icona, colore ed etichetta
   in tutte le schermate dell'itinerario (idee, timeline, editor). */
export interface StopCategoryOption {
  value: StopCategory;
  label: string;
  icon: string;
  color: string;
}

export const STOP_CATEGORY_OPTIONS: readonly StopCategoryOption[] = [
  { value: "visit", label: "Visita", icon: "bank-outline", color: ds.colors.scale.accent[9] },
  { value: "food", label: "Ristorante", icon: "silverware-fork-knife", color: ds.colors.scale.warning[9] },
  { value: "transfer", label: "Trasferimento", icon: "car-outline", color: ds.colors.scale.primary[11] },
  { value: "stay", label: "Alloggio", icon: "bed-outline", color: ds.colors.scale.primary[11] },
  { value: "event", label: "Evento", icon: "calendar-star", color: ds.colors.scale.accent[11] },
  { value: "activity", label: "Attività", icon: "shoe-print", color: ds.colors.scale.success[9] },
  { value: "free", label: "Tempo libero", icon: "coffee-outline", color: ds.colors.scale.neutral[11] },
] as const;

export function categoryOption(value?: StopCategory | null): StopCategoryOption {
  return STOP_CATEGORY_OPTIONS.find((option) => option.value === value) ?? STOP_CATEGORY_OPTIONS[0];
}

/* ---- Stati della tappa -------------------------------------- */
type BadgeIntent = "success" | "warning" | "error" | "info" | "neutral";

interface StopStatusOption {
  label: string;
  intent: BadgeIntent;
}

const STATUS_OPTIONS: Record<StopStatus, StopStatusOption> = {
  idea: { label: "Idea", intent: "neutral" },
  proposed: { label: "In votazione", intent: "warning" },
  confirmed: { label: "Confermata", intent: "success" },
  done: { label: "Fatta", intent: "info" },
  skipped: { label: "Saltata", intent: "error" },
};

export function statusOption(value?: StopStatus | null): StopStatusOption {
  return STATUS_OPTIONS[value as StopStatus] ?? STATUS_OPTIONS.idea;
}

/* ---- Modalità di collaborazione ----------------------------- */
export interface PermissionModeOption {
  value: ItineraryPermissionMode;
  title: string;
  description: string;
  /** Testo mostrato nel chip in cima all'itinerario */
  chip: string;
  icon: string;
}

export const PERMISSION_MODE_OPTIONS: readonly PermissionModeOption[] = [
  {
    value: "open",
    title: "Aperto",
    description: "Chiunque aggiunge, modifica e riordina le tappe.",
    chip: "Aperto · tutti possono modificare",
    icon: "lock-open-variant-outline",
  },
  {
    value: "proposal",
    title: "Proposte + voto",
    description: "Chiunque propone, il gruppo vota, tu confermi.",
    chip: "Proposte + voto · tutti possono proporre",
    icon: "chart-bar",
  },
  {
    value: "admin",
    title: "Solo admin",
    description: "Costruisci tu l'itinerario, gli altri leggono e propongono idee.",
    chip: "Solo admin · gli altri propongono idee",
    icon: "lock-outline",
  },
] as const;

export function permissionOption(value?: ItineraryPermissionMode | null): PermissionModeOption {
  return PERMISSION_MODE_OPTIONS.find((option) => option.value === value) ?? PERMISSION_MODE_OPTIONS[0];
}
