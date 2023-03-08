import React from 'react'
import { NavigationContainer } from '@react-navigation/native' 
import { createStackNavigator } from '@react-navigation/stack'
import Home from '../screens/home'
import Notifications from '../screens/notifications'
import { font } from '../global/globalVariable'

const Stack = createStackNavigator()

export default function Navigator() {
  return (
    <NavigationContainer>
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
              fontFamily : font.montserrat
            }
        }}
      />

      </Stack.Navigator>
    </NavigationContainer>
  );
}