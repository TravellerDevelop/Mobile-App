import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

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
        backgroundColor: '#efefef',
        marginTop: 10,
        marginBottom: 10,
        height: 175,
        width: 300,
        borderRadius: 15
    },
    leftCircle: {
        position: "absolute",
        top: 82.5,
        backgroundColor: "#fff",
        height: 30,
        width: 30,
        borderRadius: 30,
        left: -15,
        zIndex: 100
    },
    rightCircle: {
        position: "absolute",
        top: 82.5,
        backgroundColor: "#fff",
        height: 30,
        width: 30,
        borderRadius: 30,
        right: -15,
        zIndex: 100
    }
})