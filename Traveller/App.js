import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Font from "./components/font";
import TicketsPreview from "./components/tickets/ticketsPreview";
import { setTickets } from "./controllers/ticketsData";
import { setUserInfo } from "./controllers/userData";
import { bottomBarStyle, iconConfig } from "./global/bottombarConfig";
import {
  color,
  font,
  serverLink,
  statusBarColor,
} from "./global/globalVariable";
import InitialModal from "./screens/Modals/initialModal";
import LoginModal from "./screens/Modals/login";
import TicketModal from "./screens/Modals/ticketModal";
import Money from "./screens/money";
import Nav from "./screens/nav";
import TicketNav from "./screens/ticketNav";
import {
  getData,
  getStringDataWithStateReverse,
} from "./shared/data/localdata";
import Loading from "./shared/loading";

export const GlobalUserContext = createContext();

export default function App() {
  let [globalUserInfo, setGlobalUserInfo] = useState({});
  let [isLoading, setIsLoading] = useState(false);
  let fontLoaded = Font();
  let [modalVisible, setModalVisible] = useState(false);
  let [connection, setConnection] = useState(false);
  let [ticketsModalVisibility, setTicketsVisibility] = useState(false);
  getStringDataWithStateReverse("initialModal", modalVisible, setModalVisible);
  let [offlineTickets, setOfflineTickets] = useState([]);
  let [statusBarColorApp, setStatusBarColorApp] = useState(statusBarColor);
  let [logged, setLogged] = useState(false);

  useEffect(() => {
    setStatusBarColorApp(statusBarColor);
  }, [statusBarColor]);

  useEffect(() => {
    updateUserInfo();
    verifyConnection();
  }, []);

  async function updateUserInfo() {
    let userData = await AsyncStorage.getItem("user");
    if (userData) {
      userData = JSON.parse(userData);
      if (userData._id) {
        console.log("Userdata: ", userData);
        console.log("userdata _id: ", userData._id);
        axios
          .get(serverLink + "api/user/takeUserById?id=" + userData._id)
          .then(async (response) => {
            setUserInfo(response.data[0]);
            setLogged(true);
            await AsyncStorage.setItem(
              "user",
              JSON.stringify(response.data[0])
            );
          })
          .catch((ex) => {
            console.error(ex.message);
          });
      }
    } else {
      setLogged(false);
    }
  }

  async function verifyConnection() {
    setTickets(await getData("tickets"));

    setIsLoading(true);
    axios({
      method: "get",
      url: serverLink + "api/verifyConnection",
      timeout: 15000,
    })
      .then((response) => {
        if (response.status == 200) {
          setConnection(true);
          setIsLoading(false);
        } else {
          setConnection("error");
          setIsLoading(false);
        }
      })
      .catch((error) => {
        setConnection("error");
        setIsLoading(false);
      });
  }

  const TabBarIcon = ({ focused, color, size, route }) => {
    return (
      <View
        style={[
          bottomBarStyle.focusedIconContainerStyle,
          focused && { backgroundColor: "#4960FF40" },
        ]}
      >
        <Image
          style={[
            bottomBarStyle.bottomBarImage,
            { tintColor: (focused) ? '#000' :  color },
            !focused && bottomBarStyle.bottomBarImageFocus,
          ]}
          source={iconConfig[route.name]}
        />
        {focused && <Text style={bottomBarStyle.focusedTextStyle}>{route.name}</Text>}
      </View>
    );
  };

  if (!fontLoaded || !connection) {
    return <Loading />;
  } else if (connection == "error") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Image
          style={{ width: 50, height: 50, marginBottom: 20 }}
          source={require("./assets/image/icona-alert.png")}
        />
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            fontFamily: "montserrat-regular",
          }}
        >
          Errore di connessione al server 😥
        </Text>
        {!isLoading ? (
          <TouchableOpacity
            onPress={() => verifyConnection()}
            style={{
              marginTop: 20,
              backgroundColor: color.primary,
              padding: 10,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                fontFamily: "montserrat-regular",
                color: "white",
              }}
            >
              Riprova
            </Text>
          </TouchableOpacity>
        ) : (
          <ActivityIndicator
            style={{ marginTop: 20 }}
            size="large"
            color={statusBarColorApp}
          />
        )}
        <TouchableOpacity onPress={() => setTicketsVisibility(true)}>
          <Text
            style={{
              marginTop: 20,
              fontSize: 18,
              fontFamily: "montserrat-regular",
              color: color.secondary,
              textDecorationStyle: "solid",
              textDecorationLine: "underline",
            }}
          >
            Visualizza biglietti offline
          </Text>
          <Modal visible={ticketsModalVisibility} animationType="slide">
            <SafeAreaView
              style={{
                flex: 1,
              }}
            >
              <Text
                style={{
                  marginTop: 20,
                  fontSize: 20,
                  fontFamily: font.montserratBold,
                  textAlign: "center",
                }}
              >
                Biglietti offline
              </Text>
              <View
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {offlineTickets && offlineTickets ? (
                  <FlatList
                    data={offlineTickets}
                    scrollEnabled={true}
                    renderItem={({ item }) => (
                      <>
                        <TicketsPreview item={item} />
                      </>
                    )}
                  />
                ) : (
                  <Text
                    style={{
                      marginTop: 50,
                      fontSize: 20,
                      fontFamily: font.montserrat,
                      textAlign: "center",
                    }}
                  >
                    Non ci sono biglietti salvati offline
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={{ position: "absolute", bottom: 20, width: "100%" }}
                onPress={() => setTicketsVisibility(false)}
              >
                <Text
                  style={{
                    marginTop: 20,
                    fontSize: 18,
                    fontFamily: "montserrat-regular",
                    color: color.secondary,
                    textDecorationStyle: "solid",
                    textDecorationLine: "underline",
                    textAlign: "center",
                    width: "100%",
                  }}
                >
                  Chiudi
                </Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Modal>
        </TouchableOpacity>
      </View>
    );
  } else if (fontLoaded && connection && !logged) {
    return (
      <>
        <StatusBar backgroundColor={color.primary} barStyle="white-content" />
        <LoginModal setLogged={setLogged} />
      </>
    );
  } else if (fontLoaded && connection && logged) {
    const Tab = createBottomTabNavigator();

    return (
      <>
        {Platform.OS !== "ios" && (
          <StatusBar backgroundColor={color.primary} barStyle="white-content" />
        )}
        <InitialModal
          visibility={modalVisible}
          setVisibility={setModalVisible}
        />
        <GlobalUserContext.Provider
          value={{ globalUserInfo, setGlobalUserInfo }}
        >
          <NavigationContainer>
            <Tab.Navigator
              initialRouteName="Home"
              screenOptions={({ route }) => ({
                tabBarVisibilityAnimationConfig: {
                  show: {
                    animation: "timing",
                    config: {
                      duration: 300,
                    },
                  },
                  hide: {
                    animation: "timing",
                    config: {
                      duration: 300,
                    },
                  },
                },
                animationEnabled: true,
                tabBarShowLabel: false,
                activeTintColor: "#000",
                topBarActiveTintColor: "#000",
                tabBarLabelStyle: bottomBarStyle.textInputStyle,
                tabBarStyle: bottomBarStyle.tabBarStyle,
                tabBarIcon: ({ focused, color, size }) => (
                  <TabBarIcon
                    focused={focused}
                    color={color}
                    size={size}
                    route={route}
                  />
                ),
              })}
            >
              <Tab.Screen
                options={{ headerShown: false }}
                name="Home"
                component={Nav}
              />
              <Tab.Screen
                options={{
                  headerShown: false,
                }}
                name="Tickets"
                component={TicketNav}
              />
              <Tab.Screen
                options={{
                  headerShown: false,
                }}
                name="Money"
                component={Money}
              />
              <Tab.Screen
                name="TicketsModal"
                component={TicketModal}
                options={{
                  headerShown: false,
                  tabBarButton: (props) => null,
                  tabBarStyle: { display: "none" },
                }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </GlobalUserContext.Provider>
      </>
    );
  }
}
