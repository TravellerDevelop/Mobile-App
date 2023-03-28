import React from "react";
import { View, StyleSheet, Text, ScrollView, ScrollViewComponent } from "react-native";
import { color, paddingTopPage, font } from "../global/globalVariable";
import TicketsHeader from "../shared/Headers/ticketsHeaders";
import TicketsPreview from "../components/tickets/ticketsPreview";
import { TextInput } from "@react-native-material/core";

export default function Tickets() {
    return (
        <ScrollView style={styles.container}>
            <TicketsHeader />
            <View style={{ alignItems: "center", paddingBottom: 100, backgroundColor: "white" }}>
                <TextInput label="Cerca biglietto" variant="standard" style={styles.input}
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
        backgroundColor: "#FFF",
        width: "90%",
        fontFamily: font.montserrat,
        height: 40,
        borderRadius: 10,
        marginTop: 20,
        marginBottom: 20,
    }
});
