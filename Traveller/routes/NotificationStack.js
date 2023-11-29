import React from 'react'
import { NavigationContainer, Drawer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import Home from '../screens/home'
import Notifications from '../screens/notifications'
import { font } from '../global/globalVariable'
import TravelDetail from '../screens/travelDetail'
import TravelPartecipants from '../screens/travelPartecipants'
import MyProfile from '../screens/profile'
import PaymentInfo from '../screens/paymentsInfo'
import OtherProfile from '../screens/otherProfile'
import NewPost from '../screens/Modals/NewPost'
import TicketModal from '../screens/Modals/ticketModal'
import Tickets from '../screens/tickets'
import EditTravel from '../screens/Modals/edittravel'

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
            headerTitle: '',
            title: ''
          }}
        />

        <Stack.Screen name='OtherProfile' component={OtherProfile}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='TravelPartecipants' component={TravelPartecipants}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='Profile' component={MyProfile}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='PaymentInfo' component={PaymentInfo} 
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='NewPost' component={NewPost} 
          options={{
            headerTitle: 'Nuovo Post',
          }}
        />

        <Stack.Screen name='EditTravel' component={EditTravel}
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