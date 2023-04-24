import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import Home from '../screens/home'
import Notifications from '../screens/notifications'
import { font } from '../global/globalVariable'
import TravelDetail from '../screens/travelDetail'
import TravelPartecipants from '../screens/travelPartecipants'
import Profile from '../screens/profile'

const Stack = createStackNavigator()

export default function Navigator() {
  return (
    <NavigationContainer
      independent={true}
    >
      <Stack.Navigator initialRouteName='Home' >
        <Stack.Screen name='Home' component={Home}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='Notifications' component={Notifications}
          options={{
            title: 'Notifiche',
            headerTitleStyle: {
              fontFamily: font.montserrat
            }
          }}
        />

        <Stack.Screen name='TravelDetail' component={TravelDetail}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='TravelPartecipants' component={TravelPartecipants}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='Profile' component={Profile}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}