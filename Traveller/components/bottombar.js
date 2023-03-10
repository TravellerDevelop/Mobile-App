import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { color } from "../global/globalVariable";

export default function BottomBar() {
    return (
        <View style={styles.container}>
            <TouchableOpacity>
                <View style={styles.containerActive}>
                    <Image style={styles.imageActive} source={require("../assets/image/icona-home.png")} />
                </View>
            </TouchableOpacity>
            <TouchableOpacity>
                <View style={styles.containerInactive}>
                    <Image style={styles.image} source={require("../assets/image/icona-biglietto-1.png")} />
                </View>
            </TouchableOpacity>
            <TouchableOpacity>
                <View style={styles.containerInactive}>
                    <Image style={styles.image} source={require("../assets/image/airplane.png")} />
                </View>
            </TouchableOpacity>
            <TouchableOpacity>
                <View style={styles.containerInactive}>
                    <Image style={styles.image} source={require("../assets/image/icona-user.png")} />
                </View>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        height: 55,
        width: "85%",
        left: "7.5%",
        position: "absolute",
        bottom: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "space-evenly",
        backgroundColor: "white",
        shadowColor: "#000000FF",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 3,
    },
    image: {
        width: 30,
        height: 30,
    },
    imageActive: {
        width: 30,
        height: 30,
        tintColor: "white",
    },
    containerActive: {
        backgroundColor: color.secondary,
        width: 45,
        height: 45,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
    },
    containerInactive: {
        backgroundColor: "white",
        width: 45,
        height: 45,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
    }
});
