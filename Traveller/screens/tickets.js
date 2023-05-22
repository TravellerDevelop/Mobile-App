import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, ScrollView, TextInput } from "react-native";
import { color, paddingTopPage, font, serverLink } from "../global/globalVariable";
import TicketsHeader from "../shared/Headers/ticketsHeaders";
import TicketsPreview from "../components/tickets/ticketsPreview";
import axios from "axios";
import { getData } from "../shared/data/localdata";
import { FlatList } from "react-native-gesture-handler";

export default function Tickets() {
    let [data, setData] = useState([]);
    let [personalData, setPersonalData] = useState(null);

    async function takeInfo() {
        personalData = await getData("user");

        axios.get(serverLink + "api/tickets/take?userid=" + personalData._id)
            .then(res => {
                setData(res.data);
                console.log(res.data);
            }).catch(err => {
                console.log(err);
            })
    }

    useEffect(() => {
        takeInfo();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <TicketsHeader update={takeInfo} />
            <View style={{ alignItems: "center", paddingBottom: 100, backgroundColor: "white" }}>
                <TextInput placeholder="Cerca biglietto" style={styles.input}
                    inputStyle={{ fontFamily: font.montserrat }}
                />

                {
                    data.length > 0 ?
                        <FlatList
                            scrollEnabled={false}
                            data={data}
                            renderItem={({ item }) => <TicketsPreview item={item} />}
                        />
                        :
                        <Text style={{ fontFamily: font.montserrat, fontSize: 20, marginTop: 20 }}>Non hai ancora acquistato nessun biglietto</Text>
                }
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingTop: paddingTopPage,
        backgroundColor: color.primary,
    },
    input: {
        width: 300,
        marginTop: 20,
        fontFamily: font.montserrat,
        width: "85%",
        height: 40,
        backgroundColor: "#F5F5F5",
        borderRadius: 10,
        paddingLeft: 10,
        paddingRight: 10,
    },
});
