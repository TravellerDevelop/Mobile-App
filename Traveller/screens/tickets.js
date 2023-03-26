import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { color } from "../global/globalVariable";

export default function Tickets() {
    return (
        <View style={styles.container}>
            <Text>Tickets</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
    },
});
