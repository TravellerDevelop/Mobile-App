import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Image, ActivityIndicator, Button } from 'react-native';
import { color, font, serverLink } from '../../global/globalVariable';
import { FlatList, ScrollView, TextInput } from 'react-native-gesture-handler';
import { Dropdown } from 'react-native-element-dropdown';
import axios from 'axios';
import { getData } from '../../shared/data/localdata';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '@react-native-material/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';


export default function NewTravel({ userState, setUserState, setNewTravelVisibility, updatecards }) {
    let [value, setValue] = React.useState("");
    let [creator, setCreator] = React.useState("");
    let [name, setName] = React.useState("");
    let [description, setDescription] = React.useState("");
    let [budget, setBudget] = React.useState("");
    let [participants, setParticipants] = React.useState([]);
    let [visibility, setVisibility] = React.useState("1");
    let [date, setDate] = React.useState("");
    let [new_members_allowed, setNewMembersAllowed] = React.useState("1");

    let [textValue, setTextValue] = React.useState("");

    let [friendsAdded, setFriendsAdded] = React.useState([]);

    let [friends, setFriends] = React.useState([]);

    let [isLoading, setIsLoading] = React.useState(false);

    let [refresh, setRefresh] = React.useState(false);

    const toggleRefresh = () => {
        setRefresh(!refresh);
    }

    let globalImageInfo = {}


    const [image, setImage] = useState(null);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            base64: true,
            quality: 1,
        });

        // Converte l'immagine in base64
        globalImageInfo = result

        if (!result.canceled) {
            setImage(result);
        }
    };

    const dataVisibility = [
        { label: 'Pubblico', value: '1' },
        { label: 'Amici', value: '2' },
        { label: 'Privato', value: '3' },
    ];

    const newMembers = [
        { label: 'Tutti', value: '1' },
        { label: 'Amici', value: '2' },
        { label: 'Chiuso', value: '0' },
    ];

    async function getUserData() {
        let aus = await getData("user");
        setCreator({ userid: aus._id, username: aus.username, creator: true })

        axios.get(serverLink + "api/follow/takeFollowingsWithInfo?from=" + aus._id)
            .then((response) => {
                if (response.status == 200) {
                    setFriends(response.data);
                }
            })
            .catch((error) => {
                console.log(error);
            })
    }

    React.useEffect(() => {
        setDate(new Date().toISOString().slice(0, 10));
        getUserData();
    }, []);


    return (
        <Modal visible={true} animationType='slide'>

            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", width: "100%" }}>
                <ScrollView style={{ flex: 1, width: "100%" }}>
                    <View style={{ width: "80%", marginLeft: "10%" }}>
                        <TouchableOpacity style={{ position: "absolute", top: 20, right: 0 }} onPress={() => setNewTravelVisibility(false)}>
                            <Text style={{ color: color.primary, fontSize: 18, fontFamily: font.montserrat }}>Annulla</Text>
                        </TouchableOpacity>
                        <Text style={[styles.title, { marginBottom: 30, marginTop: 60 }]}>Crea un nuovo viaggio!</Text>
                        <TextInput placeholderTextColor={"gray"} style={styles.input} placeholder="Nome del viaggio" onChangeText={(value) => { name_(value) }} />
                        <TextInput placeholderTextColor={"gray"} style={styles.inputMultiline} placeholder="Descrizione (facoltativa)" multiline onChangeText={(value) => { description_(value) }} />
                        <TextInput placeholderTextColor={"gray"} style={styles.input} placeholder="Budget (facoltativo)" keyboardType="numeric" onChangeText={(value) => { budget_(parseInt(value)) }} />
                        <TextInput placeholderTextColor={"gray"} style={styles.input} placeholder="Aggiungi amico al viaggio" onChangeText={setTextValue} />
                        <TouchableOpacity
                            onPress={() => {
                                let find = false;

                                for (let item of friendsAdded) {
                                    if (item.username == textValue) {
                                        find = true;
                                    }
                                }

                                if (!find)
                                    for (let item of friends) {
                                        if (item.username == textValue) {
                                            let aus = friendsAdded;
                                            aus.push(item);
                                            setFriendsAdded(aus);
                                            find = true;
                                            toggleRefresh();
                                        }

                                    }

                            }}
                        >
                            <View style={[styles.modalButton, { height: 35, marginTop: 0, borderRadius: 35, width: "50%", marginLeft: "25%" }]}>
                                <Text style={[styles.modalButtonText, { lineHeight: 35, fontSize: 16 }]}>Aggiungi</Text>
                            </View>
                        </TouchableOpacity>
                        <View>
                            <Text style={[styles.cardSubtitle, { color: "black", marginTop: 30 }]}>Persone aggiunte al viaggio:</Text>
                            <View>
                                <FlatList
                                    data={friendsAdded}
                                    scrollEnabled={false}
                                    extraData={refresh}
                                    renderItem={({ item }) => (
                                        <View style={[styles.person, { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#f2f2f2" }]}>
                                            <View
                                                style={{
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: 52,
                                                    height: 52,
                                                    borderRadius: 48 / 2,
                                                    backgroundColor: "#fff",
                                                    overflow: "hidden",
                                                    elevation: 5,
                                                    marginRight: 10,
                                                    borderWidth: 1,
                                                    borderColor: "#f2f2f2",
                                                }}
                                            >
                                                <Avatar size={44} autoColor label={item.name + " " + item.surname} />
                                            </View>
                                            <View>
                                                <Text style={styles.personTextTitle}>{item.name + " " + item.surname}</Text>
                                                <Text style={styles.personText}>@{item.username}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={{ position: "absolute", right: 10 }}
                                                onPress={() => {
                                                    let aus = friendsAdded;
                                                    aus.splice(aus.indexOf(item), 1);
                                                    setFriendsAdded(aus);
                                                    toggleRefresh();
                                                }}>
                                                <MaterialCommunityIcons name="close" size={24} color="black" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.modalButton, { marginTop: 30 }]} onPress={pickImage}>
                            <Text style={[styles.modalButtonText, { fontSize: 16 }]}>Immagine di copertina (facoltativo)</Text>
                        </TouchableOpacity>
                        <View style={{ width: "100%", justifyContent: "center", alignItems: "center" }}>
                            {image ?
                                <Image source={{ uri: image.assets[0].uri }} style={{ width: 200, height: 200 }} />
                                : <Text style={{ fontFamily: font.montserrat }}>Nessun immagine selezionata</Text>}
                        </View>
                        {/* <Text>{(image) ? JSON.stringify(image.assets[0]) : ""}</Text> */}

                        {/* <Text style={[styles.cardSubtitle, { color: "black", marginTop: 30, marginBottom: 10 }]}>Visibilità:</Text>
                    <SegmentedButtons
                        value={visibility}
                        onValueChange={(value) => { setVisibility(value) }}
                        buttons={dataVisibility}
                        >
                        </SegmentedButtons>
                        
                        <Text style={[styles.cardSubtitle, { color: "black", marginTop: 30, marginBottom: 10 }]}>Nuovi membri ammessi:</Text>
                        
                        <SegmentedButtons
                        buttons={newMembers}
                        onValueChange={(value) => { setNewMembersAllowed(value) }}
                        value={new_members_allowed}
                        >
                    </SegmentedButtons> */}

                        <TouchableOpacity style={(isLoading) ? null : [styles.modalButton, { marginBottom: 10 }]} onPress={async () => {
                            // await setCreator(getStringData("username"))
                            let part = [];
                            if (friendsAdded.length != 0) {
                                for (let item of friendsAdded) {
                                    part.push({ userid: item._id, username: item.username, creator: false })
                                }
                            }
                            part.push(creator);
                            setIsLoading(true);
                            if (image) {
                                let fileName = image.assets[0].uri.split("/").pop();

                                axios.post(serverLink + 'api/travel/uploadImage', {
                                    img: image.assets[0].base64,
                                    imgName: fileName
                                })
                                    .then(function (response) {
                                        axios.post(serverLink + 'api/travel/create', {
                                            name: name,
                                            description: description,
                                            budget: budget,
                                            participants: part,
                                            visibility: visibility,
                                            creation_date: new Date(date),
                                            new_members_allowed: new_members_allowed,
                                            code: generateCode(),
                                            image: response.data,
                                            closed: false
                                        })
                                            .then(async function (response) {
                                                let aus = await getData("user");

                                                if (response.status == 200) {
                                                    updatecards(creator.username, aus._id)
                                                    setIsLoading(false);
                                                    setNewTravelVisibility(false);
                                                }
                                            })
                                            .catch(function (error) {
                                                console.log(error);
                                                setIsLoading(false);
                                            });
                                    })
                                    .catch(function (error) {
                                        setIsLoading(false);
                                        console.log(error);
                                    });
                            }
                            else {
                                axios.post(serverLink + 'api/travel/create', {
                                    name: name,
                                    description: description,
                                    budget: budget,
                                    participants: part,
                                    visibility: visibility,
                                    creation_date: new Date(date),
                                    new_members_allowed: new_members_allowed,
                                    code: generateCode(),
                                    closed: false
                                })
                                    .then(async function (response) {
                                        let aus = await getData("user");

                                        if (response.status == 200) {
                                            updatecards(creator.username, aus._id)
                                            setIsLoading(false);
                                            setNewTravelVisibility(false);
                                        }
                                    })
                                    .catch(function (error) {
                                        console.log(error);
                                        setIsLoading(false);
                                    });
                            }

                            function generateCode() {
                                var result = '';
                                var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                                var charactersLength = characters.length;
                                for (var i = 0; i < 5; i++) {
                                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                                }
                                return result;
                            }
                        }}>
                            <Text style={(isLoading) ? { display: "none" } : styles.modalButtonText}>Crea il viaggio!</Text>
                        </TouchableOpacity>
                        {isLoading ? <ActivityIndicator size="large" color="#4900FF" /> : null}
                    </View>
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
        backgroundColor: "white",
        borderRadius: 20,
        padding: 5,
        paddingLeft: 10,
        paddingRight: 10,
        marginRight: 10,
        marginTop: 10,
    },
    personText: {
        color: "#000",
        fontFamily: font.montserrat,
        width: "100%",
        fontSize: 15,
    },
    personTextTitle: {
        color: "#000",
        fontFamily: font.montserrat,
        width: "100%",
        fontSize: 18,
    },
})