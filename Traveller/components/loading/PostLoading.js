import React from "react";
import { View, StyleSheet } from "react-native";
import SkeletonScreen from "../SkeletonScreen";
import { ds } from "../../global/designSystem";

/* Placeholder delle card post (stessa struttura di PostCard) */
function PostSkeleton({ tall }) {
    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <SkeletonScreen width={26} height={26} borderRadius={999} />
                <View style={styles.headerText}>
                    <SkeletonScreen width={90} height={12} borderRadius={4} />
                    <SkeletonScreen width={130} height={9} borderRadius={4} style={{ marginTop: 5 }} />
                </View>
            </View>
            <SkeletonScreen width={"100%"} height={tall ? 120 : 14} borderRadius={4} />
            {!tall && (
                <>
                    <SkeletonScreen width={"90%"} height={14} borderRadius={4} style={{ marginTop: 6 }} />
                    <SkeletonScreen width={"60%"} height={14} borderRadius={4} style={{ marginTop: 6 }} />
                </>
            )}
        </View>
    );
}

export default function PostLoading() {
    return (
        <>
            <PostSkeleton />
            <PostSkeleton tall />
            <PostSkeleton />
        </>
    )
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderColor: ds.colors.borderSubtle,
        borderRadius: ds.radius.l,
        backgroundColor: ds.colors.surface,
        padding: ds.space[5] - 2,
        marginBottom: ds.space[4],
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: ds.space[3] + 2,
    },
    headerText: {
        flex: 1,
        marginLeft: ds.space[3],
    },
});
