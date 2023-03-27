import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { color, font } from "../../global/globalVariable.js";
import { LinearGradient } from "expo-linear-gradient";
import { Badge } from "@react-native-material/core";

export default function TicketsHeader() {
    return (
        <LinearGradient
            style={styles.container}
            start={{ x: 0.5, y: 0.2 }}
            colors={[color.primary, color.secondary]}
        >
            <Text style={{ fontFamily: font.montserratBold, fontSize: 25, color: "white", marginLeft: 20 }}>Tickets</Text>
            <Text style={styles.paragraph}>Aggiungi tutti i tuoi biglietti per averceli sempre dietro! (Anche disponibili offline!) 🎫 🎟️</Text>
            <TouchableOpacity  style={[styles.add, {height: 30}]}>
                <Badge label={"+ Aggiungi biglietto"} color="#FFF" labelStyle={styles.label} />
            </TouchableOpacity>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: color.primary,
        width: "100%",
        height: 130,
    },
    add: {
        position: "absolute",
        left: 20,
        top: 90,
        height: 25,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    label: {
        marginLeft: 10,
        marginRight: 10,
        fontFamily: font.montserrat,
        fontSize: 12,
        color: "#000",
    },
    paragraph: {
        fontFamily: font.montserrat,
        fontSize: 12,
        color: "#FFF",
        marginLeft: 20,
        marginRight: 20,
        marginTop: 10,
    },

});