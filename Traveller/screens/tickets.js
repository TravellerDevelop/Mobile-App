import React, { useEffect, useState } from "react";
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import TicketsLoading from "../components/loading/tiketsLoading";
import TicketsPreview from "../components/tickets/ticketsPreview";
import { color, font, paddingTopPage } from "../global/globalVariable";
import takeInfo from "../global/ticketsFunctions";
import TicketsHeader from "../shared/Headers/ticketsHeaders";

export default function Tickets({ navigation }) {
    let [data, setData] = useState([]);
    let [ausTicket, setAusTicket] = useState([]);
    let [extraData, setExtraData] = useState(false);
    let [search, setSearch] = useState("");
    let [personalData, setPersonalData] = useState(null);
    let [isLoading, setIsLoading] = useState(true);

    const extraDataToggle = () => {
        setExtraData(!extraData);
    }

    useEffect(() => {
        takeInfo(personalData, setIsLoading, setData, setAusTicket);
    }, []);

    return (
        <ScrollView style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={false} onRefresh={takeInfo} />}
        >
            <SafeAreaView>
                <TicketsHeader update={takeInfo} />
                <View style={{ alignItems: "center", paddingBottom: 100, backgroundColor: "white", minHeight: Dimensions.get("window").height }}>
                    <TextInput placeholder="Cerca biglietto" style={styles.input}
                        onChangeText={(value) => {
                            setSearch(value);

                            if (value.length) {
                                let aus = data.filter((item) => {
                                    return item.title.toLowerCase().includes(value.toLowerCase());
                                });
                                setAusTicket(aus);
                                extraDataToggle();
                            }
                            else {
                                setAusTicket(data);
                                extraDataToggle();
                            }
                        }}
                        inputStyle={{ fontFamily: font.text }}
                    />
                    {
                        (data.length && !isLoading) ?
                            <FlatList
                                scrollEnabled={false}
                                data={ausTicket}
                                extraData={extraData}
                                renderItem={({ item }) => <TicketsPreview item={item} navigation={navigation} />}
                            />
                            :
                            (isLoading) ?
                                <>
                                    <TicketsLoading />
                                    <TicketsLoading />
                                </>
                                :
                                <Text style={{ fontFamily: font.text, fontSize: 20, marginTop: 20, textAlign: "center", marginLeft: 20, marginRight: 20 }}>Non hai ancora acquistato nessun biglietto</Text>
                    }
                </View>
            </SafeAreaView>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingTop: paddingTopPage,
        backgroundColor: color.primary,
    },
    input: {
        marginBottom: 10,
        width: 300,
        marginTop: 20,
        fontFamily: font.text,
        width: "85%",
        height: 40,
        backgroundColor: "#F5F5F5",
        borderRadius: 10,
        paddingLeft: 10,
        paddingRight: 10,
    },
});
