import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { font, color, paddingTopPage } from "../global/globalVariable";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";


export default function TravelPartecipantsHeader({ navigation, route }) {
    return (
        <>
            <LinearGradient
                style={styles.container}
                start={{ x: 0.5, y: 0.2 }}
                colors={[color.primary, color.secondary]}
            >
                <View style={styles.row}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="white" onPress={() => navigation.goBack()} />
                    <Text style={styles.title}>{route.params.name}</Text>
                </View>
                <Text style={styles.subtitle}>Creato il {new Date(route.params.creation_date).toLocaleDateString('it-IT')}</Text>
            </LinearGradient>
            <View style={styles.bg}>
                <View style={styles.rounded}></View>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        paddingTop: paddingTopPage,
        paddingLeft: 10,
        paddingBottom: 20,
        paddingRight: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    title: {
        color: "white",
        fontFamily: font.montserratBold,
        fontSize: 25,
        marginLeft: 10
    },
    bg: {
        backgroundColor: "#4900FF",
    },
    rounded: {
        backgroundColor: "white",
        height: 20,
        width: "100%",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    subtitle: {
        fontSize: 15,
        fontFamily: font.montserratLight,
        marginLeft: 35,
        marginTop: 10,
        color: "white",
        marginBottom: 10,
    },
})