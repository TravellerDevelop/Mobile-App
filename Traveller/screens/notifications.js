import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { color, font, serverLink } from '../global/globalVariable';
import axios from 'axios';
import { getData } from '../shared/data/localdata';

export default function Notifications({ navigation, route }) {
    let data = route.params.notification;

    let [users, setUsers] = React.useState([]);
    let [myInfo, setMyInfo] = React.useState({});

    let aus = [];

    async function getUserData() {
        let data = await getData("user");
        setMyInfo(data);
        getNotification(data._id);
    }

    function getNotification(myid) {
        axios.get(serverLink + "api/follow/takeFollowersRequest?to=" + myid)
            .then((response) => {
                data = response.data;
                for (let item of data) {
                    aus.push(item.from);
                }

                axios.post(serverLink + "api/user/fromIdToUsernames", { id: aus })
                    .then((response) => {
                        setUsers(response.data);
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            })
            .catch((error) => {
                console.log(error);
            })
    }

    React.useEffect(() => {


        getUserData();

    }, [])

    return (
        <View style={styles.container}>
            <FlatList
                data={users}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>@{item.username} ha richiesto di seguirti</Text>
                        <Text style={styles.cardSubtitle}>Accetta la richiesta di amicizia di {item.name} {item.surname} per poterla aggiungere ai viaggi e condividere contenuti!</Text>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginTop: 20,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    axios.post(serverLink + "api/follow/accept", { from: item._id, to: myInfo._id })
                                        .then((response) => {
                                            getNotification(myInfo._id);
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                        })
                                }}

                                style={{
                                    borderRightWidth: 1,
                                    borderRightColor: "lightgrey",
                                    height: 30,
                                    width: "50%",
                                }}
                            >
                                <View style={{
                                    width: "100%",
                                }}>
                                    <Text
                                        style={styles.buttonText}
                                    >
                                        Accetta
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    axios.post(serverLink + "api/follow/delete", { from: item._id, to: myInfo._id })
                                        .then((response) => {
                                            getNotification(myInfo._id);
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                        })
                                }}

                                style={{
                                    width: "50%",
                                }}
                            >
                                <View
                                    style={{
                                        width: "100%",
                                    }}
                                >
                                    <Text
                                        style={[styles.buttonText, { color: "red" }]}
                                    >
                                        Rifiuta
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    card: {
        backgroundColor: "white",
        width: "90%",
        borderRadius: 10,
        margin: '5%',
        padding: 20,
        paddingBottom: 0,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6,
    },
    cardTitle: {
        color: "#000",
        fontSize: 16,
        textAlign: "left",
        fontFamily: font.montserratBold,
    },
    cardSubtitle: {
        marginTop: 10,
        color: "#000",
        fontSize: 16,
        textAlign: "left",
        fontFamily: font.montserratLight,
    },
    buttonText: {
        color: color.primary,
        fontSize: 16,
        textAlign: "center",
        fontFamily: font.montserratBold,
    },
});