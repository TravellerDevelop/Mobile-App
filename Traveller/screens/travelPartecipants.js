import { Avatar } from "@react-native-material/core";
import React, { useState, useEffect } from "react";
import { StyleSheet, View, FlatList, Text, TouchableNativeFeedback, Image, ActivityIndicator } from "react-native";
import { color, font, serverLink } from "../global/globalVariable";
import TravelPartecipantsHeader from "../shared/travelPartecipantsHeader";
import axios from "axios";
import { getData } from "../shared/data/localdata";

export default function TravelPartecipants({ navigation, route }) {
    let [isLoadingParticipants, setIsLoadingParticipants] = useState(true);

    let num = route.params.participants.length;
    let [usersData, setUsersData] = useState([]);
    let [myData, setMyData] = useState({});

    let [itscreator, setitscreator] = useState(false);

    async function getUserData() {
        let data = await getData("user");
        await setMyData(data);
    }

    let [creator, setCreator] = React.useState({});

    async function update() {
        await getUserData();
        setIsLoadingParticipants(true);
        for (let item of route.params.participants) {
            if (item.creator == true) {
                setCreator(item);
                if(item.userid == myData._id){ setitscreator(true); }
            }
        }

        axios.get(serverLink + "api/travel/takeParticipants?travel=" + route.params.code)
            .then((response) => {
                if (response.status == 200) {
                    setUsersData(response.data);
                    setIsLoadingParticipants(false);
                }
            })
            .catch((error) => {
                console.log(error);
            })

    }

    useEffect(() => {
        update();
    }, [])

    return (
        <View style={{ flex: 1 }}>
            <TravelPartecipantsHeader navigation={navigation} route={route} />
            <View style={styles.container}>
                <Text style={styles.subtext}>Descrizione:</Text>
                <Text style={styles.description} >{route.params.description}</Text>
                <Text style={styles.subtext}>Codice di invito: {route.params.code}</Text>
                <Text style={styles.subtext}>{(usersData.length == 1) ? usersData.length + " partecipante" : usersData.length + " partecipanti"}</Text>
                <FlatList
                    data={usersData}
                    renderItem={({ item }) => (
                        <TouchableNativeFeedback
                            onPress={() => {
                                if (item._id != myData._id)
                                    navigation.navigate("OtherProfile", { userid: item._id })
                            }}
                        >
                            <View style={styles.avatarContainer}>
                                <View style={styles.borderAvatarContainer}>
                                    <Avatar autoColor size={40} label={item.name + " " + item.surname} />
                                </View>
                                <View>
                                    <Text style={styles.text}>{item.name} {item.surname}</Text>
                                    <Text style={[styles.subtext, { marginBottom: 0, marginTop: 0, marginLeft: 10 }]}>@{item.username}</Text>
                                </View>
                                {
                                    (creator.userid == item._id) &&
                                    (
                                        <View style={styles.flag}>
                                            <Text style={styles.flagText}>Creatore</Text>
                                        </View>
                                    )
                                }
                                {
                                    (itscreator == true && creator.userid != item._id) &&
                                    (
                                        <TouchableNativeFeedback
                                            onPress={() => {
                                                axios.post(serverLink + "api/travel/leave", { userid: item._id, travel: route.params._id })
                                                    .then((response) => {
                                                        if (response.status == 200) {
                                                            update();
                                                        }
                                                    })
                                                    .catch((error) => {
                                                        console.log(error);
                                                    })
                                            }}
                                        >
                                            <View style={styles.flagRemove}>
                                                <Text style={styles.flagText}>Rimuovi</Text>
                                            </View>
                                        </TouchableNativeFeedback>
                                    )
                                }
                            </View>
                        </TouchableNativeFeedback>
                    )}
                />
                {
                    (isLoadingParticipants) &&
                    (
                        <View style={{ justifyContent: "center", alignItems: "center" }}>
                            <ActivityIndicator size="large" color={color.primary} />
                        </View>
                    )
                }
            </View>
            <TouchableNativeFeedback
                onPress={
                    () => {
                        axios.post(serverLink + "api/travel/leave", { userid: myData._id, travel: route.params._id })
                            .then((response) => {
                                if (response.status == 200) {
                                    navigation.navigate("Home");
                                }
                            })
                            .catch((error) => {
                                console.log(error);
                            })
                    }
                }
            >
                <View style={styles.leave}>
                    <Image source={require("../assets/image/icona-logout-white.png")} style={{ width: 30, height: 30, marginRight: 10 }} />
                    <Text style={styles.leaveText}>Abbandona viaggio</Text>
                </View>
            </TouchableNativeFeedback>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        paddingBottom: 100
    },
    title: {
        fontSize: 30,
        fontFamily: font.text,
        textAlign: "center",
        marginTop: 10,
        marginBottom: 10,
    },
    avatarContainer: {
        marginLeft: 20,
        marginRight: 20,
        paddingBottom: 10,
        paddingTop: 10,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    borderAvatarContainer: {
        backgroundColor: "white",
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        height: 40,
        width: 40,
        marginRight: -15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginRight: 10,
    },
    text: {
        marginLeft: 10,
        fontSize: 20,
        fontFamily: font.text_bold,
    },
    description: {
        marginLeft: 20,
        fontSize: 18,
        fontFamily: font.text,
    },
    subtext: {
        fontSize: 15,
        fontFamily: font.text_light,
        marginLeft: 20,
        marginTop: 10,
        marginBottom: 10,
    },
    leave: {
        backgroundColor: color.primary,
        height: 50,
        width: "90%",
        position: "absolute",
        bottom: 100,
        left: "5%",
        borderRadius: 10,
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
        flexDirection: "row",
    },
    leaveText: {
        color: "white",
        fontFamily: font.text,
        fontSize: 20,
    },
    flag: {
        backgroundColor: "#4900FF",
        height: 25,
        padding: 5,
        paddingLeft: 10,
        position: "absolute",
        bottom: 5,
        right: 0,
        borderTopLeftRadius: 12.5,
        borderBottomLeftRadius: 12.5,
        alignItems: "center",
    },
    flagText: {
        color: "white",
        fontFamily: font.text_bold,
        fontSize: 13,
    },
    flagRemove: {
        backgroundColor: "#FF0000",
        height: 25,
        padding: 5,
        paddingLeft: 10,
        paddingRight: 10,
        position: "absolute",
        bottom: 5,
        right: 0,
        borderRadius: 12.5,
    },
});