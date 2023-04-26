import React, { useEffect, useContext, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView } from 'react-native';
import Card from '../shared/card';
import MainHeader from '../components/mainHeader';
import InteractiveCard from '../components/interactiveCard';
import { color, serverLink, userInfo } from '../global/globalVariable';
import axios from 'axios';
import { getData, getStringDataWithState, storeJsonData } from '../shared/data/localdata';
import { UserInfoStateProvider, UserInfo } from '../global/globalStates';

export default function Home({ navigation }) {
    let [userData, setUserData] = useState(false);

    // let [a, setA] = useContext(UserInfo);


    
    useEffect(() => {
        verifyUserData();
    }, []);
    
    let verifyUserData = async () => {
        let data = await getData("user");
        await getStringDataWithState("user", userData, setUserData);

        console.log(data)

        if (data != null && data.toString() != '[]' && data.toString() != 'false' && data.toString() != '') {
            axios.get(serverLink + "api/user/info?username=" + data.username)
                .then(async (response) => {
                    await storeJsonData("user", response.data);
                })
                .catch((error) => {
                    console.log(error);
                })
        }
        else{
            storeJsonData("user", '');
        }
    }



    return (
        <View style={styles.container}>
            <ScrollView>
                <MainHeader navigation={navigation} />
                <View style={styles.blue}>
                    <View style={styles.content}>
                        <Text style={styles.title}>Home</Text>

                        <Text style={styles.subtitle}>I tuoi ultimi viaggi:</Text>
                        <FlatList
                            data={[
                                {
                                    key: 'Muzaffarabad', creator: "Marco Montemagno", participants: [
                                        "Marco Montemagno",
                                        "Domenico Pizzetti",
                                        "Micheletto Trentini",
                                        "Nanni Pininfarina",
                                        "Gelsomina Cuda",
                                        "Olga Barcaccia",
                                        "Marco Montemagno",
                                        "Domenico Pizzetti",
                                        "Micheletto Trentini",
                                        "Nanni Pininfarina",
                                        "Gelsomina Cuda",
                                        "Olga Barcaccia"
                                    ]
                                },
                                {
                                    key: 'Moriago della Battaglia', creator: "Danny Lazzarin", participants: [
                                        "Danny Lazzarin",
                                        "Gian Comeriato",
                                        "Annetta Tomasini"
                                    ]
                                },
                                {
                                    key: 'Oropesa', creator: "Angelo Greco", participants: [
                                        "Angelo Greco",
                                        "Gianluca Pizzolante",
                                        "Alfio Bernardi",
                                        "Elio Cuda",
                                    ]
                                },
                                {
                                    key: 'Rosedale', creator: "Marcello Ascani", participants: [
                                        "Marcello Ascani",
                                        "Gianfranco Bernabei",
                                        "Corrado Cattaneo",
                                        "Renato Bocchetti",
                                        "Ernesto Cuda",
                                        "Gelsomina Sforza",
                                        "Serena Bellini",
                                    ]
                                },
                                {
                                    key: 'Pakusari', creator: "Marco Silvestro",
                                    participants: [
                                        "Marco Silvestro",
                                    ]
                                },
                                {
                                    key: 'Ascheberg', creator: "Emily Pallini",
                                    participants: [
                                        "Emily Pallini",
                                        "Gianluca Suda",
                                    ]
                                },
                                {
                                    key: 'Brockhampton', creator: "Emilio Fibonacci",
                                    participants: [
                                        "Emilio Fibonacci",
                                        "Ernesto Manolesto",
                                        "Arresto Cuda",
                                        "Pericle Minutolo",
                                        "Eleonora pudra",
                                    ]
                                },
                                { key: 'Gursu', creator: "Pietro Bossolasco", participants: ["Pietro Bossolasco"] },
                            ]}
                            horizontal
                            renderItem={({ item }) => <Card data={item} navigation={navigation} />}
                        />

                        <InteractiveCard />

                        <Text style={styles.subtitle}>Horizontal FlatList</Text>
                        {/* <FlatList
                            data={[
                                { key: 'Devin' },
                                { key: 'Dan' },
                                { key: 'Dominic' },
                                { key: 'Jackson' },
                                { key: 'James' },
                                { key: 'Joel' },
                                { key: 'John' },
                                { key: 'Jillian' },
                            ]}
                            horizontal
                            renderItem={({ item }) => <Card data={item} />}
                        /> */}
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
