import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function SkeletonScreen({ width, height, borderRadius, style })
{
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
        <Animated.View
            style={[{opacity: opacity.current, height, width, borderRadius : borderRadius}, styles.skeleton, style]}
        />
    )
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#efefef',
    }
})