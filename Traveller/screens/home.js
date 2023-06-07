import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView, RefreshControl, TextInput, Dimensions, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native';
import Card from '../shared/card';
import MainHeader from '../components/mainHeader';
import InteractiveCard from '../components/interactiveCard';
import { color, serverLink, font, appVersion } from '../global/globalVariable';
import axios from 'axios';
import { getData, storeJsonData, storeStringData } from '../shared/data/localdata';
import { Avatar } from '@react-native-material/core';

// Componenti
import TextComponent from '../components/Travel-Componets/textcomponent';
import Vote from '../components/Travel-Componets/vote';
import PaymentComponent from '../components/Travel-Componets/payments';
import ImagesComponent from '../components/Travel-Componets/ImagesComponent';

export default function Home({ navigation }) {
    let [joinedTravelsLoading, setJoinedTravelsLoading] = useState(true);
    let [lastPostsLoading, setLastPostsLoading] = useState(true);

    let [lastPosts, setLastPosts] = useState(false);

    let [userData, setUserData] = useState(false);
    let [joinedTravels, setJoinedTravels] = useState(false);

    const [refreshing, setRefreshing] = useState(false);

    const [serchData, setSerchData] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        verifyUserData();

        axios.get(serverLink + "api/takeVersion")
            .then((response) => {
                if (response.status == 200) {
                    if (response.data[0].AppVersion.toString() != appVersion.toString()) {
                        console.log(response.data[0].AppVersion)
                        console.log(appVersion)
                        Alert.alert(
                            "Aggiornamento disponibile",
                            "È disponibile un aggiornamento per l'applicazione (" + response.data[0].AppVersion + ") , vuoi aggiornare?",
                            [
                                {
                                    text: "No",
                                    onPress: () => console.log("Cancel Pressed"),
                                    style: "cancel"
                                },
                                { text: "Si", onPress: () => { Linking.openURL("https://traveller-ttze.onrender.com/") } }
                            ],
                            { cancelable: false }
                        );
                    }
                }
            })
            .catch((error) => {
                console.log(error);
            })

        async function verifyUserData() {
            let data = await getData("user");
            await setUserData(await data);

            if (data != null && data.toString() != '[]' && data.toString() != 'false' && data.toString() != '') {
                storeStringData("username", data.username);
                axios.get(serverLink + "api/user/info?username=" + data.username)
                    .then(async (response) => {
                        await setUserData(response.data)
                        globalData = response.data;
                        await loadJoinedTravels(response.data[0].username, response.data[0]._id)
                        await takePost(response.data[0]._id, response.data[0].username)
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            }
            else {
                storeJsonData("user", '');
                storeStringData('openLogin', "false");
            }
        }
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        let data = await getData("user");
        loadJoinedTravels(data.username, data._id);
        takePost(data._id, data.username);
        setRefreshing(false);
    };

    function loadJoinedTravels(username, userid) {
        axios.get(serverLink + "api/travel/takeJoined?username=" + username + "&userid=" + userid)
            .then(async (response) => {
                if (response.status == 200) {
                    await setJoinedTravels(response.data);
                    await setJoinedTravelsLoading(false);
                }
            })
            .catch((error) => {
                console.log(error);
            })
    }

    function takePost(userid, username) {
        axios.get(serverLink + "api/post/takeLastsByUsername?userid=" + userid + "&username=" + username)
            .then(async (response) => {
                if (response.status == 200) {
                    for (let item of response.data[0]) { item.dateTime = new Date(item.dateTime).toLocaleString("it-IT", { timeZone: "Europe/Andorra" }) }
                    await setLastPosts(response.data);
                    await setLastPostsLoading(false);
                }
            })
            .catch((error) => {
                console.log("Last Post", error);
            })
    }

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <MainHeader navigation={navigation} updateJoinTravels={loadJoinedTravels} refresh={refreshing} />
                <View style={styles.blue}>
                    <View style={styles.content}>
                        <TextInput placeholder="Cerca un account" style={(serchData.length == 0) ? styles.input : styles.inputResult}
                            inputStyle={{ fontFamily: font.montserrat }}
                            onSubmitEditing={(event) => {
                                setSerchData([]);
                                if (event.nativeEvent.text == "" || event.nativeEvent.text.length < 3)
                                    setSerchData([])
                                else {
                                    setSearchLoading(true);
                                    axios.get(serverLink + "api/user/search?username=" + event.nativeEvent.text)
                                        .then((response) => {
                                            if (response.status == 200) {
                                                setSerchData(response.data);
                                                setSearchLoading(false);
                                            }
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                        })
                                }
                            }}

                            onChangeText={(text) => {
                                setSerchData([]);

                                if (text == "" || text.length < 3 || text == null || text == undefined)
                                    setSerchData([])
                                else {
                                    setSearchLoading(true);
                                    axios.get(serverLink + "api/user/search?username=" + text)
                                        .then((response) => {
                                            if (response.status == 200) {
                                                setSerchData(response.data);
                                                setSearchLoading(false);
                                            }
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                        })
                                }
                            }}
                        />

                        {
                            (serchData.length == 0 && !searchLoading) ?
                                null
                                :
                                (!searchLoading && serchData.length > 0) ?
                                    <View style={{ marginBottom: 10, borderBottomRightRadius: 10, borderBottomLeftRadius: 10 }}>
                                        <FlatList
                                            scrollEnabled={false}
                                            data={serchData}
                                            renderItem={({ item }) =>
                                                <>
                                                    {
                                                        (userData[0]._id != item._id) ?
                                                            <TouchableOpacity onPress={() => {
                                                                navigation.navigate("OtherProfile", { userid: item._id })
                                                            }}>
                                                                <View style={styles.usercard}>
                                                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                                        <Avatar autoColor label={item.name + " " + item.surname} labelStyle={{ fontFamily: font.montserrat, fontSize: 18 }} style={{ width: 40, height: 40, borderRadius: 50, marginRight: 10 }} />
                                                                        <View>
                                                                            <Text style={{ fontFamily: font.montserrat, fontSize: 20 }}>{item.name} {item.surname}</Text>
                                                                            <Text style={{ fontFamily: font.montserrat, fontSize: 15 }}>@{item.username}</Text>
                                                                        </View>
                                                                    </View>
                                                                </View>
                                                            </TouchableOpacity>
                                                            :
                                                            null
                                                    }
                                                </>
                                            }
                                        />
                                    </View>
                                    :
                                    (searchLoading) ? <ActivityIndicator size="large" color={color.secondary} />
                                        :
                                        <View style={{ height: 140, alignItems: "center", justifyContent: "center" }} >
                                            <Text style={{ textAlign: "center", fontFamily: "montserrat-light", fontSize: 15 }}>Nessun utente trovato : /</Text>
                                        </View>
                        }

                        <Text style={styles.subtitle}>I tuoi prossimi viaggi:</Text>
                        {
                            (joinedTravelsLoading) && (
                                <View style={{ height: 140, width: "100%", justifyContent: "center", alignItems: "center" }}>
                                    <ActivityIndicator size="large" color={color.secondary} />
                                </View>
                            )
                        }
                        {
                            (joinedTravels != null && joinedTravels.length > 0) ?
                                <FlatList
                                    data={joinedTravels}
                                    horizontal
                                    renderItem={({ item }) => <Card isLoading={joinedTravelsLoading} data={item} navigation={navigation} />}
                                />
                                :
                                null
                        }
                        {
                            (joinedTravels == null || joinedTravels.length == 0) ?
                                // (!joinedTravelsLoading && joinedTravels == null || joinedTravels.length == 0) ?
                                <View style={{ height: 140, alignItems: "center", justifyContent: "center" }} >
                                    <Text style={{ textAlign: "center", fontFamily: "montserrat-light", fontSize: 15 }}>Nessun viaggio trovato : /</Text>
                                </View>
                                :
                                null
                        }
                        <InteractiveCard updatecards={loadJoinedTravels} setUserState={setUserData} userState={userData} />
                        <Text style={styles.subtitle}>Gli ultimi post dai tuoi viaggi:</Text>
                        {
                            (lastPostsLoading) && (
                                <View style={{ height: 140, width: "100%", justifyContent: "center", alignItems: "center" }}>
                                    <ActivityIndicator size="large" color={color.secondary} />
                                </View>
                            )
                        }
                        {
                            (lastPosts != null && lastPosts.length > 0) ?
                                <FlatList
                                    scrollEnabled={false}
                                    data={lastPosts[0]}
                                    renderItem={({ item }) => (
                                        <>
                                            {(item.type == "text") ?
                                                <TextComponent isLoading={lastPostsLoading} home={true} item={item} travel={lastPosts[1][item.travel]} />
                                                :
                                                (item.type == "vote") ?
                                                    <Vote isLoading={lastPostsLoading} item={item} home={true} travel={lastPosts[1][item.travel]} />
                                                    :
                                                    (item.type == "payments") ?
                                                        <PaymentComponent isLoading={lastPostsLoading} item={item} home={true} travel={lastPosts[1][item.travel]} />
                                                        :
                                                        (item.type == "images") && (
                                                            <ImagesComponent isLoading={lastPostsLoading} item={item} home={true} travel={lastPosts[1][item.travel]} />
                                                        )
                                            }
                                        </>
                                    )}
                                />
                                :
                                null
                        }
                        {(lastPosts == null || lastPosts.length == 0) ?
                            <View style={{ height: 140, alignItems: "center", justifyContent: "center" }} >
                                <Text style={{ textAlign: "center", fontFamily: "montserrat-light", fontSize: 15 }}>Nessun post trovato : /</Text>
                            </View>
                            : null
                        }
                    </View>
                    <View style={{ height: 75, backgroundColor: "#FFF", width: "100%" }} />
                </View>
            </ScrollView >
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: color.primary,
    },
    title: {
        fontSize: 30,
        fontWeight: 200,
        marginBottom: 20,
        fontFamily: "montserrat-regular",
        textAlign: "center"
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 200,
        marginBottom: 10,
        textAlign: "left",
        fontFamily: "montserrat-light",
        marginLeft: 10
    },
    blue: {
        backgroundColor: color.secondary,
        height: "100%",
        width: "100%",
    },
    content: {
        backgroundColor: "white",
        borderTopEndRadius: 20,
        borderTopStartRadius: 20,
        paddingTop: 20,
    },
    input: {
        width: Dimensions.get("window").width - 20,
        fontFamily: font.montserrat,
        height: 40,
        backgroundColor: "#F5F5F5",
        marginBottom: 20,
        borderRadius: 10,
        paddingLeft: 10,
        paddingRight: 10,
        marginLeft: 10
    },
    inputResult: {
        width: Dimensions.get("window").width - 20,
        fontFamily: font.montserrat,
        height: 40,
        backgroundColor: "#F5F5F5",
        paddingLeft: 10,
        paddingRight: 10,
        marginLeft: 10,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    usercard: {
        width: Dimensions.get("window").width - 20,
        height: 60,
        backgroundColor: "#F5F5F5",
        paddingLeft: 10,
        paddingRight: 10,
        marginLeft: 10,
        paddingTop: 10,
        borderTopColor: "lightgray",
        borderTopWidth: 1,
    }
});