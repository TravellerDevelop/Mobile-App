import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../global/designSystem";
import { resolveImageUri } from "./imageUrl";
import { StatusBadge } from "../components/ui";

interface CardProps {
  navigation: any,
  data: any,
  vertical?: boolean,
  /* Tessera alta metà larghezza, usata nella griglia del profilo */
  grid?: boolean,
  isLoading?: boolean,
  username: string
}

/* Copertine tinta unita quando il viaggio non ha immagine */
const covers = [
  ds.colors.scale.accent[9],
  ds.colors.scale.primary[11],
  ds.colors.scale.neutral[11],
];

export default function Card({ navigation, data, vertical, grid, isLoading, username }: Readonly<CardProps>) {
  const creator = data.participants.find((r: any) => r.creator === true).username;

  const cover = covers[Math.abs(String(data.name || "").length + String(data.code || "").length) % covers.length];
  const createdAt = new Date(data.creation_date)
    .toLocaleString("it-IT", { timeZone: "UTC" })
    .substring(0, 10);

  async function open() {
    navigation.navigate("TravelDetail", { data: data, username: username });
  }

  /* Variante griglia: pill di stato in alto, titolo e meta ancorati in basso */
  const gridContent = (
    <>
      <View style={styles.gridPill}>
        <Text style={styles.gridPillText}>{data.closed ? "Chiuso" : "In corso"}</Text>
      </View>

      <View style={styles.gridBottom}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {data.name}
        </Text>
        <View style={styles.gridMetaRow}>
          <Text style={styles.gridDate} numberOfLines={1}>
            {createdAt}
          </Text>
          <View style={styles.gridCount}>
            <Text style={styles.gridCountText}>{data.participants.length}</Text>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={10}
              color="rgba(255,255,255,0.85)"
            />
          </View>
        </View>
      </View>
    </>
  );

  const content = grid ? gridContent : (
    <>
      <StatusBadge
        label={data.closed ? "Chiuso" : "In corso"}
        intent={data.closed ? "neutral" : "info"}
        style={styles.badge}
      />

      <Text style={styles.cardTitle} numberOfLines={2}>
        {data.name}
      </Text>
      <Text style={styles.cardSubtitle} numberOfLines={1}>
        Creato il {createdAt} da {creator == username ? "te" : creator}
      </Text>

      <View style={styles.footer}>
        <MaterialCommunityIcons
          name="account-group-outline"
          size={12}
          color={ds.colors.onCoverMuted}
        />
        <Text style={styles.footerText}>{data.participants.length}</Text>
      </View>
    </>
  );

  const shape = grid
    ? styles.containerGrid
    : vertical
      ? styles.containerVertical
      : styles.container;

  if (isLoading) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={open}
      style={[shape, { backgroundColor: data.image ? ds.colors.black : cover }]}
    >
      {data.image ? (
        <>
          {/* Image "nudo" invece di ImageBackground: ImageBackground riapplica
              width/height del contenitore all'<Image> interno, e se il
              contenitore è dimensionato in percentuale (grid/vertical) o senza
              height esplicita (header) il ricalcolo può risultare in una
              copertura incompleta (bordo destro/basso scoperto). */}
          <Image
            source={{ uri: resolveImageUri(data.image, "userImage/") }}
            style={[StyleSheet.absoluteFillObject, styles.coverImage]}
            resizeMode="cover"
          />
          <View style={styles.scrim} />
        </>
      ) : null}
      {content}

      {/* Quante cose non ha ancora visto l'utente su questo viaggio (vedi
          unseenCount in api/travel/takeJoined): stessa forma del badge
          notifiche di mainHeader, in basso a destra — sopra al nome del
          viaggio, di proposito, così si nota anche a colpo d'occhio. */}
      {Number(data.unseenCount) > 0 && (
        <View style={styles.unseenBadge}>
          <Text style={styles.unseenBadgeText}>
            {data.unseenCount > 99 ? "99+" : data.unseenCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 190,
    height: 112,
    borderRadius: ds.radius.l,
    padding: ds.space[4],
    marginRight: ds.space[4],
    overflow: "hidden",
    ...ds.shadow.md,
  },
  containerVertical: {
    width: "100%",
    height: 88,
    borderRadius: ds.radius.l,
    padding: ds.space[5] - 2,
    marginBottom: ds.space[4],
    overflow: "hidden",
    ...ds.shadow.md,
  },
  containerGrid: {
    width: "100%",
    height: 128,
    borderRadius: ds.radius.l,
    padding: ds.space[4],
    overflow: "hidden",
    ...ds.shadow.md,
  },
  coverImage: {
    borderRadius: ds.radius.l,
  },
  gridPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: ds.radius.s,
    paddingHorizontal: ds.space[2] + 2,
    paddingVertical: 3,
  },
  gridPillText: {
    fontFamily: ds.fontFamily.metaSemibold,
    fontSize: 9,
    letterSpacing: 0.3,
    color: ds.colors.white,
  },
  gridBottom: {
    position: "absolute",
    left: ds.space[4],
    right: ds.space[4],
    bottom: ds.space[4],
  },
  gridTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 14,
    lineHeight: 17,
    color: ds.colors.white,
  },
  gridMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: ds.space[2],
  },
  gridDate: {
    flex: 1,
    fontFamily: ds.fontFamily.regular,
    fontSize: 10,
    color: ds.colors.onCoverMuted,
  },
  gridCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  gridCountText: {
    fontFamily: ds.fontFamily.metaMedium,
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    marginRight: 3,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(1, 13, 55, 0.35)",
  },
  badge: {
    position: "absolute",
    top: ds.space[3] + 2,
    right: ds.space[3] + 2,
    zIndex: 2,
  },
  unseenBadge: {
    position: "absolute",
    bottom: ds.space[3] - 2,
    right: ds.space[3] - 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.accent[9],
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    ...ds.shadow.md,
  },
  unseenBadgeText: {
    color: ds.colors.white,
    fontFamily: ds.fontFamily.metaSemibold,
    fontSize: 10,
    textAlign: "center",
  },
  cardTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 15,
    color: ds.colors.white,
    maxWidth: 140,
    marginTop: ds.space[1],
  },
  cardSubtitle: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.onCoverMuted,
    marginTop: ds.space[1] + 1,
  },
  footer: {
    position: "absolute",
    bottom: ds.space[3] + 2,
    left: ds.space[4],
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontFamily: ds.fontFamily.metaMedium,
    fontSize: 11,
    color: ds.colors.onCoverMuted,
    marginLeft: ds.space[2],
  },
});
