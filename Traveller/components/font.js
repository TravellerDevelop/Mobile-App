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
    })

    return fontsLoaded;
}