import React from "react";
import ContentLoader, { Rect, Circle, Path } from "react-content-loader/native"
import { color } from "../global/globalVariable";
import { StyleSheet, View } from "react-native";

export default function LoadingCard() {
    return (
        <View style={styles.container}>
            <ContentLoader
                speed={2}
                width={400}
                height={150}
                viewBox="0 0 400 150"
            >
                <Rect x="10" y="15" rx="7.5" ry="7.5" width="210" height="15" />
                <Rect x="10" y="45" rx="5" ry="5" width="190" height="10" />
            </ContentLoader>
        </View>
    )
}

let styles = StyleSheet.create({
    container: {
        backgroundColor: color.primary,
        height: 140,
        width: 250,
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

