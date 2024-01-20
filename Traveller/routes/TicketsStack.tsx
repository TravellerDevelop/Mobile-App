import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import TicketModal from '../screens/Modals/ticketModal'
import Tickets from '../screens/tickets'

const Stack = createStackNavigator()

const TicketsNavigator = () => {
  return (
    <NavigationContainer
      independent={true}
    >
      <Stack.Navigator initialRouteName='Tickets' >
        <Stack.Screen name='Tickets' component={Tickets}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name='TicketsModal' component={TicketModal}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default TicketsNavigator;