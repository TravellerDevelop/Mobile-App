// import * as Notifications from 'expo-notifications';
// import { Platform } from 'react-native';
// import { useState, useRef } from 'react';

// const [expoPushToken, setExpoPushToken] = useState('');
// const [notification, setNotification] = useState(false);
// const notificationListener = useRef();
// const responseListener = useRef();

// Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: false,
//         shouldSetBadge: false,
//     }),
// });

// export const sendDownloadedNotification = () => {
//     registerForPushNotificationsAsync().then((token: any) => { setExpoPushToken(token) });
//     notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
//         setNotification(notification as any);
//     }) as any;
// }

// async function schedulePushNotification() {
//     await Notifications.scheduleNotificationAsync({
//         content: {
//             title: "You've got mail! 📬",
//             body: 'Here is the notification body',
//             data: { data: 'goes here' },
//         },
//         trigger: { seconds: 2 },
//     });
// }

// async function registerForPushNotificationsAsync() {
//     let token;

//     if (Platform.OS === 'android') {
//         await Notifications.setNotificationChannelAsync('default', {
//             name: 'default',
//             importance: Notifications.AndroidImportance.MAX,
//             vibrationPattern: [0, 250, 250, 250],
//             lightColor: '#FF231F7C',
//         });
//     }

//     if (true) {
//         const { status: existingStatus }: any = await Notifications.getPermissionsAsync();
//         let finalStatus = existingStatus;
//         if (existingStatus !== 'granted') {
//             const { status }: any = await Notifications.requestPermissionsAsync();
//             finalStatus = status;
//         }
//         if (finalStatus !== 'granted') {
//             console.log('Failed to get push token for push notification!');
//             return;
//         }
//         // Learn more about projectId:
//         // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
//         token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
//         console.log(token);
//     } else {
//         console.log('Must use physical device for Push Notifications');
//     }

//     return token;
// }