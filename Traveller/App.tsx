import React, { useEffect, useState, createContext, Dispatch, SetStateAction } from "react";
import axios, { AxiosResponse } from "axios";
import Font from "./components/font";
import { color, font, statusBarColor } from "./global/globalVariable";
import {
  Image,
  View,
  Text,
  StatusBar,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Loading from "./shared/loading";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { serverLink } from "./global/globalVariable";
import Nav from "./screens/nav";
import Tickets from "./screens/tickets";
import InitialModal from "./screens/Modals/initialModal";
import {
  getStringDataWithStateReverse,
  getData,
} from "./shared/data/localdata";
import Money from "./screens/money";
import TicketsPreview from "./components/tickets/ticketsPreview";
import { FlatList, GestureHandlerRootView } from "react-native-gesture-handler";
import TicketModal from "./screens/Modals/ticketModal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "./global/designSystem";
import { AuthProvider, useAuth } from "./global/authContext";
import AuthScreen from "./components/auth/AuthScreen";
import {
  iconConfig,
  tabBarStyle,
  tabItemStyle,
  tabLabelStyle,
  tabColors,
} from "./global/bottombarConfig";
import { ApiUser, ApiTicket } from "./shared/types/api";

interface GlobalUserContextValue {
  globalUserInfo: Partial<ApiUser>;
  setGlobalUserInfo: Dispatch<SetStateAction<Partial<ApiUser>>>;
}

export const GlobalUserContext = createContext<GlobalUserContextValue | undefined>(undefined);

/* Il controllo della sessione (AuthProvider) avvolge tutta l'app: AppInner
   può quindi usare useAuth() per decidere cosa mostrare prima ancora che
   la tab bar esista, invece di lasciare che sia la sola Home a nascondere
   il proprio contenuto dietro un modale di login (vedi note più sotto). */
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function AppInner() {
  let [globalUserInfo, setGlobalUserInfo] = useState<Partial<ApiUser>>({});
  let [isLoading, setIsLoading] = useState(false);
  let auth = useAuth();
  let fontLoaded = Font();
  let [modalVisible, setModalVisible] = useState(false);
  let [connection, setConnection] = useState<boolean | "error">(false);
  let [ticketsModalVisibility, setTicketsVisibility] = useState(false);
  getStringDataWithStateReverse("initialModal", modalVisible, setModalVisible);
  let [offlineTickets, setOfflineTickets] = useState<ApiTicket[]>([]);
  let [statusBarColorApp, setStatusBarColorApp] = useState(statusBarColor);

  useEffect(() => {
    setStatusBarColorApp(statusBarColor);
  }, [statusBarColor]);

  useEffect(() => {
    // Il refresh del profilo utente (e il suo (ri)salvataggio su storage) è
    // ora responsabilità di AuthProvider (global/authContext.tsx), che lo fa
    // sempre ripulendo il campo "password": farlo anche qui duplicherebbe la
    // chiamata e, soprattutto, riscriverebbe l'utente completo (password
    // inclusa) su AsyncStorage in chiaro.
    verifyConnection();
  }, []);

  async function verifyConnection() {
    setOfflineTickets(await getData("tickets"));

    setIsLoading(true);
    axios({
      method: "get",
      url: serverLink + "api/verifyConnection",
      timeout: 15000,
    })
      .then((response: AxiosResponse<string>) => {
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

  // Voce della tab bar: icona + etichetta sempre visibili, colore diverso se attiva
  const TabBarIcon = ({ focused, route }: { focused: boolean; route: { name: string } }) => {
    const config = iconConfig[route.name] || iconConfig.Home;
    const tintColor = focused ? tabColors.active : tabColors.inactive;

    return (
      <View style={tabItemStyle}>
        <MaterialCommunityIcons
          name={focused ? config.active : config.inactive}
          size={focused ? 18 : 19}
          color={tintColor}
        />
        <Text style={[tabLabelStyle, { color: tintColor }]}>{config.label}</Text>
      </View>
    );
  };

  // Un'unica schermata di caricamento copre sia l'attesa dei font sia la
  // verifica della sessione salvata (AuthProvider): prima, la verifica della
  // sessione avveniva dentro la sola Home, che nel frattempo mostrava una
  // View bianca vuota (con la tab bar già visibile) — un lampo evitabile
  // prima di arrivare, se l'utente era già loggato, alla schermata giusta.
  if (!fontLoaded || !connection || auth.status === "checking") {
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
                {offlineTickets != null && offlineTickets.length > 0 ? (
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
  } else if (auth.status === "signedOut") {
    // Prima, un utente non loggato vedeva comunque l'intera tab bar (Home,
    // Tickets, Money): solo la Home si accorgeva di non avere una sessione
    // valida e ci disegnava sopra un modale di login. Con la sessione
    // verificata qui, prima di montare il Tab.Navigator, chi non è
    // autenticato non può raggiungere quelle schermate.
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar backgroundColor={ds.colors.brand} barStyle="light-content" />
        <AuthScreen initialMode="login" onAuthenticated={(user) => auth.login(user)} />
      </GestureHandlerRootView>
    );
  } else if (fontLoaded && connection) {
    const Tab = createBottomTabNavigator();

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        {Platform.OS !== "ios" && (
          <StatusBar backgroundColor={ds.colors.brand} barStyle="light-content" />
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
                tabBarActiveTintColor: ds.colors.white,
                tabBarInactiveTintColor: ds.colors.onBrandFaint,
                tabBarStyle: tabBarStyle,
                tabBarItemStyle: { height: "100%" },
                tabBarIcon: ({ focused }) => (
                  <TabBarIcon focused={focused} route={route} />
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
                component={Tickets}
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
      </GestureHandlerRootView>
    );
  }
}
