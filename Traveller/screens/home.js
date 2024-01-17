import { Avatar } from "@react-native-material/core";
import axios from "axios";
import Constants from "expo-constants";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Swiper from "react-native-swiper";
import InteractiveCard from "../components/interactiveCard";
import MainHeader from "../components/mainHeader";
import {
  appVersion,
  color,
  font,
  serverLink
} from "../global/globalVariable";
import LoginModal from "../screens/Modals/login";
import Card from "../shared/card";
import {
  getStringData,
  storeStringData
} from "../shared/data/localdata";
import LoadingCard from "../shared/loadingCard";
import { getUserInfo } from "../controllers/userData";

// Componenti
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import ImagesComponent from "../components/Travel-Componets/ImagesComponent";
import ToDo from "../components/Travel-Componets/ToDo";
import PaymentComponent from "../components/Travel-Componets/payments";
import TextComponent from "../components/Travel-Componets/textcomponent";
import Vote from "../components/Travel-Componets/vote";
import PostLoading from "../components/loading/PostLoading";
import { startSocket } from "../global/socket";

export default function Home({ navigation }) {
  let [joinedTravelsLoading, setJoinedTravelsLoading] = useState(true);
  let [lastPostsLoading, setLastPostsLoading] = useState(true);
  let [lastPosts, setLastPosts] = useState(false);
  let [userData, setUserData] = useState(false);
  let [joinedTravels, setJoinedTravels] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serchData, setSerchData] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  let [openLogin, setOpenLogin] = React.useState(false);
  let [logged, setLogged] = React.useState(false);
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Verifica se l'utente ha abilitato le notifiche e se sono presenti su DB
  const verifyNotifications = async () => {
    let data = getUserInfo();
    // setOpenLogin(false);
    let notificationToken = await SecureStore.getItemAsync("notif-token");
    if (!notificationToken) {
      await registerForPushNotificationsAsync()
        .then((token) => {
          SecureStore.setItemAsync("notif-token", token);
          axios
            .post(serverLink + "api/user/setNotifToken", {
              userid: data._id,
              notifToken: token,
            })
            .then((response) => {
              notificationListener.current =
                Notifications.addNotificationReceivedListener(
                  (notification) => {
                    setNotification(notification);
                  }
                );

              responseListener.current =
                Notifications.addNotificationResponseReceivedListener(
                  (response) => {}
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
        .post(serverLink + "api/user/verifyToken", {
          userid: data._id,
          notificationToken: notificationToken,
        })
        .then((response) => {
          notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
              setNotification(notification);
            });

          responseListener.current =
            Notifications.addNotificationResponseReceivedListener(
              (response) => {}
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

  useEffect(() => {
    let data = getUserInfo();
    setUserData(data);
    storeStringData("username", data.username);
    setLogged(true);
    loadJoinedTravels(data.username, data._id);
    takePost(data._id, data.username);
    verifyNotifications();
    startSocket();
    axios
      .get(serverLink + "api/takeVersion")
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
    let data = getUserInfo();
    loadJoinedTravels(data.username, data._id);
    takePost(data._id, data.username);
    setRefreshing(false);
  };

  function loadJoinedTravels(username, userid) {
    axios
      .get(
        serverLink +
          "api/travel/takeJoined?username=" +
          username +
          "&userid=" +
          userid
      )
      .then(async (response) => {
        if (response.status == 200) {
          await setJoinedTravels(response.data);
          await setJoinedTravelsLoading(false);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function takePost(userid, username) {
    axios
      .get(
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
          console.log(response.data)
          await setLastPosts(response.data);
          await setLastPostsLoading(false);
        }
      })
      .catch((error) => {
        console.log("Last Post", error);
      });
  }

  // Produce il token per le notifiche
  async function registerForPushNotificationsAsync() {
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
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      })
    ).data;

    return token;
  }

  if (!logged) {
    return (
      <>
        <LoginModal
          navigation={navigation}
          visibility={openLogin}
          setVisibility={setOpenLogin}
          setHomeContent={setLogged}
        />
        <View style={styles.container}></View>
      </>
    );
  } else if (logged) {
    return (
      <ScrollView
        style={{ backgroundColor: color.primary }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SafeAreaView style={styles.container}>
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
                          await setShowNew(false);
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
          <View style={styles.blue}>
            <View style={styles.content}>
              <TextInput
                placeholder="Cerca un account"
                style={
                  !serchData.length ? styles.input : styles.inputResult
                }
                inputStyle={{ fontFamily: font.montserrat }}
                onSubmitEditing={(event) => {
                  setSerchData([]);
                  if (
                    event.nativeEvent.text == "" ||
                    event.nativeEvent.text.length < 3
                  )
                    setSerchData([]);
                  else {
                    setSearchLoading(true);
                    axios
                      .get(
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
                onChangeText={(text) => {
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
                      .get(serverLink + "api/user/search?username=" + text)
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

              {!serchData.length &&
              !searchLoading ? null : !searchLoading && serchData.length ? (
                <View
                  style={{
                    marginBottom: 10,
                    borderBottomRightRadius: 10,
                    borderBottomLeftRadius: 10,
                  }}
                >
                  <FlatList
                    scrollEnabled={false}
                    data={serchData}
                    renderItem={({ item }) => (
                      <>
                        {userData._id != item._id && (
                          <TouchableOpacity
                            onPress={() => {
                              navigation.navigate("OtherProfile", {
                                userid: item._id,
                              });
                            }}
                          >
                            <View style={styles.usercard}>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                }}
                              >
                                <Avatar
                                  autoColor
                                  label={item.name + " " + item.surname}
                                  labelStyle={{
                                    fontFamily: font.montserrat,
                                    fontSize: 18,
                                  }}
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 50,
                                    marginRight: 10,
                                  }}
                                />
                                <View>
                                  <Text
                                    style={{
                                      fontFamily: font.montserrat,
                                      fontSize: 20,
                                    }}
                                  >
                                    {item.name} {item.surname}
                                  </Text>
                                  <Text
                                    style={{
                                      fontFamily: font.montserrat,
                                      fontSize: 15,
                                    }}
                                  >
                                    @{item.username}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  />
                </View>
              ) : searchLoading ? (
                <ActivityIndicator size="large" color={color.secondary} />
              ) : (
                <View
                  style={{
                    height: 140,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontFamily: "montserrat-light",
                      fontSize: 15,
                    }}
                  >
                    Nessun utente trovato : /
                  </Text>
                </View>
              )}
              <Text style={styles.subtitle}>I tuoi prossimi viaggi:</Text>
              {joinedTravelsLoading && (
                <ScrollView horizontal>
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                </ScrollView>
              )}
              {joinedTravels != null &&
                joinedTravels.length &&
                !joinedTravelsLoading &&
                userData.username && (
                  <FlatList
                    data={joinedTravels}
                    horizontal
                    renderItem={({ item }) => (
                      <Card
                        isLoading={joinedTravelsLoading}
                        data={item}
                        navigation={navigation}
                        username={userData.username}
                      />
                    )}
                  />
                )}
              {(!joinedTravels || !joinedTravels.length) &&
                !joinedTravelsLoading && (
                  <View
                    style={{
                      height: 140,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontFamily: "montserrat-light",
                        fontSize: 15,
                      }}
                    >
                      Nessun viaggio trovato : /
                    </Text>
                  </View>
                )}
              <InteractiveCard
                updatecards={loadJoinedTravels}
                setUserState={setUserData}
                userState={userData}
              />
              <Text style={styles.subtitle}>
                Gli ultimi post dai tuoi viaggi:
              </Text>
              {lastPostsLoading && <PostLoading />}
              {lastPosts &&
                lastPosts.length &&
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
                            travel={lastPosts[1][item.travel]}
                          />
                        ) : item.type == "vote" ? (
                          <Vote
                            item={item}
                            home={true}
                            travel={lastPosts[1][item.travel]}
                          />
                        ) : item.type == "payments" ? (
                          <PaymentComponent
                            item={item}
                            home={true}
                            travel={lastPosts[1][item.travel]}
                          />
                        ) : item.type == "images" ? (
                          <ImagesComponent
                            item={item}
                            home={true}
                            travel={lastPosts[1][item.travel]}
                          />
                        ) : (
                          item.type === "todo" && (
                            <ToDo
                              data={item}
                              home={true}
                              travel={lastPosts[1][item.travel]}
                            />
                          )
                        )}
                      </>
                    )}
                  />
                )}
              {(!lastPosts || !lastPosts.length) && (
                <View
                  style={{
                    height: 140,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontFamily: "montserrat-light",
                      fontSize: 15,
                    }}
                  >
                    Nessun post trovato : /
                  </Text>
                </View>
              )}
            </View>
            <View
              style={{ height: 75, backgroundColor: "#FFF", width: "100%" }}
            />
          </View>
        </SafeAreaView>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  title: {
    fontSize: 30,
    fontWeight: 200,
    marginBottom: 20,
    fontFamily: font.text_bold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 200,
    marginBottom: 10,
    textAlign: "left",
    fontFamily: font.text,
    marginLeft: 10,
  },
  blue: {
    backgroundColor: color.secondary,
    height: "100%",
    width: "100%",
  },
  content: {
    backgroundColor: "white",
    borderTopEndRadius: 20,
    borderTopStartRadius: 20,
    paddingTop: 20,
  },
  input: {
    width: Dimensions.get("window").width - 20,
    fontFamily: font.text,
    height: 40,
    backgroundColor: "#F5F5F5",
    marginBottom: 20,
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 10,
    marginLeft: 10,
  },
  inputResult: {
    width: Dimensions.get("window").width - 20,
    fontFamily: font.text,
    height: 40,
    backgroundColor: "#F5F5F5",
    paddingLeft: 10,
    paddingRight: 10,
    marginLeft: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  usercard: {
    width: Dimensions.get("window").width - 20,
    height: 60,
    backgroundColor: "#F5F5F5",
    paddingLeft: 10,
    paddingRight: 10,
    marginLeft: 10,
    paddingTop: 10,
    borderTopColor: "lightgray",
    borderTopWidth: 1,
  },
});
