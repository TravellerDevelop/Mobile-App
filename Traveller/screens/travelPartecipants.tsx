import React, { useState, useEffect } from "react";
import { StyleSheet, View, FlatList, Text, TouchableOpacity, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serverLink } from "../global/globalVariable";
import { ds } from "../global/designSystem";
import { InitialsAvatar, OverscrollBackdrop, SectionLabel, Sheet, StatusBadge } from "../components/ui";
import TravelPartecipantsHeader from "../shared/travelPartecipantsHeader";
import axios from "axios";
import { getData } from "../shared/data/localdata";
import ParticipantsLoading from "../components/loading/ParticipantsLoading";
import { ApiTravelParticipantInfo } from "../shared/types/api";

export default function TravelPartecipants({ navigation, route }: { navigation: any; route: any }) {
    let [isLoadingParticipants, setIsLoadingParticipants] = useState(true);

    let [usersData, setUsersData] = useState<ApiTravelParticipantInfo[]>([]);
    let [myData, setMyData] = useState<any>({});

    let [itscreator, setitscreator] = useState(false);

    async function getUserData() {
        let data = await getData("user");
        setMyData(data);
    }

    let [creator, setCreator] = React.useState<any>({});

    async function update() {
        await getUserData();
        setIsLoadingParticipants(true);
        for (let item of route.params.participants) {
            if (item.creator == true) {
                setCreator(item);
                if (item.userid == myData._id) { setitscreator(true); }
            }
        }

        axios.get<ApiTravelParticipantInfo[]>(serverLink + "api/travel/takeParticipants?travel=" + route.params._id)
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

    // Abbandona il viaggio (o rimuove un partecipante se sei il creatore)
    function leave(userid: string, goHome: boolean) {
        axios.post(serverLink + "api/travel/leave", { userid: userid, travel: route.params._id })
            .then((response) => {
                if (response.status == 200) {
                    if (goHome) navigation.navigate("Home");
                    else update();
                }
            })
            .catch((error) => {
                console.log(error);
            })
    }

    return (
        <View style={styles.screen}>
            <OverscrollBackdrop topColor={ds.colors.brand} bottomColor={ds.colors.surface} />
            <ScrollView style={styles.scroll} contentContainerStyle={{ backgroundColor: ds.colors.brand, flexGrow: 1 }}>
                <TravelPartecipantsHeader navigation={navigation} route={route} />

                <Sheet style={styles.sheet}>
                    <SectionLabel>Descrizione</SectionLabel>
                    <Text style={styles.description}>{route.params.description}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Codice invito</Text>
                            <Text style={styles.statValue}>{route.params.code}</Text>
                        </View>
                        <View style={[styles.statCard, { marginRight: 0 }]}>
                            <Text style={styles.statLabel}>Partecipanti</Text>
                            <Text style={styles.statValue}>
                                {usersData.length == 1
                                    ? usersData.length + " persona"
                                    : usersData.length + " persone"}
                            </Text>
                        </View>
                    </View>

                    <SectionLabel>Partecipanti</SectionLabel>
                    {isLoadingParticipants ? (
                        <ParticipantsLoading />
                    ) : (
                        <FlatList
                            scrollEnabled={false}
                            data={usersData}
                            keyExtractor={(item) => String(item._id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (item._id != myData._id)
                                            navigation.navigate("OtherProfile", { userid: item._id })
                                    }}
                                >
                                    <View style={styles.participantCard}>
                                        <InitialsAvatar
                                            name={item.name + " " + item.surname}
                                            size={40}
                                            style={styles.participantAvatar}
                                        />
                                        <View style={styles.participantText}>
                                            <Text style={styles.participantName} numberOfLines={1}>
                                                {item.name} {item.surname}
                                            </Text>
                                            <Text style={styles.participantUsername} numberOfLines={1}>
                                                @{item.username}
                                            </Text>
                                        </View>

                                        {creator.userid == item._id && (
                                            <StatusBadge label="Creatore" intent="info" />
                                        )}

                                        {itscreator == true && creator.userid != item._id && (
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => leave(item._id, false)}
                                            >
                                                <StatusBadge label="Rimuovi" intent="error" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </Sheet>
            </ScrollView>

            {/* Azione fissa in fondo alla schermata */}
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.leave}
                onPress={() => leave(myData._id, true)}
            >
                <MaterialCommunityIcons name="logout" size={16} color={ds.colors.white} />
                <Text style={styles.leaveText}>Abbandona viaggio</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: ds.colors.surface,
    },
    scroll: {
        flex: 1,
        backgroundColor: "transparent",
    },
    sheet: {
        paddingTop: ds.space[6],
        paddingBottom: 110,
    },
    description: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 13,
        lineHeight: 21,
        color: ds.colors.textBody,
        marginBottom: ds.space[5] + 2,
    },
    statsRow: {
        flexDirection: "row",
        marginBottom: ds.space[7] - 2,
    },
    statCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: ds.colors.borderSubtle,
        borderRadius: ds.radius.l,
        padding: ds.space[4],
        marginRight: ds.space[3] + 2,
    },
    statLabel: {
        fontFamily: ds.fontFamily.medium,
        fontSize: 10,
        color: ds.colors.textSecondary,
        marginBottom: ds.space[2] + 2,
    },
    statValue: {
        fontFamily: ds.fontFamily.metaBold,
        fontSize: 15,
        color: ds.colors.text,
    },
    participantCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: ds.radius.l,
        backgroundColor: ds.colors.surface,
        paddingVertical: ds.space[4],
        paddingHorizontal: ds.space[4],
        marginBottom: ds.space[3] + 2,
        ...ds.shadow.md,
    },
    participantAvatar: {
        ...ds.shadow.md,
    },
    participantText: {
        flex: 1,
        marginLeft: ds.space[3] + 2,
        marginRight: ds.space[3],
    },
    participantName: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.text,
    },
    participantUsername: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 11,
        color: ds.colors.textSecondary,
        marginTop: 1,
    },
    leave: {
        position: "absolute",
        left: ds.layout.screenPadding,
        right: ds.layout.screenPadding,
        bottom: ds.space[6],
        height: 50,
        borderRadius: ds.radius.m,
        backgroundColor: ds.colors.action,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        ...ds.shadow.lg,
    },
    leaveText: {
        color: ds.colors.white,
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        marginLeft: ds.space[3],
    },
});
