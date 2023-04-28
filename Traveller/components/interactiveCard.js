import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, font, serverLink } from '../global/globalVariable';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { Dropdown } from 'react-native-element-dropdown';
import axios from 'axios';
import { getStringData } from '../shared/data/localdata';
import NewTravel from '../screens/Modals/newTravel';

export default function InteractiveCard({ userState, setUserState }) {
    let [newTravelVisibility, setNewTravelVisibility] = React.useState(false);

    return (
        <>
            {newTravelVisibility ? <NewTravel userState={userState} setUserState={setUserState} setNewTravelVisibility={setNewTravelVisibility} /> : null}
            <View style={styles.container}>
                <LinearGradient
                    start={{ x: 0.4, y: 0.3 }}
                    colors={[color.primary, color.secondary]}
                    style={styles.gradient}
                >
                    <Text style={styles.cardTitle}>Iniziamo un' avventura! ✈️</Text>
                    <Text style={styles.cardSubtitle}>Potremmo cercare un tesoro o esplorare il Far West! 💪💪</Text>
                    <View style={styles.button}>
                        <TouchableOpacity onPress={() => { setNewTravelVisibility(true) }}>
                            <Text style={styles.buttonText}>Crea il viaggio!</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        </>
    )

    function name_(text) { setName(text) }
    function description_(text) { setDescription(text) }
    function budget_(text) { setBudget(text) }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "transparent",
        height: 140,
        width: "90%",
        borderRadius: 10,
        marginTop: 30,
        marginBottom: 30,
        marginLeft: "5%",
    },
    cardTitle: {
        color: "white",
        fontSize: 19,
        textAlign: "left",
        fontFamily: font.montserrat,
    },
    cardSubtitle: {
        color: "white",
        marginTop: 10,
        fontSize: 15,
        textAlign: "left",
        fontFamily: font.montserratLight,
    },
    button: {
        position: "absolute",
        bottom: 0,
        left: 10,
        width: "100%",
        height: 40,
        textAlign: "center",
    },
    buttonText: {
        color: "white",
        textAlign: "center",
        fontSize: 15,
        fontFamily: font.montserratBold,
        lineHeight: 40,
        width: "100%",
    },
    gradient: {
        height: "100%",
        width: "100%",
        borderRadius: 10,
        paddingRight: 10,
        paddingTop: 15,
        paddingLeft: 15,
    },
    title: {
        fontSize: 20,
        marginTop: 20,
        fontFamily: "montserrat-regular",
        textAlign: "center"
    },
    input: {
        backgroundColor: "white",
        padding: 10,
        marginTop: 10,
        width: "100%",
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
    inputMultiline: {
        backgroundColor: "white",
        padding: 10,
        marginTop: 10,
        width: "100%",
        height: 100,
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
    modalButton: {
        width: "100%",
        height: 50,
        backgroundColor: color.secondary,
        borderRadius: 10,
        marginTop: 20,
        marginBottom: 20,
    },
    modalButtonText: {
        color: "white",
        fontFamily: font.montserrat,
        fontSize: 18,
        textAlign: "center",
        lineHeight: 50,
    },
    person: {
        backgroundColor: color.secondary,
        borderRadius: 20,
        padding: 5,
        paddingLeft: 10,
        paddingRight: 10,
        marginRight: 10,
        marginTop: 10,
    },
    personText: {
        color: "white",
        fontFamily: font.montserrat,
        fontSize: 15,
    }
})