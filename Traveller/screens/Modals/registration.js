import React, { useEffect } from "react";
import { StyleSheet, View, Text, TouchableNativeFeedback, TouchableWithoutFeedback, Modal, TextInput, ScrollView, ActivityIndicator, Platform } from "react-native";
import { font, color, serverLink } from "../../global/globalVariable";
import { storeJsonData, storeStringData } from "../../shared/data/localdata";
import axios from "axios";
import * as Crypto from 'expo-crypto';


export default function Signup({ navigation, visibility, setVisibility, loginVisibility, setLoginVisibility }) {
    let [name, setName] = React.useState("");
    let [surname, setSurname] = React.useState("");
    let [username, setUsername] = React.useState("");
    let [email, setEmail] = React.useState("");
    let [password, setPassword] = React.useState("");

    let [loading, setLoading] = React.useState(false);

    return (
        <Modal visible={visibility} animationType="none" >
            <ScrollView>
                <Text style={(Platform.OS == 'ios') ? [styles.title, {marginTop: 60}] : styles.title}>TRAVELLER</Text>
                <View style={styles.container}>
                    <TextInput placeholderTextColor={"gray"} placeholder="Nome" style={styles.input} autoCorrect={false} onChangeText={(value) => { name_(value) }} />
                    <TextInput placeholderTextColor={"gray"} placeholder="Cognome" style={styles.input} autoCorrect={false} onChangeText={(value) => { surname_(value) }} />
                    <TextInput placeholderTextColor={"gray"} autoCapitalize="none" placeholder="Username" style={styles.input} autoCorrect={false} onChangeText={(value) => { username_(value) }} />
                    <TextInput placeholderTextColor={"gray"} autoCapitalize="none" placeholder="Email" style={styles.input} autoCorrect={false} keyboardType='email-address' inputMode='email' onChangeText={(value) => { email_(value) }} />
                    <TextInput placeholderTextColor={"gray"} autoCapitalize="none" secureTextEntry placeholder="Password" autoCorrect={false} style={styles.input} onChangeText={(value) => { password_(value) }} />
                    <TouchableNativeFeedback onPress={() => {
                        (async () => {
                            if (loading) return;

                            setLoading(true);
                            const digest = await Crypto.digestStringAsync(
                                Crypto.CryptoDigestAlgorithm.SHA256,
                                password
                            );

                            if (name != "" && surname != "" && username != "" && email != "" && password != "" && password.length >= 8 && email.includes("@") && email.includes(".")) {
                                axios.post(serverLink + "api/user/register", { name: name, surname: surname, username: username, email: email, password: digest })
                                    .then((response) => {
                                        if (response.status == 200) {
                                            axios.get(serverLink + "api/user/info?username=" + username)
                                            .then(async (response) => {
                                                    storeStringData("openLogin", "true");
                                                    await storeJsonData("user", response.data[0]);
                                                    setVisibility(false);
                                                    setLoginVisibility(false);
                                                    navigation.navigate("Home");
                                                })
                                                .catch((error) => {
                                                    console.log("Errore nel recupero dati: ", error);
                                                })
                                        }
                                        else {
                                            if (response.status == 202) {
                                                setLoading(false);
                                                alert("Username già in uso");
                                            }
                                        }
                                    })
                                    .catch((error) => {
                                        setLoading(false);
                                        console.log("Errore nell'invio dati:", error);
                                    })
                            }
                            else {
                                setLoading(false);
                                alert("Inserisci tutti i campi correttamente");
                            }
                        })();
                    }}>
                        {
                            loading ?
                            <ActivityIndicator size="large" color={color.secondary} style={{ marginTop: 20, marginBottom: 20 }} />
                            :
                            <View style={styles.button}>
                                <Text style={styles.buttonText}>Registrati</Text>
                            </View>
                        }
                    </TouchableNativeFeedback>
                    <TouchableWithoutFeedback onPress={() => {
                        setVisibility(false);
                        setLoginVisibility(true);
                    }}>
                        <Text style={styles.link}>Hai già un account?</Text>
                    </TouchableWithoutFeedback>
                </View>
            </ScrollView>
        </Modal>
    )

    function name_(text) { setName(text) }
    function surname_(text) { setSurname(text) }
    function username_(text) { setUsername(text) }
    function email_(text) { setEmail(text) }
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
        marginBottom: 50,
    },
    input: {
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
    },
});