import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { ds } from "../../global/designSystem";

/* Placeholder della card biglietto (stesse proporzioni di TicketsPreview) */
export default function TicketsLoading() {
    const opacity = useRef(new Animated.Value(0.3));

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity.current, {
                    toValue: 2,
                    useNativeDriver: true,
                    duration: 1000,
                }),
                Animated.timing(opacity.current, {
                    toValue: 0.3,
                    useNativeDriver: true,
                    duration: 500,
                })
            ])
        ).start();
    }, [opacity]);

    return (
        <View style={{ position: 'relative' }}>
            <View style={styles.leftCircle}></View>
            <View style={styles.rightCircle}></View>
            <Animated.View style={[{ opacity: opacity.current }, styles.skeleton]} />
        </View>
    )
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: ds.colors.scale.neutral[3],
        marginBottom: ds.space[4] + 2,
        height: 150,
        width: "100%",
        borderRadius: ds.radius.l,
    },
    leftCircle: {
        position: "absolute",
        top: 66,
        backgroundColor: ds.colors.surface,
        height: 26,
        width: 26,
        borderRadius: ds.radius.full,
        left: -13,
        zIndex: 100
    },
    rightCircle: {
        position: "absolute",
        top: 66,
        backgroundColor: ds.colors.surface,
        height: 26,
        width: 26,
        borderRadius: ds.radius.full,
        right: -13,
        zIndex: 100
    }
})
