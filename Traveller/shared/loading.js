import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

export default function Loading() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>TRAVELLER</Text>
            <ActivityIndicator size="large" color="#FFF" />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#4960FF",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        color: "white",
        fontSize: 30,
        textAlign: "center",
        marginBottom: 20,
    }
});