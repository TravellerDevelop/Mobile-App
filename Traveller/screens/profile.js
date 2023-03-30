import React from "react";
import { View, StyleSheet, Text, Image, TouchableNativeFeedback } from "react-native";
import { font, color, paddingTopPage } from "../global/globalVariable";
import { Avatar } from "@react-native-material/core";
import AnimatedLottieView from "lottie-react-native";

export default function Profile() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.avatarview}>
                    <Avatar label="Pietro Bossolasco" autoColor size={100} labelStyle={{ fontFamily: font.montserrat, fontSize: 50 }} style={styles.avatar} />
                </View>
                <Text style={styles.name}>Pietro Bossolasco</Text>
                <Text style={styles.nickname}>@Bosso</Text>
                <View style={styles.row}>
                    <TouchableNativeFeedback>
                        <View style={styles.column}>
                            <Text style={styles.subtext} >12</Text>
                            <Text style={styles.subtext}>Viaggi</Text>
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback>
                        <View style={styles.column}>
                            <Text style={styles.subtext}>132</Text>
                            <Text style={styles.subtext}>Follower</Text>
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback>
                        <View style={styles.column}>
                            <Text style={styles.subtext}>412</Text>
                            <Text style={styles.subtext}>Seguiti</Text>
                        </View>
                    </TouchableNativeFeedback>
                </View>
                <TouchableNativeFeedback>
                    <View style={styles.button}>
                        <Text style={{ fontFamily: font.montserrat, fontSize: 20, color: "#FFF" }}>Modifica profilo</Text>
                    </View>
                </TouchableNativeFeedback>

                <View style={{flex: 1, backgroundColor: "#fff", alignItems: "center", paddingTop:50 }}>
                    <AnimatedLottieView source={require("../assets/animation/sadGuyWalking.json")} autoPlay loop style={{width: 150, height: 150}}  />
                    <Text style={styles.err}>Ancora nessun viaggio : /</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: color.primary,
        paddingTop: paddingTopPage,
    },
    content: {
        flex: 1,
        marginTop: 60,
        width: "100%",
        backgroundColor: "#FFF",
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarview: {
        backgroundColor: "#FFF",
        borderRadius: 100,
        width: 110,
        height: 110,
        elevation: 5,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -55,
        marginBottom: 20,
    },
    name: {
        fontFamily: font.montserratBold,
        fontSize: 23,
        color: color.secondary,
    },
    nickname: {
        fontFamily: font.montserrat,
        fontSize: 15,
        color: color.secondary,
    },
    row: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: 20,
        marginBottom: 20,
    },
    column: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    subtext: {
        fontFamily: font.montserrat,
        fontSize: 15,
        color: "#000",
    },
    button: {
        width: "90%",
        height: 50,
        backgroundColor: color.secondary,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    err: {
        fontFamily: font.montserrat,
        fontSize: 20,
        color: "#000",
    }
});