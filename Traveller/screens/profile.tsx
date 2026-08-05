import React, { useState } from "react";
import {
  Alert,
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Share,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { serverLink } from "../global/globalVariable";
import { ds } from "../global/designSystem";
import { resolveImageUri } from "../shared/imageUrl";
import {
  EmptyState,
  InitialsAvatar,
  OverscrollBackdrop,
  Sheet,
} from "../components/ui";
import { getData, storeJsonData } from "../shared/data/localdata";
import { cacheKeys, readCache, writeCache } from "../shared/data/offlineCache";
import { isNetworkError, markOffline, markOnline } from "../shared/data/netStatus";
import axios from "axios";
import Card from "../shared/card";
import SkeletonScreen from "../components/SkeletonScreen";
import { ApiCountResponse, ApiFollow, ApiTravel, ApiUser } from "../shared/types/api";
import { useAuth } from "../global/authContext";
import { useOnReconnect } from "../global/networkContext";

/** Numeri e viaggi mostrati sul profilo: una sola voce di cache. */
interface ProfileStats {
  ntravel: number;
  myTravel: ApiTravel[];
  followers: number;
  followed: number;
}

export default function MyProfile({ navigation, route }: { navigation: any; route: any }) {
  const { logout } = useAuth();
  let [user, setUser] = React.useState<Partial<ApiUser>>({});
  let [ntravel, setNtravel] = React.useState<number | null>(null);
  let [myTravel, setMyTravel] = React.useState<ApiTravel[]>([]);
  let [isLoading, setIsLoading] = useState(true);
  let [uploadingImage, setUploadingImage] = useState(false);

  let [followed, setFollowed] = React.useState<number | null>(null);
  let [followers, setFollowers] = React.useState<number | null>(null);

  let [refreshing, setRefreshing] = React.useState(false);

  /* Le quattro chiamate del profilo sono indipendenti fra loro ma
     finiscono tutte in una sola voce di cache: senza rete o si mostra il
     profilo intero (viaggi + numeri) o non si mostra niente, e tenere
     quattro chiavi separate significherebbe solo poter mostrare mezza
     schermata. `setIsLoading(false)` dipende dal fatto che tutti e tre i
     contatori siano valorizzati (vedi useEffect sotto), quindi in caso di
     errore vanno messi comunque a zero. */
  async function getUserData() {
    setIsLoading(true);
    let data = await getData("user");
    setUser(data);
    if (!data?._id) return;

    const key = cacheKeys.profileStats(data._id);

    try {
      const [travelsNum, created, followersList, followingList] = await Promise.all([
        axios.get<ApiCountResponse>(serverLink + "api/user/takeTravelsNum?userid=" + data._id),
        axios.get<ApiTravel[]>(serverLink + "api/travel/takeByCreator?userid=" + data._id),
        axios.get<ApiFollow[]>(serverLink + "api/follow/takeFollowers?to=" + data._id),
        axios.get<ApiFollow[]>(serverLink + "api/follow/takeFollowings?from=" + data._id),
      ]);

      markOnline();

      const stats = {
        ntravel: travelsNum.data.count,
        myTravel: created.data ?? [],
        followers: followersList.data.length,
        followed: followingList.data.length,
      };

      await writeCache(key, stats);
      applyProfileStats(stats);
    } catch (error) {
      if (isNetworkError(error)) markOffline();
      else console.log(error);

      const cached = (await readCache<ProfileStats>(key))?.data;
      applyProfileStats(cached ?? { ntravel: 0, myTravel: [], followers: 0, followed: 0 });
    }
  }

  function applyProfileStats(stats: ProfileStats) {
    setNtravel(stats.ntravel);
    setMyTravel(stats.myTravel);
    setFollowers(stats.followers);
    setFollowed(stats.followed);
  }

  React.useEffect(() => {
    getUserData();
  }, []);

  useOnReconnect(() => {
    getUserData();
  });

  React.useEffect(() => {
    if (ntravel != null && followers != null && followed != null) {
      setIsLoading(false);
    }
  }, [ntravel, myTravel, followers, followed]);

  const onRefresh = async () => {
    setRefreshing(true);
    getUserData();
    setRefreshing(false);
  };

  /* Selezione e caricamento della foto profilo.
     Stesso flusso della copertina viaggio: upload dell'immagine in base64,
     poi salvataggio del nome file sull'utente.
     NOTA: api/user/uploadImage e api/user/setImage non sono (ancora)
     implementate lato server (esiste solo l'equivalente per i viaggi,
     api/travel/uploadImage): questa funzione fallirà finché non verranno
     aggiunte, comportamento preesistente e non modificato qui. */
  async function changeProfileImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      quality: 1,
    });

    if (result.canceled) return;

    setUploadingImage(true);
    let fileName = result.assets[0].uri.split("/").pop();

    axios
      .post<string>(serverLink + "api/user/uploadImage", {
        img: result.assets[0].base64,
        imgName: fileName,
      })
      .then((response) => {
        return axios.post(serverLink + "api/user/setImage", {
          userid: user._id,
          image: response.data,
        }).then(async () => {
          let updated = { ...user, image: response.data };
          setUser(updated);
          await storeJsonData("user", updated);
          setUploadingImage(false);
        });
      })
      .catch((error) => {
        console.log("Upload immagine profilo", error);
        setUploadingImage(false);
      });
  }

  function confirmLogout() {
    Alert.alert("Esci dall'account", "Vuoi disconnetterti da Traveller su questo dispositivo?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Esci",
        style: "destructive",
        onPress: () => {
          logout();
        },
      },
    ]);
  }

  // Condivide il profilo con il foglio di sistema
  async function shareProfile() {
    try {
      await Share.share({
        message: "Seguimi su Traveller: @" + user.username,
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Card contatore della griglia statistiche
  const Stat = ({
    icon,
    value,
    label,
  }: {
    icon: string;
    value: number | null;
    label: string;
  }) => (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon as any} size={15} color={ds.colors.action} />
      {isLoading ? (
        <SkeletonScreen width={26} height={16} borderRadius={4} style={{ marginTop: 4 }} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <OverscrollBackdrop topColor={ds.colors.brand} bottomColor={ds.colors.surface} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ backgroundColor: ds.colors.brand, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          {/* Fascia brand con bussola decorativa */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="compass-outline"
              size={110}
              color="rgba(255,255,255,0.06)"
              style={styles.headerGlyph}
            />
          </View>

          <Sheet style={styles.sheet} overlap={-20}>
            <View style={styles.avatarBlock}>
              <View style={styles.avatarRing}>
                {isLoading ? (
                  <SkeletonScreen width={92} height={92} borderRadius={999} />
                ) : user.image ? (
                  <Image
                    source={{ uri: resolveImageUri(user.image, "userImage/") }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <InitialsAvatar
                    name={user.name + " " + user.surname}
                    size={92}
                    color={ds.colors.scale.accent[9]}
                    textStyle={{ fontSize: 32, fontFamily: ds.fontFamily.bold }}
                  />
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.cameraBadge}
                onPress={changeProfileImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={ds.colors.white} />
                ) : (
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={13}
                    color={ds.colors.white}
                  />
                )}
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <SkeletonScreen width={160} height={26} borderRadius={4} />
            ) : (
              <Text style={styles.name}>
                {user.name} {user.surname}
              </Text>
            )}

            {isLoading ? (
              <SkeletonScreen
                width={100}
                height={16}
                borderRadius={4}
                style={{ marginTop: 6 }}
              />
            ) : (
              <Text style={styles.nickname}>@{user.username}</Text>
            )}

            <View style={styles.statsRow}>
              <Stat icon="bag-suitcase-outline" value={ntravel} label="Viaggi" />
              <Stat icon="account-group-outline" value={followers} label="Follower" />
              <Stat icon="account-plus-outline" value={followed} label="Seguiti" />
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }}>
                <View style={styles.editButton}>
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={14}
                    color={ds.colors.white}
                  />
                  <Text style={styles.editButtonText}>Modifica profilo</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} onPress={shareProfile}>
                <View style={styles.shareButton}>
                  <MaterialCommunityIcons
                    name="share-variant"
                    size={16}
                    color={ds.colors.text}
                  />
                </View>
              </TouchableOpacity>

              {/* Preferenze notifiche: raggiungibili anche dal centro
                  notifiche, ma qui è dove l'utente le cerca. */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("NotificationSettings")}
                accessibilityLabel="Preferenze notifiche"
              >
                <View style={styles.shareButton}>
                  <MaterialCommunityIcons
                    name="bell-cog-outline"
                    size={16}
                    color={ds.colors.text}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>I viaggi creati da te</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Travels")}
              >
                <Text style={styles.sectionAction}>Vedi tutti</Text>
              </TouchableOpacity>
            </View>

            {ntravel == 0 || (!isLoading && myTravel.length == 0) ? (
              <EmptyState
                icon="airplane-off"
                title="Ancora nessun viaggio"
                description="I viaggi che crei compariranno qui."
              />
            ) : (
              !isLoading && (
                <View style={styles.travelsGrid}>
                  {myTravel.map((item) => (
                    <View key={String(item._id)} style={styles.travelsCell}>
                      <Card
                        grid={true}
                        data={item}
                        navigation={navigation}
                        username={user.username || ""}
                      />
                    </View>
                  ))}
                </View>
              )
            )}
          </Sheet>
        </View>
      </ScrollView>

      {/* Barra flottante sopra l'header */}
      <View style={styles.floatingBar}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()}>
          <View style={styles.floatingButton}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={ds.colors.white} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={confirmLogout} accessibilityLabel="Esci dall'account">
          <View style={styles.floatingButton}>
            <MaterialCommunityIcons name="cog-outline" size={16} color={ds.colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ds.colors.brand,
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: ds.colors.brand,
  },
  header: {
    height: 128,
    backgroundColor: ds.colors.brand,
    overflow: "hidden",
  },
  headerGlyph: {
    position: "absolute",
    right: -10,
    top: 20,
  },
  floatingBar: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ds.layout.headerPaddingH,
    zIndex: 5,
  },
  floatingButton: {
    width: 34,
    height: 34,
    borderRadius: ds.radius.full,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: ds.layout.contentBottomPadding,
  },
  avatarBlock: {
    position: "relative",
    marginTop: -52,
    marginBottom: ds.space[4] + 2,
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...ds.shadow.md,
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: ds.radius.full,
  },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.action,
    borderWidth: 3,
    borderColor: ds.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 22,
    color: ds.colors.text,
  },
  nickname: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[6],
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: ds.space[5] + 2,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[2] + 2,
    marginHorizontal: ds.space[2],
  },
  statValue: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 16,
    color: ds.colors.text,
    marginTop: ds.space[2],
  },
  statLabel: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 10,
    color: ds.colors.textSecondary,
    marginTop: ds.space[2],
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: ds.space[7] + 2,
  },
  editButton: {
    height: ds.control.lg,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...ds.shadow.md,
  },
  editButtonText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.white,
    marginLeft: ds.space[3] - 1,
  },
  shareButton: {
    width: ds.control.lg,
    height: ds.control.lg,
    borderRadius: ds.radius.m,
    borderWidth: 1,
    borderColor: ds.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: ds.space[3] + 2,
  },
  sectionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ds.space[4],
  },
  sectionLabel: {
    ...ds.type.sectionLabel,
  },
  sectionAction: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.action,
  },
  travelsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  travelsCell: {
    width: "48.5%",
    marginBottom: ds.space[3] + 2,
  },
});
