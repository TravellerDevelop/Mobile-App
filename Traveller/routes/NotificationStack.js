import React from 'react'
import { NavigationContainer, Drawer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import Home from '../screens/home'
import Notifications from '../screens/notifications'
import TravelDetail from '../screens/travelDetail'
import TravelPartecipants from '../screens/travelPartecipants'
import MyProfile from '../screens/profile'
import PaymentInfo from '../screens/paymentsInfo'
import OtherProfile from '../screens/otherProfile'
import NewPost from '../screens/Modals/NewPost'
import TicketModal from '../screens/Modals/ticketModal'
import Tickets from '../screens/tickets'
import Travels from '../screens/travels'
import NewTravel from '../screens/Modals/NewTravel'
import EditTravel from '../screens/Modals/edittravel'
import Itinerary from '../screens/Itinerary'
import ItineraryStopDetail from '../screens/ItineraryStopDetail'
import ItineraryToday from '../screens/ItineraryToday'
import ItineraryRecap from '../screens/ItineraryRecap'
import ItineraryPermissions from '../screens/Modals/ItineraryPermissions'

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
            headerShown: false,
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

        <Stack.Screen name='Travels' component={Travels}
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
            headerShown: false,
            presentation: 'modal',
          }}
        />

        <Stack.Screen name='NewTravel' component={NewTravel}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />

        <Stack.Screen name='EditTravel' component={EditTravel}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='Itinerary' component={Itinerary}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='ItineraryStopDetail' component={ItineraryStopDetail}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='ItineraryToday' component={ItineraryToday}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='ItineraryRecap' component={ItineraryRecap}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name='ItineraryPermissions' component={ItineraryPermissions}
          options={{
            headerShown: false,
            presentation: 'modal',
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