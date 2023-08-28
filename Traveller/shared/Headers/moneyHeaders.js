import React from "react";
import { StyleSheet, Text, TouchableOpacity, Modal, View, TouchableNativeFeedback, Image, Dimensions } from "react-native";
import { color, font } from "../../global/globalVariable.js";
import { LinearGradient } from "expo-linear-gradient";
import { Badge } from "@react-native-material/core";

export default function MoneyHeader() {

    return (
        <>
            <LinearGradient
                style={styles.container}
                start={{ x: 0.5, y: 0.2 }}
                colors={[color.primary, color.secondary]}
            >
                <Text style={{ fontFamily: font.text_bold, fontSize: 25, color: "white", marginLeft: 20 }}>Money</Text>
                <Text style={styles.paragraph}>Tieni a bada le tue finanze! 🪙</Text>
                <Text style={styles.paragraph}>Vedi tutte le statistiche dettagliate sulle entrate e uscite dei tuoi viaggi! 💵💶</Text>
            </LinearGradient>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: color.primary,
        width: "100%",
        height: 140,
    },
    add: {
        position: "absolute",
        left: 20,
        top: 100,
        height: 25,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    label: {
        marginLeft: 10,
        marginRight: 10,
        fontFamily: font.text,
        fontSize: 12,
        color: "#000",
    },
    paragraph: {
        fontFamily: font.text,
        fontSize: 15,
        color: "#FFF",
        marginLeft: 20,
        marginRight: 20,
        marginTop: 10,
    },
    camera: {
        aspectRatio: 1 / 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width,
    },
    input: {
        width: Dimensions.get("window").width - 22,
        fontFamily: font.text,
        height: 40,
        backgroundColor: "#F5F5F5",
        marginBottom: 20,
        borderRadius: 10,
        paddingLeft: 10,
        paddingRight: 10,
        marginLeft: 10
    },
    datePicker: {
        width: Dimensions.get("window").width - 20,
        height: 40,
        marginBottom: 20,
    }
});


const modalstyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-around",
    },
    title: {
        fontFamily: font.text_bold,
        fontSize: 25,
        color: color.secondary,
    },
    subtitle: {
        fontFamily: font.text,
        fontSize: 19,
        maxWidth: "80%",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        height: 50,
        paddingLeft: 20,
    },
    image: {
        height: 25,
        width: 25,
        marginRight: 10,
    },
    card: {
        width: "90%",
        backgroundColor: "white",
        padding: 10,
        borderColor: color.primary,
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 20,
        elevation: 5,
    },
    paragraph: {
        fontFamily: font.text,
        fontSize: 15,
        marginLeft: 20,
        marginRight: 20,
        marginBottom: 10,
    },
    button: {
        backgroundColor: color.primary,
        width: "90%",
        height: 50,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
    },
    buttonText: {
        fontFamily: font.text,
        fontSize: 20,
        color: "white",
    },
});