import React from "react";
import { View, StyleSheet, ActivityIndicator, Image, Dimensions } from "react-native";

export default function Loading() {
    return (
        <View style={styles.container}>
            <Image source={require("../assets/splash.png")} style={styles.img} />
            <ActivityIndicator size="large" style={styles.activity} color="#FFF" />
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
    img: {
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
    },
    activity: {
        position: "absolute",
        bottom: 80,
    }
});