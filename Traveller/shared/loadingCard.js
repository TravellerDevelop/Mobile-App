import React from "react";
// import ContentLoader, { Rect, Circle, Path } from "react-content-loader/native"
import { color } from "../global/globalVariable";
import { StyleSheet, View } from "react-native";
import SkeletonScreen from "../components/SkeletonScreen";

export default function LoadingCard() {
    return (
        <View style={styles.container}>
                <SkeletonScreen borderRadius={12.5} width={190} height={20} style={{marginTop: 5}} />
                <SkeletonScreen borderRadius={7.5} width={150} height={10} style={{marginTop: 15}} />
        </View>
    )
}

let styles = StyleSheet.create({
    container: {
        backgroundColor: color.primary,
        height: 120,
        width: 270,
        borderRadius: 10,
        margin: 10,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
    }
})

