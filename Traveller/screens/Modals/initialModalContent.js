import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, Modal, View, TouchableNativeFeedback, Image } from "react-native";
import { font } from "../../global/globalVariable";
import LottieView from 'lottie-react-native';

export default function InitialModalContent({ num, setNum }) {
    if (num == 0) {
        return (
            <>
                <Text style={modalstyles.apptitle}>TRAVELLER</Text>
                <View style={modalstyles.animationContainer}>
                    <LottieView
                        source={require('../../assets/animation/globeIntro.json')}
                        autoPlay
                        loop
                        style={{ width: 300, height: 300 }}
                    />
                </View>
                <Text style={modalstyles.title}>Benvenuto in Traveller!</Text>
                <Text style={modalstyles.subtitle}>Inizia subito a viaggiare per il globo in modo facile e veloce!</Text>
            </>
        )
    }
    else if (num == 1) {
        return (
            <>
                <Text style={modalstyles.apptitle}>TRAVELLER</Text>
                <View style={modalstyles.animationContainer}>
                    <LottieView
                        source={require('../../assets/animation/introWalking.json')}
                        autoPlay
                        loop
                        style={{ width: 300, height: 200 }}
                    />
                </View>
                <Text style={modalstyles.title}>Come funziona?</Text>
                <Text style={modalstyles.subtitle}>Traveller ti permette di organizzare viaggi con gli amici o senza, tenere a bada le finanze e avere i biglietti sempre dietro (oltre che a molto altro)!</Text>
            </>
        )
    }
}

const modalstyles = StyleSheet.create({
    title: {
        fontFamily: font.montserrat,
        fontSize: 25,
        color: "#FFF",
    },
    apptitle: {
        fontFamily: font.montserratBold,
        fontSize: 25,
        color: "#FFF",
        position: "absolute",
        top: 20,
    },
    animationContainer: {
        width: 300,
        height: 300,
    },
    subtitle: {
        fontFamily: font.montserrat,
        fontSize: 18,
        color: "#FFF",
        marginTop: 20,
        textAlign: "center",
        marginLeft: 20,
        marginRight: 20,
    },
});