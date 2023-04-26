import React, { useEffect, useContext, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView } from 'react-native';
import Card from '../shared/card';
import MainHeader from '../components/mainHeader';
import InteractiveCard from '../components/interactiveCard';
import { color, serverLink, userInfo } from '../global/globalVariable';
import axios from 'axios';
import { getData, getStringDataWithState, storeJsonData } from '../shared/data/localdata';
import { UserInfoStateProvider, UserInfo } from '../global/globalStates';
import { createIconSetFromFontello } from '@expo/vector-icons';

export default function Home({ navigation }) {
    let [userData, setUserData] = useState(false);

    let globalData = null;

    useEffect(() => {
        verifyUserData();

        async function verifyUserData() {
            let data = await getData("user");
            await getStringDataWithState("user", userData, setUserData);


            if (data != null && data.toString() != '[]' && data.toString() != 'false' && data.toString() != '') {
                axios.get(serverLink + "api/user/info?username=" + data.username)
                    .then(async (response) => {
                        await storeJsonData("user", response.data);
                        await setUserData(response.data)

                        globalData = response.data;


                        console.log("----------")
                        console.log("Response data:")
                        console.log(response.data.travels)

                        console.log("----------")
                        console.log("User data:")
                        console.log(userData[0])
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


    return (
        <View style={styles.container}>
            <ScrollView>
                <MainHeader navigation={navigation} />
                <View style={styles.blue}>
                    <View style={styles.content}>
                        <Text style={styles.title}>Home</Text>

                        <Text style={styles.subtitle}>I tuoi ultimi viaggi:</Text>
                        {(userData.travels != null && userData.travels.length > 0) ?
                            <FlatList
                                data={userData.travels}
                                horizontal
                                renderItem={({ item }) => <Card data={item} navigation={navigation} />}
                            />
                            :
                            <View style={{ height: 140, alignItems: "center", justifyContent: "center" }} >
                                <Text style={{ textAlign: "center", fontFamily: "montserrat-light", fontSize: 15 }}>Nessun viaggio trovato : /</Text>
                            </View>
                        }
                        <InteractiveCard />
                        <Text style={styles.subtitle}>I viaggi dei tuoi amici</Text>
                        <View style={{ height: 140, alignItems: "center", justifyContent: "center" }} >
                            <Text style={{ textAlign: "center", fontFamily: "montserrat-light", fontSize: 15 }}>Nessun viaggio trovato : /</Text>
                        </View>
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
