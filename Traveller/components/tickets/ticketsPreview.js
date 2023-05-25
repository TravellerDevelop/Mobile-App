import React, { useState } from "react";
import { View, StyleSheet, Text, Image, TouchableNativeFeedback } from "react-native";
import { font } from "../../global/globalVariable";
import TicketModal from "../../screens/Modals/ticketModal";

let companies = {
    "Ryanair": "#2B4779",
    "EasyJet": "#FF561F",
    "Alitalia": "#009FE3",
    "Ita": "#009FE3",
    "Vueling": "#F5B912",
    "KLM": "#00A1DE",
}

let col = "#FFF"
let img;

export default function TicketsPreview({ item, takeInfo }) {
    let company = "Ciao";

    if (item.company.name === "Ryanair") {
        col = companies.Ryanair;
        img = require("../../assets/image/airlines/ryanair.png");
    } else if (item.company.name === "EasyJet") {
        col = companies.EasyJet;
        img = require("../../assets/image/airlines/EasyJet.png");
    } else if (item.company.name === "Alitalia" || item.company.name === "Ita") {
        col = companies.Alitalia;
        img = require("../../assets/image/airlines/ita.png");
    } else if (item.company.name === "Vueling") {
        col = companies.Vueling;
        img = require("../../assets/image/airlines/vueling.png");
    } else if (item.company.name === "KLM") {
        col = companies.KLM;
        img = require("../../assets/image/airlines/klm.png");
    }

    let [modalVisibility, setModalVisibility] = useState(false);

    return (
        <>
            <TicketModal visibility={modalVisibility} data={item} setVisibility={setModalVisibility} takeInfo={takeInfo} />

            <TouchableNativeFeedback onPress={() => setModalVisibility(true)} >
                <View style={[styles.container, { backgroundColor: col }]} >
                    <View style={styles.left}></View>
                    <Image source={img} style={{ height: 30, width: 30, position: "absolute", top: 20, right: 20 }} resizeMode="contain" />
                    <Text style={styles.name}>{item.surname} {item.name}</Text>
                    {
                        (item.sharedBy) ?
                            <Text style={styles.sharedBy}>Condiviso da {item.sharedBy}</Text>
                            :
                            <></>
                    }
                    <Text style={styles.nrFlight}>Numero di volo: {item.flightNumber}</Text>
                    <Text style={styles.destination}>From {item.from.iata} to {item.to.iata}</Text>
                    <Text style={styles.date}>{new Date(item.date).toLocaleDateString("it-IT", { timeZone: "Europe/Andorra" })}</Text>
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
    },
    sharedBy: {
        position: "absolute",
        bottom: 45,
        left: 20,
        color: "#fff",
        fontSize: 13,
        fontFamily: font.montserratLight
    }
});