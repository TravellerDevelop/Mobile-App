import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { ProgressBar } from "react-native-paper";
import { color, font } from "../../global/globalVariable";

export default function BudgetIndicator({ budget, spent }) {

    let percent = 0;

    if (spent < budget)
        percent = spent / budget;
    else
        percent = 1;

    return (
        <View style={styles.card}>
            <Text style={{ color: "#000", fontSize: 16, textAlign: "left", fontFamily: font.text_bold, marginBottom: 10 }}>Budget:</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#000", fontSize: 16, textAlign: "left", fontFamily: font.text }}>{spent}€</Text>
                <ProgressBar progress={percent} color={(spent < budget) ? "green" : "red"} style={{ height: 10, borderRadius: 10, minWidth: "60%" }} />
                <Text style={{ color: "#000", fontSize: 16, textAlign: "left", fontFamily: font.text }}>{budget}€</Text>
            </View>
            <Text style={{ color: "#000", fontSize: 16, textAlign: "center", fontFamily: font.text, margin: 10 }}>{(spent < budget) ? "Hai ancora " + (budget - spent) + "€ a disposizione!" : "Hai sforato il budget di " + (spent - budget) + "€ 😥"}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFF",
        borderRadius: 10,
        margin: 10,
        marginTop: 20,
        marginBottom: 0,
        padding: 10,
        elevation: 5,
    },
});
