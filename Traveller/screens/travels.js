import React from "react";
import { View, StyleSheet, Text, TextInput } from "react-native";
import { color } from "../global/globalVariable";

export default function Travels() {
    return (
        <View style={styles.container}>
            <TextInput placeholder="Cerca un viaggio, una persona ..." style={styles.input} />
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
