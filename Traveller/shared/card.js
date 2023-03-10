import React from "react";
import { View, Text, StyleSheet, TouchableNativeFeedback } from "react-native";
import { Avatar } from "@react-native-material/core";
import { color } from "../global/globalVariable";

export default function Card({ navigation, data }) {
    return (
        <TouchableNativeFeedback onPress={() => navigation.navigate("TravelDetail", data)}>
            <View style={styles.container}>
                <View style={{ position: 'absolute', top: 10, left: 10 }}>
                    <Text style={styles.cardTitle}>{data.key}</Text>
                    <Text style={styles.cardSubtitle}>Creato il 10/02/2023</Text>
                </View>
                <View style={{ flexDirection: "row", position: "absolute", right: 25, bottom: 10 }}>
                    <View style={styles.avatarContainer}>
                        <Avatar label={"Marco Montemagno"} autoColor size={30}/>
                    </View>
                    <View style={styles.avatarContainer}>
                        <Avatar label={"Andrea Abbate"} autoColor size={30}/>
                    </View>
                    <View style={styles.avatarContainer}>
                        <Avatar label={"Testa di cazzo"} autoColor size={30}/>
                    </View>
                    <View style={styles.avatarContainer}>
                        <Avatar label={"+ 4"} size={30}/>
                    </View>
                </View>
            </View>
        </TouchableNativeFeedback>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#4960FF",
        height: 140,
        width: 250,
        borderRadius: 10,
        margin: 10,
        padding: 10,
    },
    cardTitle: {
        color: "white",
        fontSize: 30,
        textAlign: "left",
        fontFamily: "montserrat-regular",
    },
    cardSubtitle: {
        color: "white",
        fontSize: 18,
        textAlign: "left",
        fontFamily: "montserrat-light",
    },
    avatarContainer: {
        backgroundColor: "white",
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        height: 35,
        width: 35,
        marginRight: -15,
    }
});