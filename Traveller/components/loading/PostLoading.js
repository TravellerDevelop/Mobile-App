import React from "react";
import { View, StyleSheet } from "react-native";
import SkeletonScreen from "../SkeletonScreen";
import { ds } from "../../global/designSystem";
import { FeedGroup } from "../ui";

/* Placeholder di una riga del feed — stessa struttura raggruppata di
   PostCard.tsx (niente bordo/radius propri, solo un separatore in basso;
   il "boxing" lo dà il FeedGroup che le contiene). */
function PostSkeleton({ tall, last }) {
    return (
        <View style={[styles.row, last && styles.rowLast]}>
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
        <FeedGroup>
            <PostSkeleton />
            <PostSkeleton tall />
            <PostSkeleton last />
        </FeedGroup>
    )
}

const styles = StyleSheet.create({
    row: {
        backgroundColor: ds.colors.surface,
        paddingVertical: ds.space[4] + 1,
        paddingHorizontal: ds.space[4] + 2,
        borderBottomWidth: 1,
        borderBottomColor: ds.colors.borderSubtle,
    },
    rowLast: {
        borderBottomWidth: 0,
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
