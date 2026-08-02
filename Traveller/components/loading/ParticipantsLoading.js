import React from "react";
import { View, StyleSheet } from "react-native";
import SkeletonScreen from "../SkeletonScreen";
import { ds } from "../../global/designSystem";

/* Placeholder delle righe partecipante (allineato a travelPartecipants) */
export default function ParticipantsLoading() {
    return (
        <>
            {[0, 1, 2].map((i) => (
                <View key={i} style={styles.row}>
                    <SkeletonScreen width={40} height={40} borderRadius={999} />
                    <View style={styles.text}>
                        <SkeletonScreen width={140} height={14} borderRadius={4} />
                        <SkeletonScreen width={80} height={10} borderRadius={4} style={{ marginTop: 6 }} />
                    </View>
                </View>
            ))}
        </>
    )
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: ds.radius.l,
        backgroundColor: ds.colors.surface,
        paddingVertical: ds.space[4],
        paddingHorizontal: ds.space[4],
        marginBottom: ds.space[3] + 2,
        ...ds.shadow.md,
    },
    text: {
        flex: 1,
        marginLeft: ds.space[3] + 2,
    },
})
