import axios from "axios";
import * as Crypto from 'expo-crypto';
import React, { useState, } from "react";
import { Dimensions, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TouchableNativeFeedback, TouchableWithoutFeedback, View } from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginTopShape from "../../assets/image/shapes/loginTopShape";
import SkeletonScreen from "../../components/SkeletonScreen";
import { color, font, serverLink, setUserInfo } from "../../global/globalVariable";
import { storeJsonData, storeStringData } from "../../shared/data/localdata";
import Signup from "./registration";

interface LoginModalProps {
    setLogged: (bool: boolean) => void
}

export default function LoginModal({ setLogged }: LoginModalProps) {
    let [signup, setSignup] = useState(false)
    let [isLoading, setIsLoading] = useState(false)
    let [visibility, setVisibility] = useState(true);

    let [username, setUsername] = useState("");
    let [password, setPassword] = useState("");
    let [showPassword, setShowPassword] = useState(false);
    const passwordInputRef = React.useRef<any>(null);

    let [error, setError] = useState("");

    return (
        <>
            {signup && <Signup visibility={signup}  setVisibility={setSignup} setLoginVisibility={setVisibility} setLogged={setLogged} />}

            <Modal visible={visibility} animationType={'slide'} >
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={{ height: Platform.OS === 'ios' ? 100 : 60, width: '100%', backgroundColor: '#4960FF' }}>
                        <Text style={(Platform.OS == 'ios') ? [styles.title, { marginTop: 50 }] : styles.title}>TRAVELLER</Text>
                    </View>
                    <LoginTopShape mode="top" />
                    <View style={styles.container}>
                        <Text style={styles.loginText}>Login</Text>
                        {error && <Text style={{ color: "red", fontSize: 15, textAlign: "center" }}>{error}</Text>}
                        <TextInput underlineStyle={{ borderColor: "white", backgroundColor: 'transparent' }} activeUnderlineColor="#4960FF" label="Username" style={styles.input} onChangeText={(value) => { username_(value) }} />
                        <TextInput
                            label="Password"
                            placeholderTextColor={"gray"}
                            underlineStyle={{ borderColor: "white", backgroundColor: 'transparent' }}
                            style={styles.input}
                            secureTextEntry={!showPassword}
                            activeUnderlineColor="#4960FF"
                            ref={passwordInputRef}
                            onChangeText={(value) => { password_(value) }}
                            right={<TextInput.Icon icon="eye" onPress={() => {
                                setShowPassword(!showPassword)
                                passwordInputRef.current?.focus();
                            }} />}
                        />
                        <View style={styles.loginButtonContainer}>
                            {isLoading ?
                                <SkeletonScreen height={50} width={150} borderRadius={50} style={{ marginTop: 20, marginBottom: 20 }} />
                                :
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
                                                        setUserInfo(response.data[0])
                                                        setLogged(true);
                                                        storeStringData('openLogin', "true");
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
                                    <View style={(isLoading) ? [styles.button, { display: "none" }] : styles.button}>
                                        <Text style={styles.buttonText}>Login</Text>
                                        <Image source={require('../../assets/image/icona-freccia-right.png')} style={{ height: 20, width: 20 }} />
                                    </View>
                                </TouchableNativeFeedback>
                            }
                        </View>
                        <TouchableWithoutFeedback onPress={() => {
                            if (!isLoading) {
                                setVisibility(false);
                                setSignup(true);
                            }
                        }}>
                            <Text style={styles.link}>Non sei ancora registrato?</Text>
                        </TouchableWithoutFeedback>
                    </View>

                    <View style={{ flex: 1 }}></View>
                    <LoginTopShape mode="bottom" />
                    <View style={{
                        height: Platform.OS === 'ios' ? 60 : 50,
                        backgroundColor: '#4960FF'
                    }}>
                        <Text style={styles.copyright}>Traveller © 2023</Text>
                    </View>
                </SafeAreaView>
            </Modal >
        </>
    )

    function username_(text: any) { setUsername(text) }
    function password_(text: any) { setPassword(text) }
}

let styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        alignItems: "flex-start",
        justifyContent: "center",
        marginLeft: 20,
        marginRight: 20
    },
    title: {
        fontFamily: font.montserratBold,
        color: '#fff',
        fontSize: 25,
        textAlign: "left",
        marginTop: 20,
        marginLeft: 20
    },
    loginText: {
        color: 'black',
        fontFamily: font.text,
        fontSize: 30,
        textAlign: 'center',
        width: '100%'
    },
    input: {
        backgroundColor: "white",
        marginTop: 20,
        width: Dimensions.get('screen').width - 40,
        height: 50,
        marginBottom: 10,
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
        marginTop: 20,
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
    },
    loginButtonContainer: {
        width: '100%',
        alignItems: 'flex-end'
    },
    copyright: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 20 : 10,
        color: 'white',
        textAlign: 'center',
        width: '100%',
        fontFamily: font.text
    }
});