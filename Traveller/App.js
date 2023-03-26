import React from 'react';
import Font from './components/font';
import Navigator from './routes/NotificationStack';
import { Image } from 'react-native';
import Loading from './shared/loading';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from './screens/home';
import Nav from './screens/nav';
import Tickets from './screens/tickets';
import Travels from './screens/travels';

export default function App() {
  let fontLoaded = Font();

  if (!fontLoaded) {
    return (
      <Loading />
    )
  } else {
    const Tab = createBottomTabNavigator();

    return (
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Home"
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

              return <Image style={{ width: 30, height: 30, tintColor: color }} source={iconName} />;
            }
          })}
        >
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
            name="Settings" component={Loading} />
        </Tab.Navigator>
      </NavigationContainer>
    )
  }
}
