import React from "react";
import ContentLoader, { Rect, Circle, Path } from "react-content-loader/native"
import { color } from "../global/globalVariable";
import { StyleSheet, View, Dimensions } from "react-native";

export default function LoadingPost() {
    return (
        <View style={styles.container}>
            <ContentLoader
                speed={2}
                width={Dimensions.get("window").width - 20}
                height={120}
                viewBox="0 0 400 150"
            >
                <Circle cx="30" cy="30" r="30" />
                <Rect x="80" y="10" rx="7.5" ry="7.5" width="210" height="15" />
                <Rect x="80" y="40" rx="5" ry="5" width="190" height="10" />
                <Rect x="10" y="70" rx="7.5" ry="7.5" width="290" height="15" />
                <Rect x="10" y="100" rx="7.5" ry="7.5" width="290" height="15" />
            </ContentLoader>
        </View>
    )
}

let styles = StyleSheet.create({
    container: {
        minWidth: 250,
        backgroundColor: "#FFF",
        borderRadius: 10,
        margin: 10,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 1,
            height: 3,
        },
        shadowOpacity: 0.5,
        shadowRadius: 3.84,
        elevation: 5,
    }
})

