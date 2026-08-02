import React, { useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { ds } from "../../global/designSystem";
import { EmptyState } from "../ui";
import type { Stop } from "./types";

/* ============================================================
   Mappa del giorno: tappe numerate e percorso.
   react-native-maps non ha una build web e importarlo staticamente
   romperebbe `expo start --web`, quindi si carica solo su mobile.
   ============================================================ */

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
}

export interface MappableStop extends Stop {
  place: NonNullable<Stop["place"]> & { lat: number; lon: number };
}

/** Tappe con coordinate: sono le uniche che si possono mettere sulla mappa. */
export function mappableStops(stops: Stop[]): MappableStop[] {
  return stops.filter(
    (stop): stop is MappableStop =>
      stop.place != null && stop.place.lat != null && stop.place.lon != null
  );
}

interface ItineraryMapProps {
  stops: Stop[];
  style?: any;
  /** Marker più piccoli e niente percorso: usato nel resoconto. */
  compact?: boolean;
  onMarkerPress?: (stop: Stop) => void;
}

export function ItineraryMap({ stops, style, compact, onMarkerPress }: ItineraryMapProps) {
  const mapRef = useRef<any>(null);
  const points = useMemo(() => mappableStops(stops), [stops]);

  /* La regione iniziale inquadra tutte le tappe: il delta è la loro
     estensione più un margine, con un minimo per non partire "dentro"
     un edificio quando le tappe sono vicinissime. */
  const region = useMemo(() => {
    if (points.length === 0) return null;

    const lats = points.map((stop) => stop.place.lat);
    const lons = points.map((stop) => stop.place.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.012),
      longitudeDelta: Math.max((maxLon - minLon) * 1.6, 0.012),
    };
  }, [points]);

  if (Platform.OS === "web" || !MapView) {
    return (
      <View style={[styles.fallback, style]}>
        <EmptyState
          icon="map-outline"
          title="Mappa non disponibile qui"
          description="La mappa funziona sull'app iOS e Android."
        />
      </View>
    );
  }

  if (!region) {
    return (
      <View style={[styles.fallback, style]}>
        <EmptyState
          icon="map-marker-off-outline"
          title="Nessuna tappa da mostrare"
          description="Aggiungi un luogo alle tappe per vederle sulla mappa."
        />
      </View>
    );
  }

  return (
    <MapView ref={mapRef} style={[styles.map, style]} initialRegion={region}>
      {!compact && points.length > 1 ? (
        <Polyline
          coordinates={points.map((stop) => ({
            latitude: stop.place.lat,
            longitude: stop.place.lon,
          }))}
          strokeColor={ds.colors.action}
          strokeWidth={3}
          lineDashPattern={[2, 8]}
        />
      ) : null}

      {points.map((stop, index) => (
        <Marker
          key={stop._id}
          coordinate={{ latitude: stop.place.lat, longitude: stop.place.lon }}
          title={stop.title}
          description={stop.place.address}
          onPress={() => onMarkerPress?.(stop)}
          tracksViewChanges={false}
        >
          <View
            style={[
              styles.pin,
              compact && styles.pinCompact,
              stop.status === "skipped" && styles.pinSkipped,
            ]}
          >
            <Text style={[styles.pinLabel, compact && styles.pinLabelCompact]}>
              {index + 1}
            </Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    width: "100%",
    height: "100%",
    backgroundColor: ds.colors.scale.neutral[4],
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    width: 26,
    height: 26,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.action,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: ds.colors.white,
    ...ds.shadow.md,
  },
  pinCompact: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
  },
  pinSkipped: {
    backgroundColor: ds.colors.scale.neutral[9],
  },
  pinLabel: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 12,
    color: ds.colors.white,
  },
  pinLabelCompact: {
    fontSize: 0,
  },
});
