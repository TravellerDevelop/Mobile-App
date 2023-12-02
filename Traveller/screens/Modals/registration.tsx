import axios from "axios";
import * as Crypto from 'expo-crypto';
import React from "react";
import { Dimensions, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableNativeFeedback, TouchableWithoutFeedback, View } from "react-native";
import { TextInput } from "react-native-paper";
import SkeletonScreen from "../../components/SkeletonScreen";
import { color, font, serverLink, setUserInfo } from "../../global/globalVariable";
import { storeJsonData, storeStringData } from "../../shared/data/localdata";

interface SignupProps {
    visibility: boolean,
    setVisibility: (bool: boolean) => void,
    setLoginVisibility: (bool: boolean) => void,
    setLogged: (bool: boolean) => void,
}

export default function Signup({ visibility, setVisibility, setLoginVisibility, setLogged }: SignupProps) {
    let [name, setName] = React.useState("");
    let [surname, setSurname] = React.useState("");
    let [username, setUsername] = React.useState("");
    let [email, setEmail] = React.useState("");
    let [password, setPassword] = React.useState("");
    let [loading, setLoading] = React.useState(false);
    const registerUser = async () => {
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
                                    setUserInfo(response.data[0])
                                    await storeJsonData("user", response.data[0]);
                                    setVisibility(false);
                                    setLoginVisibility(false);
                                    setLogged(true);
                                })
                                .catch((error) => {
                                    console.log("Errore nel recupero dati: ", error);
                                })
                        }
                        else {
                            if (response.status == 202) {
                                setLoading(false);
                                console.log("Username già in uso");
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
                console.log("Inserisci tutti i campi correttamente");
            }
        })();
    }

    return (
        <Modal visible={visibility} animationType="none" >
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView>
                    <Text style={(Platform.OS == 'ios') ? [styles.title, { marginTop: 60 }] : styles.title}>TRAVELLER</Text>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.container}>
                            <Text style={styles.signupText}>Registrati</Text>
                            <TextInput underlineStyle={{ borderColor: "white", backgroundColor: 'transparent' }} activeUnderlineColor="#4960FF" textContentType="name" label="Nome" style={styles.input} autoCorrect={false} onChangeText={(value) => { name_(value) }} />
                            <TextInput underlineStyle={{ borderColor: "white", backgroundColor: 'transparent' }} activeUnderlineColor="#4960FF" textContentType="middleName" label="Cognome" style={styles.input} autoCorrect={false} onChangeText={(value) => { surname_(value) }} />
                            <TextInput underlineStyle={{ borderColor: "white", backgroundColor: 'transparent' }} activeUnderlineColor="#4960FF" textContentType="nickname" autoCapitalize="none" label="Username" style={styles.input} autoCorrect={false} onChangeText={(value) => { username_(value) }} />
                            <TextInput underlineStyle={{ borderColor: "white", backgroundColor: 'transparent' }} activeUnderlineColor="#4960FF" textContentType="emailAddress" autoCapitalize="none" label="Email" style={styles.input} autoCorrect={false} keyboardType='email-address' inputMode='email' onChangeText={(value) => { email_(value) }} />
                            <TextInput underlineStyle={{ borderColor: "white", backgroundColor: 'transparent' }} activeUnderlineColor="#4960FF" textContentType="password" autoCapitalize="none" secureTextEntry label="Password" autoCorrect={false} style={styles.input} onChangeText={(value) => { password_(value) }} />
                            <View style={styles.signupButtonContainer}>
                                {
                                    loading ?
                                        <SkeletonScreen height={50} width={150} borderRadius={50} style={{ marginTop: 20, marginBottom: 20 }} />
                                        :
                                        <TouchableNativeFeedback onPress={() => { registerUser() }}>
                                            <View style={styles.button}>
                                                <Text style={styles.buttonText}>Registrati</Text>
                                                <Image source={require('../../assets/image/icona-freccia-right.png')} style={{ height: 20, width: 20 }} />
                                            </View>
                                        </TouchableNativeFeedback>
                                }
                            </View>
                            <TouchableWithoutFeedback onPress={() => {
                                setVisibility(false);
                                setLoginVisibility(true);
                            }}>
                                <Text style={[styles.link]}>Hai già un account?</Text>
                            </TouchableWithoutFeedback>
                        </View>
                    </KeyboardAvoidingView>
                </ScrollView>
            </SafeAreaView>
        </Modal >
    )

    function name_(text: string) { setName(text) }
    function surname_(text: string) { setSurname(text) }
    function username_(text: string) { setUsername(text) }
    function email_(text: string) { setEmail(text) }
    function password_(text: string) { setPassword(text) }
}

let styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        alignItems: "center",
        marginRight: 20,
        marginLeft: 20,
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
        width: Dimensions.get('screen').width - 40,
        height: 50,
        marginBottom: 20,
        borderRadius: 25,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        borderWidth: 1,
        borderColor: 'lightgray'
    },
    button: {
        width: 150,
        height: 50,
        backgroundColor: color.secondary,
        borderRadius: 50,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonText: {
        color: "white",
        fontFamily: font.text,
        fontSize: 18,
        textAlign: "center",
        lineHeight: 50,
        marginRight: 10
    },
    link: {
        color: color.secondary,
        fontFamily: font.text,
        fontSize: 16,
    },
    signupButtonContainer: {
        width: '100%',
        alignItems: 'flex-end'
    },
    signupText: {
        color: 'black',
        fontFamily: font.text,
        fontSize: 30,
        textAlign: 'center',
        width: '100%',
        marginBottom: 10,
        marginTop: 30
    },
});