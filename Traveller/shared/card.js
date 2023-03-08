import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TouchableNativeFeedback } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function Card(data) {
    return (
        <TouchableNativeFeedback>
            <View style={styles.container}>
                <View style={{position: 'absolute', bottom: 10, left: 10}}>
                    <Text style={styles.cardTitle}>{data.data.key}</Text>
                    <Text style={styles.cardSubtitle}>Creato il 10/02/2023</Text>
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
    }
});
