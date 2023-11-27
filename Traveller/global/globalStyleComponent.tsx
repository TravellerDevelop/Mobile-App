import { Dimensions } from "react-native"

export const globalStyleComponent = {
    input: {
        backgroundColor: "white",
        marginTop: 20,
        width: Dimensions.get('screen').width - 40,
        height: 50,
        marginBottom: 10,
        borderRadius: 25,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        borderWidth: 1,
        borderColor: 'lightgray'
    }
}