import React from "react";
import { View, StyleSheet, Text, ScrollView, ScrollViewComponent } from "react-native";
import { color, paddingTopPage } from "../global/globalVariable";
import TicketsHeader from "../shared/Headers/ticketsHeaders";
import TicketsPreview from "../components/tickets/ticketsPreview";

export default function Tickets() {
    return (
        <ScrollView style={styles.container}>
            <TicketsHeader />
            <View style={{ alignItems: "center", paddingBottom: 100, backgroundColor: "white" }}>
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
});
