import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, font } from '../global/globalVariable';
import NewTravel from '../screens/Modals/newTravel';

export default function InteractiveCard({ userState, setUserState, updatecards }) {
    let [newTravelVisibility, setNewTravelVisibility] = React.useState(false);

    return (
        <>
            {newTravelVisibility && <NewTravel updatecards={updatecards} setNewTravelVisibility={setNewTravelVisibility} />}
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
        width: Dimensions.get("window").width - 20,
        borderRadius: 10,
        marginTop: 30,
        marginBottom: 30,
        marginLeft: 10,
        marginRight: 10,
    },
    cardTitle: {
        color: "white",
        fontSize: 19,
        textAlign: "left",
        fontFamily: font.text_bold,
    },
    cardSubtitle: {
        color: "white",
        marginTop: 5,
        fontSize: 17,
        textAlign: "left",
        fontFamily: font.text,
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
        fontFamily: font.text_bold,
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
        fontFamily: font.text,
        textAlign: "center"
    },
    input: {
        backgroundColor: "white",
        padding: 10,
        marginTop: 10,
        width: "100%",
        height: 50,
        marginBottom: 10,
        fontFamily: font.text,
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
        fontFamily: font.text,
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
        fontFamily: font.text,
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
        fontFamily: font.text,
        fontSize: 15,
    }
})