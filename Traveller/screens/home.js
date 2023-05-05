import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView } from 'react-native';
import Card from '../shared/card';
import MainHeader from '../components/mainHeader';
import InteractiveCard from '../components/interactiveCard';
import { color, serverLink } from '../global/globalVariable';
import axios from 'axios';
import { getData, getStringDataWithState, storeJsonData, storeStringData } from '../shared/data/localdata';

export default function Home({ navigation }) {
    let [userData, setUserData] = useState(false);
    let [travels, setTravels] = useState(false);
    let [joinedTravels, setJoinedTravels] = useState(false);

    let globalData = null;

    useEffect(() => {
        verifyUserData();

        async function verifyUserData() {
            let data = await getData("user");
            await getStringDataWithState("user", userData, setUserData);


            if (data != null && data.toString() != '[]' && data.toString() != 'false' && data.toString() != '') {
                storeStringData("username", data.username);
                axios.get(serverLink + "api/user/info?username=" + data.username)
                    .then(async (response) => {
                        await setUserData(response.data)
                        globalData = response.data;
                        loadTravels(response.data[0].username);
                        loadJoinedTravels(response.data[0].username, response.data[0]._id)
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            }
            else {
                storeJsonData("user", '');
            }
        }
    }, []);


    function loadTravels(username) {
        axios.get(serverLink + "api/user/travels?username=" + username)
            .then(async (response) => {
                if (response.status == 200) {
                    await setTravels(response.data);
                }
            })
            .catch((error) => {
                console.log(error);
            })
    }

    loadJoinedTravels = (username, userid) => {
        console.log("Loading joined travels   " + username + "   " + userid)
        axios.get(serverLink + "api/travel/takeJoined?username=" + username + "&userid=" + userid)
            .then(async (response) => {
                if (response.status == 200) {
                    await setJoinedTravels(response.data);
                }
            })
            .catch((error) => {
                console.log(error);
            })
    }

    return (
        <View style={styles.container}>
            <ScrollView>
                <MainHeader navigation={navigation} updateJoinTravels={loadTravels} />
                <View style={styles.blue}>
                    <View style={styles.content}>
                        <Text style={styles.title}>Home</Text>

                        <Text style={styles.subtitle}>I tuoi ultimi viaggi:</Text>
                        {(travels != null && travels.length > 0) ?
                            <FlatList
                                data={travels}
                                horizontal
                                renderItem={({ item }) => <Card data={item} navigation={navigation} />}
                            />
                            :
                            <View style={{ height: 140, alignItems: "center", justifyContent: "center" }} >
                                <Text style={{ textAlign: "center", fontFamily: "montserrat-light", fontSize: 15 }}>Nessun viaggio trovato : /</Text>
                            </View>
                        }
                        <InteractiveCard updatecards={loadTravels} setUserState={setUserData} userState={userData} />
                        <Text style={styles.subtitle}>I viaggi in cui sei stato invitato</Text>
                        {(joinedTravels != null && joinedTravels.length > 0) ?
                            <FlatList
                                data={joinedTravels}
                                horizontal
                                renderItem={({ item }) => <Card data={item} navigation={navigation} />}
                            />
                            :
                            <View style={{ height: 140, alignItems: "center", justifyContent: "center" }} >
                                <Text style={{ textAlign: "center", fontFamily: "montserrat-light", fontSize: 15 }}>Nessun viaggio trovato : /</Text>
                            </View>
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
    }
});