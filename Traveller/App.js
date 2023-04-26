import React, { useEffect, useState } from 'react';
import Font from './components/font';
import { Image, View, Text } from 'react-native';
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

export default function App() {
  let fontLoaded = Font();
  let [modalVisible, setModalVisible] = useState(false);
  let [connection, setConnection] = useState(false);

  getStringDataWithStateReverse('initialModal', modalVisible, setModalVisible);

  useEffect(() => {
    axios({
      method: 'get',
      url: serverLink + "api/verifyConnection",
      timeout: 20000,
    })
      .then((response) => {
        if (response.status == 200)
          setConnection(true);
        else
          setConnection('error')
      })
      .catch((error) => {
        setConnection('error');
      });
  }, []);

  if (!fontLoaded || !connection) {
    return (
      <Loading />
    )
  }
  else if (connection == 'error') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Image style={{ width: 50, height: 50, marginBottom: 20 }} source={require('./assets/image/icona-alert.png')} />
        <Text style={{ fontSize: 20, fontWeight: 'bold', fontFamily: "montserrat-regular" }}>Errore di connessione al server : /</Text>
      </View>
    )
  }
  else if (fontLoaded && connection) {
    const Tab = createBottomTabNavigator();

    return (
      <>
        <InitialModal visibility={modalVisible} setVisibility={setModalVisible} />
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="White"
            screenOptions={({ route }) => ({
              tabBarShowLabel: false,
              activeTintColor: '#e91e63',
              tabBarStyle: {
                flexDirection: "row",
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


                if (route.name != 'White')
                  return <Image style={{ width: 30, height: 30, tintColor: color, marginLeft: 20, marginRight: 20 }} source={iconName} />;
              }
            })}
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
            <Tab.Screen
              options={{
                headerShown: false
              }}
              name="Travels" component={Travels} />
            <Tab.Screen
              options={{
                headerShown: false
              }}
              name="Money" component={Money} />
          </Tab.Navigator>
        </NavigationContainer>
      </>
    )
  }
}
