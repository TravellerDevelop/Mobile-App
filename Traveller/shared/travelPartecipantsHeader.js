import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../global/designSystem";
import { BrandHeader } from "../components/ui";

export default function TravelPartecipantsHeader({ navigation, route }) {
    return (
        <BrandHeader paddingTop={66} paddingBottom={34}>
            <View style={styles.row}>
                <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={20} color={ds.colors.white} />
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={2}>{route.params.name}</Text>
            </View>
            <Text style={styles.subtitle}>
                Creato il {new Date(route.params.creation_date).toLocaleDateString("it-IT")}
            </Text>
        </BrandHeader>
    )
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: ds.space[3] + 2,
    },
    title: {
        flex: 1,
        color: ds.colors.white,
        fontFamily: ds.fontFamily.bold,
        fontSize: 19,
        marginLeft: ds.space[4],
    },
    subtitle: {
        color: ds.colors.onBrandMuted,
        fontFamily: ds.fontFamily.regular,
        fontSize: 12,
        marginLeft: 32,
    },
})
