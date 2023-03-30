import React, { useState } from "react";
import { View, StyleSheet, Text, Image, TouchableNativeFeedback } from "react-native";
import { font } from "../../global/globalVariable";
import TicketModal from "../../screens/Modals/ticketModal";

let companies = {
    "Ryanair": "#2B4779",
    "EasyJet": "#FF561F",
}

let col = "#FFF"
let img;

export default function TicketsPreview({ company }) {
    if (company === "Ryanair") {
        col = companies.Ryanair;
        img = require("../../assets/image/airlines/ryanair.png");
    } else if (company === "EasyJet") {
        col = companies.EasyJet;
        img = require("../../assets/image/airlines/EasyJet.png");
    }

    let [modalVisibility, setModalVisibility] = useState(false);

    return (
        <>
            <TicketModal visibility={modalVisibility} data={company} setVisibility={setModalVisibility} />

            <TouchableNativeFeedback onPress={() => setModalVisibility(true)} >
                <View style={[styles.container, { backgroundColor: col }]} >
                    <View style={styles.left}></View>
                    <Image source={img} style={{ height: 30, width: 30, position: "absolute", top: 20, right: 20 }} resizeMode="contain" />
                    <Text style={styles.name}>BOSSOLASCO PIETRO</Text>
                    <Text style={styles.nrFlight}>Numero di volo: FR0464</Text>
                    <Text style={styles.destination}>From STN to TRN</Text>
                    <Text style={styles.date}>12-03-2024 12:32</Text>
                    <View style={styles.right}></View>
                </View>
            </TouchableNativeFeedback>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: col,
        height: 175,
        width: 300,
        borderRadius: 15,
        marginTop: 20,
        marginBottom: 20,
    },
    left: {
        position: "absolute",
        top: 72.5,
        backgroundColor: "#fff",
        height: 30,
        width: 30,
        borderRadius: 30,
        left: -15,
    },
    right: {
        position: "absolute",
        top: 72.5,
        backgroundColor: "#fff",
        height: 30,
        width: 30,
        borderRadius: 30,
        right: -15,
    },
    name: {
        position: "absolute",
        top: 20,
        left: 20,
        color: "#fff",
        fontSize: 18,
        fontFamily: font.montserrat
    },
    nrFlight: {
        position: "absolute",
        top: 45,
        left: 20,
        color: "#fff",
        fontSize: 13,
        fontFamily: font.montserratLight
    },
    destination: {
        position: "absolute",
        bottom: 20,
        left: 20,
        color: "#fff",
        fontSize: 15,
        fontFamily: font.montserrat
    },
    date: {
        position: "absolute",
        bottom: 20,
        right: 20,
        color: "#fff",
        fontSize: 13,
        fontFamily: font.montserratLight
    }
});