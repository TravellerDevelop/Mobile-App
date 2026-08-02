import { useFonts } from 'expo-font'

export default function Font() {
    let [fontsLoaded] = useFonts({
        'montserrat-regular': require('../assets/fonts/Montserrat-Regular.ttf'),
        'montserrat-bold': require('../assets/fonts/Montserrat-Bold.ttf'),
        'montserrat-thin': require('../assets/fonts/Montserrat-Thin.ttf'),
        'montserrat-light': require('../assets/fonts/Montserrat-Light.ttf'),
        'rubik-regular': require('../assets/fonts/Rubik-Regular.ttf'),
        'rubik-bold': require('../assets/fonts/Rubik-Bold.ttf'),
        'rubik-light': require('../assets/fonts/Rubik-Light.ttf'),
        'rubik-black': require('../assets/fonts/Rubik-Black.ttf'),
        // Design system PierTour — Poppins (UI) + Inter (numeri e meta)
        'poppins-regular': require('../assets/fonts/Poppins-Regular.ttf'),
        'poppins-medium': require('../assets/fonts/Poppins-Medium.ttf'),
        'poppins-semibold': require('../assets/fonts/Poppins-SemiBold.ttf'),
        'poppins-bold': require('../assets/fonts/Poppins-Bold.ttf'),
        'inter-regular': require('../assets/fonts/Inter-Regular.ttf'),
        'inter-medium': require('../assets/fonts/Inter-Medium.ttf'),
        'inter-semibold': require('../assets/fonts/Inter-SemiBold.ttf'),
        'inter-bold': require('../assets/fonts/Inter-Bold.ttf'),
    })

    return fontsLoaded;
}