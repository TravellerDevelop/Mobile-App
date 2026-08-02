import { Linking, Platform } from "react-native";
import type { StopPlace } from "./types";

/* ============================================================
   Handoff verso l'app di mappe di sistema per la navigazione.
   Con le coordinate si punta al punto esatto; senza, si cerca
   l'indirizzo testuale. Se lo schema nativo non è gestito
   (tipico degli emulatori senza Google Maps) si ripiega sul web.
   ============================================================ */

export function openInMaps(place?: StopPlace | null): void {
  if (!place) return;

  const query =
    place.lat != null && place.lon != null
      ? `${place.lat},${place.lon}`
      : encodeURIComponent(place.address || place.name);

  const nativeUrl =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${query}`
      : `google.navigation:q=${query}`;

  Linking.openURL(nativeUrl).catch(() => {
    Linking.openURL(`https://www.openstreetmap.org/search?query=${query}`).catch(() => undefined);
  });
}
