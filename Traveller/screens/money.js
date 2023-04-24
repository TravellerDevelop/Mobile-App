import React, {useContext, useEffect} from "react";
import { StyleSheet, View, Text } from "react-native";
import { font } from "../global/globalVariable";
import { GlobalStateProvider } from "../global/globalStates";

export default function Money() {
    let [userData, setUserData] = useContext(GlobalStateProvider);

    useEffect(() => {
        console.log(userData)
    }, [])

    return (
        <>
            <View style={styles.container}>
                <View style={styles.row}>
                    <Text style={styles.title}>Ies</Text>
                </View>
            </View>
        </>
    )
}

let styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        flex: 1,
        paddingTop: 20,
        paddingLeft: 10,
        paddingBottom: 20,
        paddingRight: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    title: {
        color: "white",
        fontFamily: font.montserrat,
        fontSize: 25,
        marginLeft: 10
    },
});