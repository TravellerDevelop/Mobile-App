import { useFonts } from 'expo-font'

export default function Font() {
    let [fontsLoaded] = useFonts({
        'montserrat-regular': require('../assets/fonts/Montserrat-Regular.ttf'),
        'montserrat-bold': require('../assets/fonts/Montserrat-Bold.ttf'),
        'montserrat-thin': require('../assets/fonts/Montserrat-Thin.ttf'),
        'montserrat-light': require('../assets/fonts/Montserrat-Light.ttf'),
    })

    return fontsLoaded;
}