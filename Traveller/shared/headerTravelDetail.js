import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
} from "react-native";
import { ds } from "../global/designSystem";
import { BrandHeader, HeaderChip } from "../components/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getData } from "./data/localdata";
import { resolveImageUri } from "./imageUrl";

export default function HeaderTravelDetail({ navigation, data }) {
  let [username, setUsername] = React.useState();

  let creator = "";

  for (let item of data.participants) {
    if (item.creator) {
      creator = item.username;
    }
  }

  useEffect(() => {
    const test = async () => {
      let aus = await getData("user");
      setUsername(aus.username);
      return aus;
    };

    test();
  }, []);

  const createdAt = new Date(data.creation_date)
    .toLocaleString("it-IT", { timeZone: "UTC" })
    .substring(0, 10);

  const content = (
    <>
      <View style={styles.topRow}>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={ds.colors.white} />
        </TouchableOpacity>

        {creator == username && (
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => navigation.navigate("EditTravel", data)}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={ds.colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {data.name}
      </Text>
      <Text style={styles.subtitle}>
        Creato da {creator == username ? "te" : creator} · {createdAt}
      </Text>
      <Text style={styles.code}>Codice invito: {data.code}</Text>

      <View style={styles.chipRow}>
        <HeaderChip
          icon="information-outline"
          label="Informazioni"
          onPress={() => navigation.navigate("TravelPartecipants", data)}
        />
        <HeaderChip
          icon="map-marker-path"
          label="Itinerario"
          onPress={() => navigation.navigate("Itinerary", { data, username })}
        />
      </View>
    </>
  );

  if (!data.image) {
    return (
      <BrandHeader paddingTop={66} paddingBottom={40}>
        {content}
      </BrandHeader>
    );
  }

  return (
    <View style={styles.imageHeader}>
      {/* Image "nudo" invece di ImageBackground: ImageBackground riapplica
          width/height del contenitore all'<Image> interno, e qui l'header
          non ha una height esplicita (dipende dal contenuto testuale) — quel
          ricalcolo lascia scoperto il bordo destro dell'immagine. */}
      <Image
        style={StyleSheet.absoluteFillObject}
        source={{ uri: resolveImageUri(data.image, "userImage/") }}
        resizeMode="cover"
      />
      <View style={styles.scrim} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  imageHeader: {
    width: "100%",
    backgroundColor: ds.colors.brand,
    paddingHorizontal: ds.layout.headerPaddingH,
    paddingTop: 66,
    paddingBottom: 40,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(1, 13, 55, 0.45)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ds.space[5] + 2,
  },
  title: {
    color: ds.colors.white,
    fontFamily: ds.fontFamily.bold,
    fontSize: 22,
    marginBottom: ds.space[2],
  },
  subtitle: {
    color: ds.colors.onBrandMuted,
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    marginBottom: ds.space[1],
  },
  code: {
    color: ds.colors.onBrandMuted,
    fontFamily: ds.fontFamily.metaRegular,
    fontSize: 12,
    marginBottom: ds.space[4] + 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ds.space[3],
  },
});
