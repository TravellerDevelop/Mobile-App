import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Swiper from "react-native-swiper";
import InteractiveCard from "../components/interactiveCard";
import MainHeader from "../components/mainHeader";
// color/font legacy: usati solo dalla modale "novità versione", fuori dal redesign
import { appVersion, color, font, serverLink } from "../global/globalVariable";
import { ds } from "../global/designSystem";
import {
  EmptyState,
  InitialsAvatar,
  OverscrollBackdrop,
  SearchField,
  SectionLabel,
  Sheet,
} from "../components/ui";
import Card from "../shared/card";
import {
  getData,
  getStringData,
  storeStringData,
} from "../shared/data/localdata";
import { fetchUserById } from "../components/auth/api";
import LoadingCard from "../shared/loadingCard";
import Constants from "expo-constants";

// Componenti
import ImagesComponent from "../components/Travel-Componets/ImagesComponent";
import PaymentComponent from "../components/Travel-Componets/payments";
import TextComponent from "../components/Travel-Componets/textcomponent";
import Vote from "../components/Travel-Componets/vote";
import PostLoading from "../components/loading/PostLoading";
import * as SecureStore from "expo-secure-store";
import { getNotifications } from "../shared/notificationsClient";
import ToDo from "../components/Travel-Componets/ToDo";
import ItineraryEvent from "../components/Travel-Componets/ItineraryEvent";
import {
  ApiAppVersionDoc,
  ApiJoinedTravel,
  ApiSetNotifTokenResponse,
  ApiUser,
  ApiVerifyTokenResponse,
} from "../shared/types/api";

export default function Home({ navigation }: { navigation: any }) {
  let [joinedTravelsLoading, setJoinedTravelsLoading] = useState(true);
  let [lastPostsLoading, setLastPostsLoading] = useState(true);
  // NOTA: i post arrivano tipizzati dal server, ma qui vengono rimodellati per la UI
  // (dateTime formattata, source immagini trasformato in {id, source}[]): per questo
  // la tupla viene tenuta "any[]" piuttosto che forzare un tipo che poi verrebbe
  // immediatamente violato dalla trasformazione.
  let [lastPosts, setLastPosts] = useState<[any[], Record<string, string>] | false>(false);
  let [userData, setUserData] = useState<Partial<ApiUser> | false>(false);
  let [joinedTravels, setJoinedTravels] = useState<ApiJoinedTravel[] | false>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serchData, setSerchData] = useState<ApiUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [notification, setNotification] = useState<any>(false);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Verifica se l'utente ha abilitato le notifiche e se sono presenti su DB
  const verifyNotifications = async () => {
    // Le notifiche push remote non sono supportate in Expo Go (rimosse da SDK 53):
    // vengono abilitate solo nei development/production build.
    const Notifications = getNotifications();
    if (!Notifications) return;

    let data = await getData("user");
    let notificationToken = await SecureStore.getItemAsync("notif-token");
    if (!notificationToken) {
      await registerForPushNotificationsAsync()
        .then((token) => {
          SecureStore.setItemAsync("notif-token", token);
          axios
            .post<ApiSetNotifTokenResponse>(serverLink + "api/user/setNotifToken", {
              userid: data._id,
              notifToken: token,
            })
            .then((response) => {
              notificationListener.current =
                Notifications.addNotificationReceivedListener(
                  (notification: any) => {
                    setNotification(notification);
                  }
                );

              responseListener.current =
                Notifications.addNotificationResponseReceivedListener(
                  (response: any) => {}
                );

              Notifications.setNotificationHandler({
                handleNotification: async () => ({
                  shouldShowAlert: true,
                  shouldPlaySound: false,
                  shouldSetBadge: false,
                }),
              });
            })
            .catch(() => {
              SecureStore.deleteItemAsync("notif-token");
            });
        })
        .catch((ex) => {
          console.error(ex);
        });
    } else {
      axios
        .post<ApiVerifyTokenResponse>(serverLink + "api/user/verifyToken", {
          userid: data._id,
          notificationToken: notificationToken,
        })
        .then((response) => {
          notificationListener.current =
            Notifications.addNotificationReceivedListener((notification: any) => {
              setNotification(notification);
            });

          responseListener.current =
            Notifications.addNotificationResponseReceivedListener(
              (response: any) => {}
            );

          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: false,
              shouldSetBadge: false,
            }),
          });
        })
        .catch((ex) => {
          console.error(ex);
        });
    }
  };

  async function verifyUserData() {
    // App.tsx (AuthProvider) garantisce che questa schermata monti solo con
    // una sessione valida: non serve più gestire qui il caso "non loggato"
    // (prima mostrava un modale di login sopra una View vuota).
    let data = await getData("user");
    setUserData(data);
    if (!data || !data._id) return;

    storeStringData("username", data.username);

    // fetchUserById ripulisce sempre il campo "password" dalla risposta del
    // server, a differenza di una chiamata axios diretta allo stesso
    // endpoint: evitiamo così di tenerlo anche solo in memoria qui.
    const freshUser = await fetchUserById(data._id);
    if (freshUser) {
      setUserData(freshUser);
      await loadJoinedTravels(freshUser.username, freshUser._id);
      await takePost(freshUser._id, freshUser.username);
    }

    verifyNotifications();
  }

  useEffect(() => {
    verifyUserData();

    axios
      .get<ApiAppVersionDoc[]>(serverLink + "api/takeVersion")
      .then(async (response) => {
        if (response.status == 200) {
          if (response.data[0].AppVersion.toString() != appVersion.toString()) {
            Alert.alert(
              "Aggiornamento disponibile",
              "È disponibile un aggiornamento per l'applicazione (" +
                response.data[0].AppVersion +
                ") , vuoi aggiornare?",
              [
                {
                  text: "No",
                  onPress: () => console.log("Cancel Pressed"),
                  style: "cancel",
                },
                {
                  text: "Si",
                  onPress: () => {
                    Linking.openURL("https://traveller-ttze.onrender.com/");
                  },
                },
              ],
              { cancelable: false }
            );
          } else {
            let data = await getStringData(response.data[0].AppVersion);

            if (data != "true") {
              setShowNew(true);
            }
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    let data = await getData("user");
    loadJoinedTravels(data.username, data._id);
    takePost(data._id, data.username);
    setRefreshing(false);
  };

  function loadJoinedTravels(username: string, userid: string) {
    axios
      .get<ApiJoinedTravel[]>(
        serverLink +
          "api/travel/takeJoined?username=" +
          username +
          "&userid=" +
          userid
      )
      .then(async (response) => {
        if (response.status == 200) {
          setJoinedTravels(response.data);
          setJoinedTravelsLoading(false);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function takePost(userid: string, username: string) {
    axios
      .get<[any[], Record<string, string>]>(
        serverLink +
          "api/post/takeLastsByUsername?userid=" +
          userid +
          "&username=" +
          username
      )
      .then(async (response) => {
        if (response.status == 200) {
          for (let item of response.data[0]) {
            item.dateTime = new Date(item.dateTime).toLocaleString("it-IT", {
              timeZone: "Europe/Andorra",
            });
            if (item.type == "images") {
              let i = 0;
              let aus = [];

              for (let image of item.source) {
                aus.push({ id: i, source: image });
                item.source = aus;
                i++;
              }
            }
          }
          setLastPosts(response.data);
          setLastPostsLoading(false);
        }
      })
      .catch((error) => {
        console.log("Last Post", error);
      });
  }

  // Produce il token per le notifiche (solo su development/production build)
  async function registerForPushNotificationsAsync() {
    const Notifications = getNotifications();
    if (!Notifications) return null;

    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Errore", "Failed to get push token for push notification!");
      return null;
    }
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;

    return token;
  }

  // App.tsx monta questa schermata solo quando l'utente è autenticato
  // (vedi AuthProvider in global/authContext.tsx): niente più modale di
  // login né schermata bianca da gestire qui.
  return (
    <View style={styles.flex}>
      <OverscrollBackdrop topColor={ds.colors.brand} />
        <ScrollView
        style={styles.screen}
        contentContainerStyle={{ backgroundColor: ds.colors.brand, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          {showNew && (
            <Modal transparent={true} animationType="slide">
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Swiper
                  loop={false}
                  showsPagination={true}
                  showsButtons={true}
                  index={0}
                  style={{
                    backgroundColor: "white",
                    borderRadius: 10,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "white",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      borderRadius: 10,
                      margin: 20,
                      paddingTop: 20,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.montserrat,
                        fontSize: 23,
                        textAlign: "center",
                        color: color.secondary,
                      }}
                    >
                      Novità versione {appVersion}
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.montserratBold,
                        fontSize: 23,
                        textAlign: "center",
                        marginTop: 50,
                      }}
                    >
                      Personalizza il tuo viaggio!
                    </Text>
                    <Image
                      source={require("../assets/image/News/Copertina.jpg")}
                      style={{
                        width: 300,
                        height: 300,
                      }}
                      resizeMode="contain"
                    />
                    <Text
                      style={{
                        fontFamily: font.montserrat,
                        fontSize: 20,
                        textAlign: "center",
                      }}
                    >
                      Aggiungi un immagine di copertina al tuo viaggio, e
                      rendilo ancora più unico!
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "white",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      borderRadius: 10,
                      margin: 20,
                      paddingTop: 20,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.text,
                        fontSize: 23,
                        textAlign: "center",
                        color: color.secondary,
                      }}
                    >
                      Novità versione {appVersion}
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.text_bold,
                        fontSize: 23,
                        textAlign: "center",
                        marginTop: 50,
                        marginBottom: 20,
                      }}
                    >
                      Condividi le tue esperienze!
                    </Text>
                    <Image
                      source={require("../assets/image/News/Card.jpg")}
                      style={{
                        width: 300,
                        height: 300,
                      }}
                      resizeMode="contain"
                    />
                    <Text
                      style={{
                        fontFamily: font.montserrat,
                        fontSize: 20,
                        marginTop: 20,
                        textAlign: "center",
                      }}
                    >
                      Invia le immagini ai partecipanti di un viaggio, e
                      permetti a loro di scaricarle, anche più insieme!
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-evenly",
                        alignItems: "center",
                        marginTop: 20,
                      }}
                    >
                      <TouchableOpacity
                        onPress={async () => {
                          await storeStringData(appVersion, "true");
                          setShowNew(false);
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: font.montserrat,
                            fontSize: 20,
                            color: color.primary,
                            textDecorationLine: "underline",
                          }}
                        >
                          Chiudi
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Swiper>
              </View>
            </Modal>
          )}

          <MainHeader
            navigation={navigation}
            updateJoinTravels={loadJoinedTravels}
            refresh={refreshing}
          />
          <Sheet style={styles.sheet}>
            <View style={styles.content}>
              <SearchField
                placeholder="Cerca un account"
                style={styles.search}
                onSubmitEditing={(event: any) => {
                  setSerchData([]);
                  if (
                    event.nativeEvent.text == "" ||
                    event.nativeEvent.text.length < 3
                  )
                    setSerchData([]);
                  else {
                    setSearchLoading(true);
                    axios
                      .get<ApiUser[]>(
                        serverLink +
                          "api/user/search?username=" +
                          event.nativeEvent.text
                      )
                      .then((response) => {
                        if (response.status == 200) {
                          setSerchData(response.data);
                          setSearchLoading(false);
                        }
                      })
                      .catch((error) => {
                        console.log(error);
                      });
                  }
                }}
                onChangeText={(text: string) => {
                  setSerchData([]);

                  if (
                    text == "" ||
                    text.length < 3 ||
                    text == null ||
                    text == undefined
                  )
                    setSerchData([]);
                  else {
                    setSearchLoading(true);
                    axios
                      .get<ApiUser[]>(serverLink + "api/user/search?username=" + text)
                      .then((response) => {
                        if (response.status == 200) {
                          setSerchData(response.data);
                          setSearchLoading(false);
                        }
                      })
                      .catch((error) => {
                        console.log(error);
                      });
                  }
                }}
              />

              {serchData.length == 0 &&
              !searchLoading ? null : !searchLoading && serchData.length > 0 ? (
                <View style={styles.searchResults}>
                  <FlatList
                    scrollEnabled={false}
                    data={serchData}
                    renderItem={({ item }) => (
                      <>
                        {userData && userData._id != item._id && (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              navigation.navigate("OtherProfile", {
                                userid: item._id,
                              });
                            }}
                          >
                            <View style={styles.usercard}>
                              <InitialsAvatar
                                name={item.name + " " + item.surname}
                                size={38}
                              />
                              <View style={styles.usercardText}>
                                <Text style={styles.usercardName}>
                                  {item.name} {item.surname}
                                </Text>
                                <Text style={styles.usercardUsername}>
                                  @{item.username}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  />
                </View>
              ) : searchLoading ? (
                <ActivityIndicator
                  style={{ marginBottom: ds.space[5] }}
                  color={ds.colors.action}
                />
              ) : (
                <EmptyState
                  icon="account-search-outline"
                  title="Nessun utente trovato"
                />
              )}

              <SectionLabel>I tuoi prossimi viaggi</SectionLabel>
              {joinedTravelsLoading && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                </ScrollView>
              )}
              {joinedTravels != null &&
                joinedTravels &&
                joinedTravels.length > 0 &&
                !joinedTravelsLoading && userData && userData.username && (
                  <FlatList
                    data={joinedTravels}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.travelsList}
                    contentContainerStyle={styles.travelsListContent}
                    renderItem={({ item }) => (
                      <Card
                        isLoading={joinedTravelsLoading}
                        data={item}
                        navigation={navigation}
                        username={(userData && userData.username) || ""}
                      />
                    )}
                  />
                )}
              {(joinedTravels == null || joinedTravels == false || joinedTravels.length == 0) &&
                !joinedTravelsLoading && (
                  <EmptyState
                    icon="airplane-off"
                    title="Nessun viaggio trovato"
                    description="Crea un viaggio o unisciti con un codice invito."
                  />
                )}

              <InteractiveCard
                navigation={navigation}
                updatecards={loadJoinedTravels}
              />

              <SectionLabel>Ultimi post dai tuoi viaggi</SectionLabel>
              {lastPostsLoading && <PostLoading />}
              {lastPosts != null &&
                lastPosts &&
                lastPosts[0].length > 0 &&
                !lastPostsLoading && (
                  <FlatList
                    scrollEnabled={false}
                    data={lastPosts[0]}
                    renderItem={({ item }) => (
                      <>
                        {item.type == "text" ? (
                          <TextComponent
                            home={true}
                            item={item}
                            travel={lastPosts && lastPosts[1][item.travel]}
                            username={(userData && userData.username) || ""}
                          />
                        ) : item.type == "vote" ? (
                          <Vote
                            item={item}
                            home={true}
                            travel={lastPosts && lastPosts[1][item.travel]}
                            username={(userData && userData.username) || ""}
                          />
                        ) : item.type == "payments" ? (
                          <PaymentComponent
                            item={item}
                            home={true}
                            travel={lastPosts && lastPosts[1][item.travel]}
                            username={(userData && userData.username) || ""}
                          />
                        ) : item.type == "images" ? (
                          <ImagesComponent
                            item={item}
                            home={true}
                            travel={lastPosts && lastPosts[1][item.travel]}
                            username={(userData && userData.username) || ""}
                          />
                        ) : item.type === "todo" ? (
                          <ToDo
                            data={item}
                            home={true}
                            travel={lastPosts && lastPosts[1][item.travel]}
                            username={(userData && userData.username) || ""}
                          />
                        ) : (
                          item.type === "itinerary" && (
                            <ItineraryEvent
                              item={item}
                              home={true}
                              travel={lastPosts && lastPosts[1][item.travel]}
                              username={(userData && userData.username) || ""}
                            />
                          )
                        )}
                      </>
                    )}
                  />
                )}
              {(lastPosts == null || lastPosts == false || lastPosts[0].length == 0) && (
                <EmptyState
                  icon="post-outline"
                  title="Nessun post trovato"
                  description="I post dei tuoi viaggi compariranno qui."
                />
              )}
            </View>
          </Sheet>
        </View>
        </ScrollView>
      </View>
    );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: ds.colors.brand,
  },
  sheet: {
    paddingBottom: ds.layout.contentBottomPadding,
  },
  content: {
    backgroundColor: ds.colors.surface,
  },
  search: {
    marginBottom: ds.space[7] - 2,
  },
  searchResults: {
    marginBottom: ds.space[5],
  },
  usercard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: ds.space[3] + 2,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  usercardText: {
    flex: 1,
    marginLeft: ds.space[3] + 2,
  },
  usercardName: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  usercardUsername: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  travelsList: {
    marginHorizontal: -ds.layout.screenPadding,
    marginBottom: ds.space[7] - 2,
  },
  travelsListContent: {
    paddingHorizontal: ds.layout.screenPadding,
    paddingBottom: ds.space[2],
  },
});
