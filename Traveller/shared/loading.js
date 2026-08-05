import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../global/designSystem";

// Schermata mostrata mentre si attendono i font (Poppins/Inter) e/o la verifica
// della sessione salvata (AuthProvider): niente Poppins qui, verrebbe mostrato
// per un istante col font di sistema prima che i font custom siano pronti.
// Sfondo e simbolo coerenti col resto del redesign PierTour (viola brand,
// stessa icona usata nello splash nativo).
export default function Loading() {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.85);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
        scale.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    }, []);

    const markStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.mark, markStyle]}>
                <MaterialCommunityIcons name="airplane-takeoff" size={56} color={ds.colors.white} />
                <Text style={styles.wordmark}>Traveller</Text>
            </Animated.View>
            <ActivityIndicator size="large" color={ds.colors.white} style={styles.activity} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ds.colors.brand,
        alignItems: "center",
        justifyContent: "center",
    },
    mark: {
        alignItems: "center",
    },
    wordmark: {
        marginTop: ds.space[5],
        fontSize: ds.fontSize[26],
        fontWeight: "700",
        letterSpacing: 0.2,
        color: ds.colors.white,
    },
    activity: {
        position: "absolute",
        bottom: 80,
    },
});
