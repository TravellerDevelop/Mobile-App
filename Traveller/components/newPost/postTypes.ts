import { ds } from "../../global/designSystem";
import type { PostTypeOption } from "./types";

/* Catalogo dei tipi di post: usato sia dal bottom sheet di scelta
   sia dalle tab in cima al form. */
export const POST_TYPE_OPTIONS: readonly PostTypeOption[] = [
  {
    type: "text",
    label: "Testo",
    description: "Scrivi un messaggio per il gruppo",
    icon: "file-document-outline",
    color: ds.colors.scale.accent[9],
  },
  {
    type: "vote",
    label: "Sondaggio",
    description: "Fai scegliere qualcosa al gruppo",
    icon: "chart-bar",
    color: ds.colors.scale.primary[11],
  },
  {
    type: "payments",
    label: "Pagamento",
    description: "Richiedi o registra una spesa",
    icon: "wallet-outline",
    color: ds.colors.scale.warning[9],
  },
  {
    type: "images",
    label: "Immagini",
    description: "Condividi foto del viaggio",
    icon: "image-outline",
    color: ds.colors.scale.success[9],
  },
  {
    type: "todo",
    label: "To Do",
    description: "Crea una lista di cose da fare",
    icon: "check-circle-outline",
    color: ds.colors.scale.accent[11],
  },
] as const;

/* Titolo della schermata per ciascun tipo */
export const POST_TYPE_TITLES: Record<PostTypeOption["type"], string> = {
  text: "Nuovo testo",
  vote: "Nuovo sondaggio",
  payments: "Nuovo pagamento",
  images: "Nuove immagini",
  todo: "Nuova lista",
};
