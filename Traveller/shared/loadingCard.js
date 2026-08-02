import React from "react";
import { StyleSheet, View } from "react-native";
import { ds } from "../global/designSystem";
import SkeletonScreen from "../components/SkeletonScreen";

/* Placeholder della card viaggio nel carosello della Home (190x112) */
export default function LoadingCard() {
    return (
        <View style={styles.container}>
            <SkeletonScreen borderRadius={4} width={120} height={16} />
            <SkeletonScreen borderRadius={4} width={90} height={10} style={{ marginTop: 10 }} />
            <SkeletonScreen borderRadius={4} width={40} height={10} style={{ marginTop: 24 }} />
        </View>
    )
}

let styles = StyleSheet.create({
    container: {
        width: 190,
        height: 112,
        borderRadius: ds.radius.l,
        backgroundColor: ds.colors.scale.neutral[3],
        padding: ds.space[4],
        marginRight: ds.space[4],
    }
})
