import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Share,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serverLink } from "../global/globalVariable";
import { ds } from "../global/designSystem";
import { EmptyState, InitialsAvatar, OverscrollBackdrop, Sheet } from "../components/ui";
import { resolveImageUri } from "../shared/imageUrl";
import axios from "axios";
import Card from "../shared/card";
import SkeletonScreen from "../components/SkeletonScreen";
import { getData } from "../shared/data/localdata";
import { apiSend } from "../shared/data/apiClient";
import { cacheKeys, readCache, writeCache } from "../shared/data/offlineCache";
import { isNetworkError, markOffline, markOnline } from "../shared/data/netStatus";
import { ApiCountResponse, ApiFollow, ApiTravel, ApiUser } from "../shared/types/api";

/** Tutto quello che serve a disegnare la scheda di un altro utente. */
interface OtherProfileSnapshot {
  user: ApiUser;
  ntravel: number;
  myTravel: ApiTravel[];
  followers: number;
  followed: number;
  requestStatus: "Not sent" | "Sent" | "Followed";
}

export default function OtherProfile({ navigation, route }: any) {
  let [myData, setMyData]: any = React.useState({});
  let [user, setUser]: any = React.useState({});
  let [requestStatus, setRequestStatus] = React.useState("");
  let [myTravel, setMyTravel] = React.useState<ApiTravel[]>([]);

  let [ntravel, setNtravel] = React.useState(0);
  let [followed, setFollowed] = React.useState(0);
  let [followers, setFollowers] = React.useState(0);

  let [isLoading, setIsLoading] = useState(false);

  async function getUserData() {
    const stored = (await getData("user")) || {};
    setMyData(stored);
    return stored;
  }

  React.useEffect(() => {
    setIsLoading(true);

    (async () => {
      const currentUser = await getUserData();
      loadProfile(currentUser);
    })();
  }, []);

  /* Profilo di un altro utente: cinque chiamate annidate diventano una
     sola voce di cache. Erano una catena di `.then` in cui ogni errore
     lasciava la schermata a metà (e `isLoading` a true per sempre, se a
     fallire era la prima); ora l'esito è uno solo, per tutta la scheda. */
  async function loadProfile(currentUser: any) {
    const targetId = route.params.userid;
    const key = cacheKeys.profile(targetId);

    try {
      const [profile, travelsNum, relation, created, followersList, followingList] =
        await Promise.all([
          axios.get<ApiUser[]>(serverLink + "api/user/takeUserById?id=" + targetId),
          axios.get<ApiCountResponse>(serverLink + "api/user/takeTravelsNum?userid=" + targetId),
          axios.get<ApiFollow[]>(
            serverLink + "api/follow/takeFromTo?from=" + currentUser?._id + "&to=" + targetId
          ),
          axios.get<ApiTravel[]>(serverLink + "api/travel/takeByCreator?userid=" + targetId),
          axios.get<ApiFollow[]>(serverLink + "api/follow/takeFollowers?to=" + targetId),
          axios.get<ApiFollow[]>(serverLink + "api/follow/takeFollowings?from=" + targetId),
        ]);

      markOnline();

      const relationRow = relation.data[0];
      const snapshot: OtherProfileSnapshot = {
        user: profile.data[0],
        ntravel: travelsNum.data.count,
        myTravel: created.data ?? [],
        followers: followersList.data.length,
        followed: followingList.data.length,
        requestStatus: !relationRow ? "Not sent" : relationRow.accepted === false ? "Sent" : "Followed",
      };

      await writeCache(key, snapshot);
      applySnapshot(snapshot);
    } catch (error) {
      if (isNetworkError(error)) markOffline();
      else console.log(error);

      const cached = (await readCache<OtherProfileSnapshot>(key))?.data;
      if (cached) applySnapshot(cached);
      else setIsLoading(false);
    }
  }

  function applySnapshot(snapshot: OtherProfileSnapshot) {
    setUser(snapshot.user);
    setNtravel(snapshot.ntravel);
    setMyTravel(snapshot.myTravel);
    setFollowers(snapshot.followers);
    setFollowed(snapshot.followed);
    setRequestStatus(snapshot.requestStatus);
    setIsLoading(false);
  }

  // Invia o annulla la richiesta di follow
  function toggleFollow() {
    /* Segui/smetti di seguire va in coda se offline: lo stato mostrato
       cambia subito ed è quello che il server applicherà. */
    const following = requestStatus == "Sent" || requestStatus == "Followed";
    const next = following ? "Not sent" : "Sent";

    apiSend(
      serverLink + (following ? "api/follow/delete" : "api/follow/create"),
      { from: myData._id, to: user._id },
      { queue: { label: following ? "Smetti di seguire" : "Richiesta di follow", invalidates: [cacheKeys.profile(route.params.userid)] } }
    )
      .then(() => setRequestStatus(next))
      .catch((error) => console.log(error));
  }

  // Condivide il profilo con il foglio di sistema
  async function shareProfile() {
    try {
      await Share.share({
        message: "Guarda il profilo di @" + user.username + " su Traveller",
      });
    } catch (error) {
      console.log(error);
    }
  }

  const followLabel =
    requestStatus == "Sent"
      ? "Richiesta inviata"
      : requestStatus == "Followed"
        ? "Segui già"
        : "Inizia a seguire";

  const followIcon =
    requestStatus == "Sent"
      ? "clock-outline"
      : requestStatus == "Followed"
        ? "account-check-outline"
        : "account-plus-outline";

  const isFollowingState = requestStatus == "Sent" || requestStatus == "Followed";

  // Card contatore della griglia statistiche
  const Stat = ({ icon, value, label }: any) => (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={15} color={ds.colors.action} />
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
              <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }} onPress={toggleFollow}>
                {isLoading ? (
                  <SkeletonScreen width={"100%"} height={ds.control.lg} borderRadius={8} />
                ) : (
                  <View
                    style={[
                      styles.followButton,
                      isFollowingState && styles.followButtonActive,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={followIcon}
                      size={14}
                      color={isFollowingState ? ds.colors.action : ds.colors.white}
                    />
                    <Text
                      style={[
                        styles.followButtonText,
                        isFollowingState && { color: ds.colors.action },
                      ]}
                    >
                      {followLabel}
                    </Text>
                  </View>
                )}
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
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>
                {user.name ? "I viaggi creati da " + user.name : "I viaggi creati"}
              </Text>
            </View>

            {!isLoading && myTravel.length > 0 ? (
              <View style={styles.travelsGrid}>
                {myTravel.map((item: any) => (
                  <View key={String(item._id)} style={styles.travelsCell}>
                    <Card
                      grid={true}
                      data={item}
                      navigation={navigation}
                      username={user.username}
                    />
                  </View>
                ))}
              </View>
            ) : (
              !isLoading && (
                <EmptyState
                  icon="airplane-off"
                  title="Ancora nessun viaggio"
                  description={
                    user.name
                      ? "I viaggi creati da " + user.name + " compariranno qui."
                      : undefined
                  }
                />
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
  followButton: {
    height: ds.control.lg,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...ds.shadow.md,
  },
  followButtonActive: {
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  followButtonText: {
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
