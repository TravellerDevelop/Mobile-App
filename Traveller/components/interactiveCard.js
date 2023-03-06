import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, font } from '../global/globalVariable';

export default function InteractiveCard() {
    return (
        <View style={styles.container}>
            <LinearGradient
                start={{ x: 0.4, y: 0.3 }}
                colors={[color.primary, color.secondary]}
                style={styles.gradient}
            >
                <Text style={styles.cardTitle}>Iniziamo un' avventura! ✈️</Text>
                <Text style={styles.cardSubtitle}>Potremmo cercare un tesoro o esplorare il Far West! 💪💪</Text>
                <View style={styles.button}>
                    <TouchableOpacity onPress={() => alert("New Travel")}>
                        <Text style={styles.buttonText}>Crea il viaggio!</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "transparent",
        height: 140,
        width: "90%",
        borderRadius: 10,
        marginTop: 30,
        marginBottom: 30,
        marginLeft: "5%",
    },
    cardTitle: {
        color: "white",
        fontSize: 19,
        textAlign: "left",
        fontFamily: font.montserrat,
    },
    cardSubtitle: {
        color: "white",
        marginTop: 10,
        fontSize: 15,
        textAlign: "left",
        fontFamily: font.montserratLight,
    },
    button: {
        position: "absolute",
        bottom: 0,
        left: 10,
        width: "100%",
        height: 40,
        textAlign: "center",
    },
    buttonText: {
        color: "white",
        textAlign: "center",
        fontSize: 15,
        fontFamily: font.montserratBold,
        lineHeight: 40,
        width: "100%",
    },
    gradient: {
        height: "100%",
        width: "100%",
        borderRadius: 10,
        paddingRight: 10,
        paddingTop: 15,
        paddingLeft: 15,
    }
})