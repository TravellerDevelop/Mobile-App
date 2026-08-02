import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ds } from '../global/designSystem';

export default function InteractiveCard({ navigation, updatecards }) {
    return (
        <View style={styles.container}>
            <Text style={styles.cardTitle}>Inizia un'avventura</Text>
            <Text style={styles.cardSubtitle}>
                Crea un nuovo viaggio e invita i tuoi amici con un codice.
            </Text>

            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                    navigation.navigate("NewTravel", {
                        initialTab: "create",
                        updateTravels: updatecards,
                    })
                }
            >
                <View style={styles.button}>
                    <Text style={styles.buttonText}>Crea il viaggio</Text>
                </View>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: ds.colors.brand,
        borderRadius: ds.radius.l,
        padding: ds.space[5],
        marginBottom: ds.space[7] + 2,
        overflow: "hidden",
    },
    cardTitle: {
        color: ds.colors.white,
        fontSize: 15,
        fontFamily: ds.fontFamily.bold,
        marginBottom: ds.space[2],
    },
    cardSubtitle: {
        color: ds.colors.onBrandMuted,
        fontSize: 12,
        lineHeight: 17,
        fontFamily: ds.fontFamily.regular,
        maxWidth: 220,
        marginBottom: ds.space[4] + 2,
    },
    button: {
        alignSelf: "flex-start",
        backgroundColor: ds.colors.white,
        borderRadius: ds.radius.full,
        paddingVertical: ds.space[3],
        paddingHorizontal: ds.space[4] + 2,
    },
    buttonText: {
        color: ds.colors.action,
        fontSize: 12,
        fontFamily: ds.fontFamily.semibold,
    },
})
