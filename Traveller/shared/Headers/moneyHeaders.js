import React from "react";
import { StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";

export default function MoneyHeader() {
    return (
        <LinearGradient
            colors={[ds.colors.brand, ds.colors.action]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
        >
            <MaterialCommunityIcons
                name="wallet"
                size={130}
                color="rgba(255,255,255,0.07)"
                style={styles.headerDecor}
            />
            <Text style={styles.title}>Money</Text>
            <Text style={styles.paragraph}>
                Tieni sotto controllo entrate e uscite di tutti i tuoi viaggi.
            </Text>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    header: {
        paddingTop: ds.layout.headerPaddingTop,
        paddingHorizontal: ds.layout.headerPaddingH,
        paddingBottom: ds.space[7],
        position: "relative",
        overflow: "hidden",
    },
    headerDecor: {
        position: "absolute",
        right: -16,
        top: 10,
        transform: [{ rotate: "10deg" }],
    },
    title: {
        fontFamily: ds.fontFamily.bold,
        fontSize: 22,
        color: ds.colors.white,
        marginBottom: ds.space[2],
    },
    paragraph: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 12,
        lineHeight: 17,
        color: ds.colors.onBrandMuted,
        maxWidth: 280,
    },
});
