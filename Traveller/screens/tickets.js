import React from "react";
import { View, StyleSheet, Text, ScrollView, TextInput } from "react-native";
import { color, paddingTopPage, font } from "../global/globalVariable";
import TicketsHeader from "../shared/Headers/ticketsHeaders";
import TicketsPreview from "../components/tickets/ticketsPreview";

export default function Tickets() {
    return (
        <ScrollView style={styles.container}>
            <TicketsHeader />
            <View style={{ alignItems: "center", paddingBottom: 100, backgroundColor: "white" }}>
                <TextInput placeholder="Cerca biglietto" style={styles.input}
                    inputStyle={{ fontFamily: font.montserrat }}
                />
                <TicketsPreview company="Ryanair" />
                <TicketsPreview company="Ryanair" />
                <TicketsPreview company="EasyJet" />
                <TicketsPreview company="Ryanair" />
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingTop: paddingTopPage,
        backgroundColor: color.primary,
    },
    input: {
        width: 300,
        marginTop: 20,
        fontFamily: font.montserrat,
        width: "85%",
        height: 40,
        backgroundColor: "#F5F5F5",
        borderRadius: 10,
        paddingLeft: 10,
        paddingRight: 10,
    },
});
