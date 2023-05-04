import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Image, ActivityIndicator, TouchableNativeFeedback } from 'react-native';
import { color, font, serverLink } from '../../global/globalVariable';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { Dropdown } from 'react-native-element-dropdown';
import axios from 'axios';
import { getStringData } from '../../shared/data/localdata';


export default function NewTravel({ userState, setUserState, setNewTravelVisibility, updatecards }) {
    let [creator, setCreator] = React.useState("");
    let [name, setName] = React.useState("");
    let [description, setDescription] = React.useState("");
    let [budget, setBudget] = React.useState("");
    let [participants, setParticipants] = React.useState([]);
    let [visibility, setVisibility] = React.useState("");
    let [date, setDate] = React.useState("");
    let [new_members_allowed, setNewMembersAllowed] = React.useState("");

    let [isLoading, setIsLoading] = React.useState(false);

    const dataVisibility = [
        { label: 'Pubblico', value: '1' },
        { label: 'Solo amici', value: '2' },
        { label: 'Privato', value: '3' },
    ];

    const newMembers = [
        { label: 'Chiunque', value: '1' },
        { label: 'Solo amici', value: '2' },
        { label: 'Solo su invito', value: '3' },
    ];

    React.useEffect(() => {
        setDate(new Date().toISOString().slice(0, 10));
        setCreator(userState[0].username)
    }, []);

    return (
        <Modal visible={true} animationType='slide'>
            <TouchableNativeFeedback onPress={() => { setNewTravelVisibility(false) }} >
                {/* <View style={{ width: 30, height: 30, position: "absolute", top: 20, left: 20 }}> */}
                    <Image source={require('../../assets/image/icona-freccia-left.png')} style={{ width: 30, height: 30, tintColor: "#000", position: "absolute", top: 20, left: 20 }} />
                {/* </View> */}
            </TouchableNativeFeedback>

            <Text style={[styles.title, { marginBottom: 30 }]}>Crea un nuovo viaggio!</Text>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", width: "100%" }}>
                <ScrollView style={{ flex: 1, width: "80%" }}>
                    <TextInput style={styles.input} placeholder="Nome del viaggio" onChangeText={(value) => { name_(value) }} />
                    <TextInput style={styles.inputMultiline} placeholder="Descrizione (facoltativa)" multiline onChangeText={(value) => { description_(value) }} />
                    <TextInput style={styles.input} placeholder="Budget (facoltativo)" onChangeText={(value) => { budget_(parseInt(value)) }} />
                    <TextInput style={styles.input} placeholder="Aggiungi amico al viaggio" />
                    <TouchableOpacity>
                        <View style={[styles.modalButton, { height: 35, marginTop: 0, borderRadius: 35, width: "50%", marginLeft: "25%" }]}>
                            <Text style={[styles.modalButtonText, { lineHeight: 35, fontSize: 16 }]}>Aggiungi</Text>
                        </View>
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.cardSubtitle, { color: "black", marginTop: 30 }]}>Persone aggiunte al viaggio:</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                            <View style={styles.person}>
                                <Text style={styles.personText}>Bosso</Text>
                            </View>
                            <View style={styles.person}>
                                <Text style={styles.personText}>Ernesto</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={[styles.cardSubtitle, { color: "black", marginTop: 30 }]}>Privacy e sicurezza</Text>
                    <Dropdown
                        placeholder='Visibilità'
                        data={dataVisibility}
                        style={{ borderBottomColor: "#4900FF", borderBottomWidth: 2, width: "100%", marginTop: 10 }}
                        placeholderStyle={{ fontFamily: font.montserrat }}
                        selectedTextStyle={{ fontFamily: font.montserrat }}
                        inputSearchStyle={{ fontFamily: font.montserrat }}
                        fontFamily={font.montserrat}
                        onChange={(value) => { setVisibility(value["value"]) }}
                        onChangeText={(value) => { console.log("Text: ", value) }}
                        labelField="label"
                        valueField="value"
                    />

                    <Dropdown
                        placeholder='Nuovi membri'
                        data={newMembers}
                        style={{ borderBottomColor: "#4900FF", borderBottomWidth: 2, width: "100%", marginTop: 20 }}
                        placeholderStyle={{ fontFamily: font.montserrat }}
                        selectedTextStyle={{ fontFamily: font.montserrat }}
                        inputSearchStyle={{ fontFamily: font.montserrat }}
                        fontFamily={font.montserrat}
                        onChange={(value) => { setNewMembersAllowed(value["value"]) }}
                        onChangeText={(value) => { console.log("Text: ", value) }}
                        labelField="label"
                        valueField="value"
                    />
                    <TouchableOpacity style={(isLoading) ? null : [styles.modalButton, { marginBottom: 10 }]} onPress={async () => {
                        await setCreator(getStringData("username"))
                        setIsLoading(true);

                        axios.post(serverLink + 'api/travel/create', {
                            creator: creator,
                            name: name,
                            description: description,
                            budget: budget,
                            participants: [],
                            visibility: visibility,
                            date: date,
                            new_members_allowed: new_members_allowed
                        })
                            .then(function (response) {
                                if (response.status == 200) {
                                    updatecards(creator)
                                    setIsLoading(false);
                                    setNewTravelVisibility(false);
                                }
                            })
                            .catch(function (error) {
                                console.log(error);
                            });
                    }}>
                        <Text style={(isLoading) ? { display: "none" } : styles.modalButtonText}>Crea il viaggio!</Text>
                    </TouchableOpacity>
                    {isLoading ? <ActivityIndicator size="large" color="#4900FF" /> : null}
                </ScrollView>
            </View>
        </Modal>
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