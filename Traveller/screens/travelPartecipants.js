import { Avatar } from "@react-native-material/core";
import React from "react";
import { StyleSheet, View, FlatList, Text, TouchableNativeFeedback, Image } from "react-native";
import { color, font } from "../global/globalVariable";
import TravelPartecipantsHeader from "../shared/travelPartecipantsHeader";

export default function TravelPartecipants({ navigation, route }) {
    let num = route.params.participants.length;
    return (
        <View style={{flex: 1}}>
            <TravelPartecipantsHeader navigation={navigation} route={route} />
            <View style={styles.container}>
                <Text style={styles.title}>Partecipanti</Text>
                <Text style={styles.subtext}>{(num == 1) ? num + " partecipante" : num + " partecipanti"}</Text>
                <FlatList
                    data={route.params.participants}
                    renderItem={({ item }) => (
                        <TouchableNativeFeedback>
                            <View style={styles.avatarContainer}>
                                <View style={styles.borderAvatarContainer}>
                                    <Avatar label={item} autoColor size={35} labelStyle={{ fontFamily: font.montserrat, fontSize: 15 }} />
                                </View>
                                <Text style={styles.text}>{item}</Text>
                            </View>
                        </TouchableNativeFeedback>
                    )}
                />
            </View>
            <TouchableNativeFeedback>
                <View style={styles.leave}>
                    <Image source={require("../assets/image/icona-logout-white.png")} style={{ width: 30, height: 30, marginRight: 10 }} />
                    <Text style={styles.leaveText}>Abbandona viaggio</Text>
                </View>
            </TouchableNativeFeedback>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        paddingBottom: 100
    },
    title: {
        fontSize: 30,
        fontFamily: font.montserrat,
        textAlign: "center",
        marginTop: 10,
        marginBottom: 10,
    },
    avatarContainer: {
        marginLeft: 20,
        marginRight: 20,
        paddingBottom: 10,
        paddingTop: 10,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    borderAvatarContainer: {
        backgroundColor: "white",
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        height: 40,
        width: 40,
        marginRight: -15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginRight: 10,
    },
    text: {
        marginLeft: 10,
        fontSize: 20,
        fontFamily: font.montserrat,
    },
    subtext: {
        fontSize: 15,
        fontFamily: font.montserratLight,
        marginLeft: 20,
        marginTop: 10,
        marginBottom: 10,
    },
    leave: {
        backgroundColor: color.primary,
        height: 50,
        width: "90%",
        position: "absolute",
        bottom: 100,
        left: "5%",
        borderRadius: 10,
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
        flexDirection: "row",
    },
    leaveText: {
        color: "white",
        fontFamily: font.montserrat,
        fontSize: 20,
    },
});