import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from "react-native";
import { color, font, serverLink } from "../../global/globalVariable";
import axios from "axios";
import { getData } from "../../shared/data/localdata";
import { ActivityIndicator } from "react-native-paper";

export default function EnterTravel({ visibility, setVisibility, updateJoinTravels }) {
    let [code, setCode] = useState("");
    let [error, setError] = useState(false);
    let [loading, setLoading] = useState(false);

    return (
        <Modal animationType="slide" visible={visibility}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <TouchableOpacity style={{ position: "absolute", top: 20, right: 20 }} onPress={() => setVisibility(false)}>
                    <Text style={{ color: color.primary, fontSize: 18, fontFamily: font.montserrat }}>Annulla</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Entra in un nuovo viaggio</Text>
                <Text style={styles.text}>Inserisci il codice a 5 cifre che trovi nella home page del viaggio:</Text>
                {error ? <Text style={{ color: "red", fontSize: 16, fontFamily: font.montserrat }}>{error}</Text> : null}
                <TextInput placeholderTextColor={"gray"} style={styles.input} placeholder="Codice invito" maxLength={5} onChangeText={(value) => setCode(value)} />
                <TouchableOpacity style={[{ borderRadius: 10, padding: 10, width: "80%" }, (code.length < 5) ? { backgroundColor: "lightGray" } : { backgroundColor: color.primary, }, (loading) ? { opacity: 0, height: 0 } : { opacity: 100 }]} onPress={async () => {
                    if (code.length == 5) {
                        let userData = await getData("user");
                        let param = { userid: userData._id, code: code, username: userData.username }

                        setLoading(true);
                        axios.post(serverLink + "api/travel/join", param).then(async (response) => {
                            console.log(response.data)
                            if (response.status == 200) {
                                let userData = await getData("user");
                                updateJoinTravels(userData.username, userData._id);
                                setVisibility(false);
                                setLoading(false);
                            } else {
                                if (response.data.hasOwnProperty('message'))
                                    setError(response.data.message)
                                else
                                    setError(response.data);
                                setLoading(false);
                            }
                        })
                            .catch((error) => {
                                if (error.hasOwnProperty('message'))
                                    setError(error.message)
                                else
                                    setError(error);
                                setLoading(false);
                            })
                    }
                }}>
                    <Text style={{ color: "white", textAlign: "center", fontSize: 18, fontFamily: font.montserrat }}>Entra</Text>
                </TouchableOpacity>
                {(loading)
                    ?
                    <ActivityIndicator size="small" color={color.primary} />
                    :
                    null
                }
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        color: color.primary,
        fontSize: 23,
        textAlign: "center",
        fontFamily: font.montserrat,
    },
    text: {
        fontSize: 18,
        textAlign: "center",
        fontFamily: font.montserrat,
        marginTop: 10,
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 20,
    },
    input: {
        backgroundColor: "white",
        fontSize: 16,
        width: "80%",
        height: 50,
        marginBottom: 10,
        fontFamily: font.montserrat,
        borderBottomColor: color.secondary,
        borderBottomWidth: 2,
    },
});