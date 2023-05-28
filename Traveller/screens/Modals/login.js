import React, { useState, } from "react";
import { StyleSheet, View, Text, TouchableNativeFeedback, TouchableWithoutFeedback, Modal, TextInput, ScrollView, ActivityIndicator, Platform } from "react-native";
import { font, color, serverLink } from "../../global/globalVariable";
import { storeStringData, storeJsonData } from "../../shared/data/localdata";
import AnimatedLottieView from "lottie-react-native";
import Signup from "./registration";
import axios from "axios";
import * as Crypto from 'expo-crypto';

export default function LoginModal({ navigation, visibility, setVisibility }) {
    let [animation, setAnimation] = useState("none")
    let [signup, setSignup] = useState(false)
    let [isLoading, setIsLoading] = useState(false)

    let [username, setUsername] = useState("");
    let [password, setPassword] = useState("");

    let [error, setError] = useState(null);

    return (
        <>
            {signup ? <Signup visibility={signup} navigation={navigation} setVisibility={setSignup} loginVisibility={visibility} setLoginVisibility={setVisibility} /> : null}

            <Modal visible={visibility} animationType={"none"} >
                <ScrollView>
                    <Text style={(Platform.OS == 'ios') ? [styles.title, {marginTop: 60}] : styles.title}>TRAVELLER</Text>
                    <View style={styles.container}>
                        <View style={{ width: 150, margintop: 30, height: 150, alignItems: "center", justifyContent: "center" }}>
                            <AnimatedLottieView source={require("../../assets/animation/121700-worldwide.json")} autoPlay loop />
                        </View>
                        <Text style={styles.undertitle} >Gira il mondo facilmente</Text>
                        {error != null ? <Text style={{ color: "red", fontSize: 15, textAlign: "center" }}>{error}</Text> : null}
                        <TextInput placeholderTextColor={"gray"} placeholder="Username" style={styles.input} onChangeText={(value) => { username_(value) }} />
                        <TextInput placeholderTextColor={"gray"} secureTextEntry={true} placeholder="Password" style={styles.input} onChangeText={(value) => { password_(value) }} />
                        {isLoading ? <ActivityIndicator size="large" color={color.secondary} /> : null }
                            <TouchableNativeFeedback onPress={() => {
                                (async () => {
                                    setIsLoading(true);
                                    const digest = await Crypto.digestStringAsync(
                                        Crypto.CryptoDigestAlgorithm.SHA256,
                                        password
                                    );
                                    if (username != "" && password != "") {
                                        axios.post(serverLink + "api/user/login", { username: username, password: digest })
                                            .then((response) => {
                                                console.log(response.data[0])
                                                setIsLoading(false);

                                                if (response.status == 200) {
                                                    storeJsonData('user', response.data[0]);
                                                    storeStringData('openLogin', "true");
                                                    setVisibility(false);
                                                    navigation.navigate("Home");
                                                }
                                                else {
                                                    setError(response.data);
                                                }
                                            })
                                            .catch((error) => {
                                                setIsLoading(false);
                                                console.log(error);
                                            })
                                    }
                                    else {
                                        setIsLoading(false);
                                        setError("Inserisci username e password");
                                    }
                                })();
                            }}>
                                <View style={(isLoading) ? [styles.button, {display : "none"}] : styles.button}>
                                    <Text style={styles.buttonText}>Login</Text>
                                </View>
                            </TouchableNativeFeedback>
                        <TouchableWithoutFeedback onPress={() => {
                            if (!isLoading) {
                                setVisibility(false);
                                setSignup(true);
                            }
                        }}>
                            <Text style={styles.link}>Non sei ancora registrato?</Text>
                        </TouchableWithoutFeedback>
                    </View>
                </ScrollView>
            </Modal >
        </>
    )

    function username_(text) { setUsername(text) }
    function password_(text) { setPassword(text) }
}

let styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontFamily: font.montserratBold,
        color: color.secondary,
        fontSize: 25,
        textAlign: "center",
        marginTop: 40,
    },
    input: {
        backgroundColor: "white",
        padding: 10,
        marginTop: 10,
        width: "80%",
        height: 50,
        marginBottom: 10,
        fontFamily: font.montserrat,
        borderBottomColor: color.secondary,
        borderBottomWidth: 2,
        borderTopColor: "lightgray",
        borderTopWidth: 1,
        borderLeftColor: "lightgray",
        borderLeftWidth: 1,
        borderRightColor: "lightgray",
        borderRightWidth: 1,
        borderRadius: 10,
    },
    button: {
        width: "80%",
        height: 50,
        backgroundColor: color.secondary,
        borderRadius: 10,
        marginTop: 20,
        marginBottom: 20,
    },
    buttonText: {
        color: "white",
        fontFamily: font.montserrat,
        fontSize: 18,
        textAlign: "center",
        lineHeight: 50,
    },
    link: {
        color: color.secondary,
        fontFamily: font.montserrat,
        fontSize: 16,
        marginTop: 20,
        textDecorationLine: "underline",
    },
    undertitle: {
        fontFamily: font.montserrat,
        color: color.secondary,
        fontSize: 18,
        textAlign: "center",
        marginTop: 0,
        marginBottom: 50,
    }
});