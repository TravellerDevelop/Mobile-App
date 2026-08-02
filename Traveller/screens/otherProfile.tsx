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
import axios from "axios";
import Card from "../shared/card";
import SkeletonScreen from "../components/SkeletonScreen";
import * as SecureStore from "expo-secure-store";
import { ApiCountResponse, ApiFollow, ApiTravel, ApiUser } from "../shared/types/api";

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
    setMyData(await SecureStore.getItemAsync("user-info") as string);
  }

  React.useEffect(() => {
    setIsLoading(true);
    getUserData();

    axios
      .get<ApiUser[]>(serverLink + "api/user/takeUserById?id=" + route.params.userid)
      .then((response) => {
        setUser(response.data[0]);
        axios
          .get<ApiCountResponse>(
            serverLink +
            "api/user/takeTravelsNum?userid=" +
            route.params.userid
          )
          .then((response) => {
            setNtravel(response.data.count);

            axios
              .get<ApiFollow[]>(
                serverLink +
                "api/follow/takeFromTo?from=" +
                myData._id +
                "&to=" +
                route.params.userid
              )
              .then((response) => {
                if (response.data.length > 0) {
                  if (response.data[0].accepted === false)
                    setRequestStatus("Sent");
                  else setRequestStatus("Followed");
                } else if (response.data.length == 0) {
                  setRequestStatus("Not sent");
                }

                setIsLoading(false);
              })
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
          });

        axios
          .get<ApiTravel[]>(
            serverLink +
            "api/travel/takeByCreator?userid=" +
            route.params.userid
          )
          .then((response) => {
            setMyTravel(response.data);
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        console.log(error);
      });
    axios
      .get<ApiFollow[]>(serverLink + "api/follow/takeFollowers?to=" + route.params.userid)
      .then((response) => {
        setFollowers(response.data.length);
      })
      .catch((error) => {
        console.log(error);
      });

    axios
      .get<ApiFollow[]>(serverLink + "api/follow/takeFollowings?from=" + route.params.userid)
      .then((response) => {
        setFollowed(response.data.length);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  // Invia o annulla la richiesta di follow
  function toggleFollow() {
    if (requestStatus == "Sent" || requestStatus == "Followed") {
      axios
        .post(serverLink + "api/follow/delete", { from: myData._id, to: user._id })
        .then(() => setRequestStatus("Not sent"))
        .catch((error) => console.log(error));
    } else if (requestStatus == "Not sent") {
      axios
        .post(serverLink + "api/follow/create", { from: myData._id, to: user._id })
        .then(() => setRequestStatus("Sent"))
        .catch((error) => console.log(error));
    }
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
                    source={{ uri: serverLink + "userImage/" + user.image }}
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
