import React, { useEffect, useState, useContext, createContext } from 'react';
import Font from './components/font';
import { color } from './global/globalVariable';
import { Image, View, Text, StatusBar, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import Loading from './shared/loading';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { serverLink } from './global/globalVariable';
import Nav from './screens/nav';
import Tickets from './screens/tickets';
import Travels from './screens/travels';
import InitialModal from './screens/Modals/initialModal';
import { getStringDataWithStateReverse } from './shared/data/localdata';
import Money from './screens/money';
import WhitePage from './shared/white';
import axios from 'axios';

export const GlobalUserContext = createContext();

export default function App() {
  let [globalUserInfo, setGlobalUserInfo] = useState({});

  let [isLoading, setIsLoading] = useState(false);

  let fontLoaded = Font();
  let [modalVisible, setModalVisible] = useState(false);
  let [connection, setConnection] = useState(false);

  getStringDataWithStateReverse('initialModal', modalVisible, setModalVisible);

  useEffect(() => {
    verifyConnection();

  }, []);

  function verifyConnection() {
    setIsLoading(true);
    axios({
      method: 'get',
      url: serverLink + "api/verifyConnection",
      timeout: 15000,
    })
      .then((response) => {
        if (response.status == 200) {

          setConnection(true);
          setIsLoading(false);
        }
        else {
          setConnection('error')
          setIsLoading(false);
        }
      })
      .catch((error) => {
        setConnection('error');
        setIsLoading(false);
      });
  }

  if (!fontLoaded || !connection) {
    return (
      <Loading />
    )
  }
  else if (connection == 'error') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Image style={{ width: 50, height: 50, marginBottom: 20 }} source={require('./assets/image/icona-alert.png')} />
        <Text style={{ fontSize: 20, fontWeight: 'bold', fontFamily: "montserrat-regular" }}>Errore di connessione al server 😥</Text>
        {
          (!isLoading) ?
            <TouchableOpacity onPress={() => verifyConnection()} style={{ marginTop: 20, backgroundColor: color.primary, padding: 10, borderRadius: 10 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', fontFamily: "montserrat-regular", color: "white" }}>Riprova</Text>
            </TouchableOpacity>
            :
            <ActivityIndicator style={{ marginTop: 20 }} size="large" color={color.primary} />
        }
      </View>
    )
  }
  else if (fontLoaded && connection) {
    const Tab = createBottomTabNavigator();

    return (
      <>
        {(Platform.OS === 'ios') ?
          <View style={{ "backgroundColor": color.primary, "height": 30, width: "100%" }}></View>
          :
          <StatusBar backgroundColor={color.primary} barStyle="white-content" />}
        <InitialModal visibility={modalVisible} setVisibility={setModalVisible} />
        <GlobalUserContext.Provider value={{ globalUserInfo, setGlobalUserInfo }}>
          <NavigationContainer>
            <Tab.Navigator
              initialRouteName="White"
              screenOptions={({ route }) => ((Platform.OS === 'ios') ? {
                tabBarVisibilityAnimationConfig: {
                  show: {
                    animation: 'timing',
                    config: {
                      duration: 300,
                    },
                  },
                  hide: {
                    animation: 'timing',
                    config: {
                      duration: 300,
                    },
                  },
                },
                animationEnabled: true,
                tabBarShowLabel: false,
                activeTintColor: '#4900FF',
                topBarActiveTintColor: '#4900FF',
                tabBarLabelStyle: {
                  fontFamily: "montserrat-regular",
                  fontSize: 12,
                  color: "black",
                  textAlign: "center",
                  marginTop: 5,
                  position: "absolute",
                  left: 75,
                },
                tabBarStyle: {
                  flexDirection: "row",
                  padding: 0,
                  height: 55,
                  width: "85%",
                  left: "7.5%",
                  position: "absolute",
                  bottom: 20,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "space-evenly",
                  backgroundColor: "white",
                  shadowColor: "#000000FF",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.23,
                  shadowRadius: 2.62,
                  elevation: 3,
                },
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName;

                  if (route.name === 'Home') {
                    iconName = focused
                      ? require('./assets/image/icona-home.png')
                      : require('./assets/image/icona-home.png');
                  } else if (route.name === 'Settings') {
                    iconName = focused ? require('./assets/image/icona-user.png') : require('./assets/image/icona-user.png');
                  }
                  else if (route.name === 'Tickets') {
                    iconName = focused ? require('./assets/image/icona-biglietto-1.png') : require('./assets/image/icona-biglietto-1.png');
                  }
                  else if (route.name === 'Travels') {
                    iconName = focused ? require('./assets/image/airplane.png') : require('./assets/image/airplane.png');
                  }
                  else if (route.name === 'Money') {
                    iconName = focused ? require('./assets/image/icona-wallet.png') : require('./assets/image/icona-wallet.png');
                  }

                  if (route.name != 'White' && focused)
                    return (
                      <View style={{ height: 40, backgroundColor: "#4960FF40", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 5, position:'absolute', top: -1.5 }}>
                        <Image style={{ width: 40, height: 30, tintColor: color, marginRight: 5, resizeMode: "contain" }} source={iconName} />
                        <Text style={{ color: color.primary, fontSize: 11, fontFamily: "montserrat-bold", textAlign: "center", color: "black", marginRight: 10 }}>{route.name}</Text>
                      </View>
                    )
                  else
                    return (
                      <Image style={{ width: 40, height: 30, tintColor: color, marginRight: 5, resizeMode: "contain", position: 'absolute', top: -1.5 }} source={iconName} />
                    )
                }
              }
                :
                {
                  tabBarVisibilityAnimationConfig: {
                    show: {
                      animation: 'timing',
                      config: {
                        duration: 300,
                      },
                    },
                    hide: {
                      animation: 'timing',
                      config: {
                        duration: 300,
                      },
                    },
                  },
                  animationEnabled: true,
                  tabBarShowLabel: false,
                  activeTintColor: '#4900FF',
                  topBarActiveTintColor: '#4900FF',
                  tabBarLabelStyle: {
                    fontFamily: "montserrat-regular",
                    fontSize: 12,
                    color: "black",
                    textAlign: "center",
                    marginTop: 5,
                    position: "absolute",
                    left: 75,
                  },
                  tabBarStyle: {
                    flexDirection: "row",
                    padding: 0,
                    height: 55,
                    width: "85%",
                    left: "7.5%",
                    position: "absolute",
                    bottom: 20,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "space-evenly",
                    backgroundColor: "white",
                    shadowColor: "#000000FF",
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.23,
                    shadowRadius: 2.62,
                    elevation: 3,
                  },
                  tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                      iconName = focused
                        ? require('./assets/image/icona-home.png')
                        : require('./assets/image/icona-home.png');
                    } else if (route.name === 'Settings') {
                      iconName = focused ? require('./assets/image/icona-user.png') : require('./assets/image/icona-user.png');
                    }
                    else if (route.name === 'Tickets') {
                      iconName = focused ? require('./assets/image/icona-biglietto-1.png') : require('./assets/image/icona-biglietto-1.png');
                    }
                    else if (route.name === 'Travels') {
                      iconName = focused ? require('./assets/image/airplane.png') : require('./assets/image/airplane.png');
                    }
                    else if (route.name === 'Money') {
                      iconName = focused ? require('./assets/image/icona-wallet.png') : require('./assets/image/icona-wallet.png');
                    }

                    if (route.name != 'White' && focused)
                      return (
                        <View style={{ height: 40, backgroundColor: "#4960FF40", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 5 }}>
                          <Image style={{ width: 40, height: 30, tintColor: color, marginRight: 5, resizeMode: "contain" }} source={iconName} />
                          <Text style={{ color: color.primary, fontSize: 11, fontFamily: "montserrat-bold", textAlign: "center", color: "black", marginRight: 10 }}>{route.name}</Text>
                        </View>
                      )
                    else
                      return (
                        <Image style={{ width: 40, height: 30, tintColor: color, marginRight: 5, resizeMode: "contain" }} source={iconName} />
                      )
                  }
                }
              )}
            >
              <Tab.Screen
                options={{
                  headerShown: false,
                  tabBarButton: (props) => null,
                  tabBarStyle: { display: 'none' },
                }}
                name="White" component={WhitePage} />
              <Tab.Screen
                options={{
                  headerShown: false
                }}
                name="Home" component={Nav} />
              <Tab.Screen
                options={{
                  headerShown: false
                }}
                name="Tickets" component={Tickets} />
              {/* <Tab.Screen
                options={{
                  headerShown: false
                }}
                name="Travels" component={Travels} /> */}
              <Tab.Screen
                options={{
                  headerShown: false
                }}
                name="Money" component={Money} />
            </Tab.Navigator>
          </NavigationContainer >
        </GlobalUserContext.Provider>
      </>
    )
  }
}
