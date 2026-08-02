import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serverLink } from "../global/globalVariable";
import { ds } from "../global/designSystem";
import { EmptyState, OverscrollBackdrop, SearchField, Sheet } from "../components/ui";
import { getData } from "../shared/data/localdata";
import axios from "axios";
import Card from "../shared/card";
import { ApiJoinedTravel } from "../shared/types/api";

export default function Travels({ navigation }: { navigation: any }) {
    let [myTravel, setMyTravel] = useState<ApiJoinedTravel[]>([]);
    let [username, setUsername] = useState("");
    let [search, setSearch] = useState("");

    useEffect(() => {
        async function test() {
            let userData = await getData("user");
            setUsername(userData.username);

            axios.get<ApiJoinedTravel[]>(serverLink + "api/travel/takeJoined?username=" + userData.username + "&userid=" + userData._id)
                .then(res => {
                    if (res.status == 200)
                        setMyTravel(res.data);
                })
                .catch(err => {
                    console.log(err);
                })
        }

        test();
    }, []);

    const filtered = myTravel.filter((item) =>
        search.length == 0
            ? true
            : String(item.name).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.flex}>
            <OverscrollBackdrop topColor={ds.colors.brand} />
            <ScrollView
                style={styles.screen}
                contentContainerStyle={{ backgroundColor: ds.colors.brand, flexGrow: 1 }}
            >
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={20} color={ds.colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.title}>I miei viaggi</Text>
                </View>

                <Sheet style={styles.sheet}>
                    <SearchField
                        placeholder="Cerca un viaggio"
                        style={styles.search}
                        onChangeText={setSearch}
                    />

                    {filtered.length > 0 ? (
                        <View style={styles.grid}>
                            {filtered.map((item) => (
                                <View key={String(item._id)} style={styles.cell}>
                                    <Card
                                        grid={true}
                                        data={item}
                                        navigation={navigation}
                                        username={username}
                                    />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <EmptyState
                            icon="airplane-off"
                            title="Nessun viaggio trovato"
                            description="Crea un viaggio o unisciti con un codice invito."
                        />
                    )}
                </Sheet>
            </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    screen: {
        backgroundColor: "transparent",
    },
    container: {
        flex: 1,
        backgroundColor: ds.colors.brand,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: ds.colors.brand,
        paddingHorizontal: ds.layout.headerPaddingH,
        paddingTop: 66,
        paddingBottom: 34,
    },
    title: {
        fontFamily: ds.fontFamily.bold,
        fontSize: 19,
        color: ds.colors.white,
        marginLeft: ds.space[4],
    },
    sheet: {
        paddingBottom: ds.layout.contentBottomPadding,
    },
    search: {
        marginBottom: ds.space[5] + 2,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    cell: {
        width: "48.5%",
        marginBottom: ds.space[3] + 2,
    },
});
