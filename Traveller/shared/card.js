import React from "react";
import { View, Text, StyleSheet, TouchableNativeFeedback } from "react-native";
import CardPartecipants from "./cardPartecipants";
import { color, font } from "../global/globalVariable";

export default function Card({ navigation, data, vertical }) {

    let creator = "";
    let i = 0;
    while (creator == "" && i < data.participants.length) {
        if (data.participants[i].creator === true) {
            creator = data.participants[i].username;
        }
        i++;
    }

    return (
        <TouchableNativeFeedback onPress={() => navigation.navigate("TravelDetail", data)}>
            {(!vertical) ?
                <View style={styles.container}>
                    <View style={{ position: 'absolute', top: 10, left: 10 }}>
                        <Text style={styles.cardTitle}>{data.name}</Text>
                        <Text style={styles.cardSubtitle}>Creato il {data.creation_date} da {creator}</Text>
                    </View>
                    <View style={{ position: 'absolute', bottom: 10, right: 30 }}>
                        {/* <CardPartecipants  data={data} /> */}
                    </View>
                </View>
                :
                <View style={styles.containerVertical}>
                    <View style={{ position: 'absolute', top: 10, left: 10 }}>
                        <Text style={styles.cardTitle}>{data.name}</Text>
                        <Text style={styles.cardSubtitle}>Creato il {data.creation_date} da {creator}</Text>
                    </View>
                    <View style={{ position: 'absolute', bottom: 10, right: 30 }}>
                        {/* <CardPartecipants  data={data} /> */}
                    </View>
                </View>
            }
        </TouchableNativeFeedback>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: color.primary,
        height: 140,
        width: 250,
        borderRadius: 10,
        margin: 10,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
    },
    containerVertical: {
        backgroundColor: color.primary,
        height: 140,
        width: "90%",
        borderRadius: 10,
        margin: 10,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
    },
    cardTitle: {
        color: "white",
        fontSize: 24,
        textAlign: "left",
        fontFamily: font.montserrat,
    },
    cardSubtitle: {
        color: "white",
        fontSize: 16,
        textAlign: "left",
        fontFamily: font.montserratLight,
    },
    avatarContainer: {
        backgroundColor: "white",
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        height: 35,
        width: 35,
        marginRight: -15,
    }
});