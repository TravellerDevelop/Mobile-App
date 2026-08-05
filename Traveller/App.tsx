import React, { useEffect, useState, createContext, Dispatch, SetStateAction } from "react";
import Font from "./components/font";
import { View, Text, StatusBar, Platform } from "react-native";
import Loading from "./shared/loading";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Nav from "./screens/nav";
import Tickets from "./screens/tickets";
import InitialModal from "./screens/Modals/initialModal";
import { getStringDataWithStateReverse } from "./shared/data/localdata";
import Money from "./screens/money";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import TicketModal from "./screens/Modals/ticketModal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "./global/designSystem";
import { AuthProvider, useAuth } from "./global/authContext";
import { NetworkProvider } from "./global/networkContext";
import OfflineBanner from "./components/OfflineBanner";
import { pingServer } from "./shared/data/netStatus";
import AuthScreen from "./components/auth/AuthScreen";
import {
  iconConfig,
  tabBarStyle,
  tabItemStyle,
  tabLabelStyle,
  tabColors,
} from "./global/bottombarConfig";
import { ApiUser } from "./shared/types/api";
import { NotificationsProvider } from "./components/notifications/NotificationsProvider";
import { rootNavigationRef } from "./components/notifications/navigation";
import { RealtimeProvider } from "./components/realtime";

interface GlobalUserContextValue {
  globalUserInfo: Partial<ApiUser>;
  setGlobalUserInfo: Dispatch<SetStateAction<Partial<ApiUser>>>;
}

export const GlobalUserContext = createContext<GlobalUserContextValue | undefined>(undefined);

/* Il controllo della sessione (AuthProvider) avvolge tutta l'app: AppInner
   può quindi usare useAuth() per decidere cosa mostrare prima ancora che
   la tab bar esista, invece di lasciare che sia la sola Home a nascondere
   il proprio contenuto dietro un modale di login (vedi note più sotto).

   NetworkProvider sta sopra tutto perché serve sia al banner offline sia
   alle schermate (useNetwork / useOnReconnect). */
export default function App() {
  return (
    /* SafeAreaProvider esplicito: finora gli insets arrivavano solo dai
       navigator (che montano il proprio SafeAreaProviderCompat), ma il
       banner offline vive fuori dalla navigazione e useSafeAreaInsets
       senza provider lancia. initialWindowMetrics evita il frame iniziale
       con insets a zero. */
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NetworkProvider>
        <AuthProvider>
          {/* Sotto AuthProvider (gli serve il socketToken della sessione) e
              sopra tutto il resto: apre una sola connessione per l'intera
              app, che sopravvive al cambio di schermata. Le schermate non
              aprono mai un socket per conto loro. */}
          <RealtimeProvider>
            <AppInner />
          </RealtimeProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}

function AppInner() {
  let [globalUserInfo, setGlobalUserInfo] = useState<Partial<ApiUser>>({});
  let auth = useAuth();
  let fontLoaded = Font();
  let [modalVisible, setModalVisible] = useState(false);
  getStringDataWithStateReverse("initialModal", modalVisible, setModalVisible);

  useEffect(() => {
    /* Un solo ping all'avvio, non bloccante: serve solo a impostare lo
       stato iniziale del banner. L'app NON aspetta più questa risposta
       per partire — prima, senza rete (o con il server addormentato),
       restava su una pagina "Errore di connessione al server" da cui si
       potevano vedere soltanto i biglietti, mentre tutti gli altri dati
       erano comunque già salvati sul dispositivo. */
    void pingServer();
  }, []);

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
  // verifica della sessione salvata (AuthProvider). Il vecchio gate di
  // connessione non c'è più: senza rete l'app entra comunque, e ogni
  // schermata mostra i dati che ha in cache (shared/data/apiClient).
  if (!fontLoaded || auth.status === "checking") {
    return <Loading />;
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
        {/* Anche qui: login e registrazione sono le uniche operazioni che
            offline non possono funzionare, quindi il banner serve a dire
            perché il pulsante non fa nulla. */}
        <OfflineBanner />
      </GestureHandlerRootView>
    );
  } else {
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
          {/* Sopra la navigazione ma sotto AuthProvider: il provider ha
              bisogno dell'utente loggato (per token push e centro notifiche)
              e i navigator devono essere montati per il deep-link. */}
          <NotificationsProvider userId={auth.user?._id ?? null}>
          <NavigationContainer ref={rootNavigationRef}>
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
          </NotificationsProvider>
        </GlobalUserContext.Provider>
        {/* Ultimo figlio: è un overlay assoluto e deve stare sopra la
            navigazione, senza spostarne il layout. */}
        <OfflineBanner />
      </GestureHandlerRootView>
    );
  }
}
