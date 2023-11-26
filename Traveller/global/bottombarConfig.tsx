import { Platform } from "react-native";
import { font } from "./globalVariable";

export const iconConfig = {
    Home: require('../assets/image/icona-home.png'),
    Settings: require('../assets/image/icona-user.png'),
    Tickets: require('../assets/image/icona-biglietto-1.png'),
    Travels: require('../assets/image/airplane.png'),
    Money: require('../assets/image/icona-wallet.png'),
};

export const tabBarStyle = {
    flexDirection: 'row',
    padding: 0,
    height: 55,
    width: '85%',
    left: '7.5%',
    position: 'absolute',
    bottom: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: 'white',
    shadowColor: '#000000FF',
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 3,
};

export const textInputStyle = {
    fontFamily: 'montserrat-regular',
    fontSize: 12,
    color: 'black',
    textAlign: 'center',
    marginTop: 5,
    position: 'absolute',
    left: 75,
};

export const focusedIconContainerStyle = {
    height: 40,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 5,
    position: (Platform.OS === 'ios') ? 'absolute' : 'relative',
    top: -1.5,
};

export const focusedTextStyle = {
    color: 'black',
    fontSize: 11,
    fontFamily: font.text_bold,
    textAlign: 'center',
    marginRight: 10,
};

export const bottomBarImage = {
    width: 40,
    height: 30,
    marginRight: 5,
    resizeMode: "contain",
}

export const bottomBarImageFocus = {
    position: Platform.OS === 'ios' ? "absolute" : 'relative',
    top: Platform.OS === 'ios' ? -1.5 : -0,
}