import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { serverLink } from '../global/globalVariable';
import { ds } from '../global/designSystem';
import { EmptyState, InitialsAvatar } from '../components/ui';
import axios from 'axios';
import { getData } from '../shared/data/localdata';
import { ApiFollow, ApiUser } from '../shared/types/api';

export default function Notifications({ navigation, route }: { navigation: any; route: any }) {
    // NOTA: riassegnata più sotto con la response di api/follow/takeFollowersRequest
    // (forma diversa da route.params.notification): tenuta "any" per fedeltà al codice originale.
    let data: any = route.params.notification;

    let [users, setUsers] = React.useState<ApiUser[]>([]);
    let [myInfo, setMyInfo] = React.useState<Partial<ApiUser>>({});

    let aus: string[] = [];

    async function getUserData() {
        let data = await getData("user");
        setMyInfo(data);
        getNotification(data._id);
    }

    function getNotification(myid: string) {
        axios.get<ApiFollow[]>(serverLink + "api/follow/takeFollowersRequest?to=" + myid)
            .then((response) => {
                data = response.data;
                for (let item of data) {
                    aus.push(item.from);
                }

                axios.post<ApiUser[]>(serverLink + "api/user/fromIdToUsernames", { id: aus })
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

    // Accetta o rifiuta la richiesta di follow
    function respond(item: ApiUser, accept: boolean) {
        axios.post(serverLink + "api/follow/" + (accept ? "accept" : "delete"), {
            from: item._id,
            to: myInfo._id,
        })
            .then(() => getNotification(myInfo._id as string))
            .catch((error) => console.log(error));
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={20} color={ds.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifiche</Text>
            </View>

            {users.length == 0 ? (
                <EmptyState
                    icon="bell-outline"
                    title="Nessuna notifica"
                    description="Le richieste dei tuoi amici compariranno qui."
                />
            ) : null}

            <FlatList
                scrollEnabled={false}
                data={users}
                keyExtractor={(item) => String(item._id)}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <InitialsAvatar name={item.name + " " + item.surname} size={34} />
                            <Text style={styles.cardTitle}>
                                @{item.username} ha richiesto di seguirti
                            </Text>
                        </View>

                        <Text style={styles.cardSubtitle}>
                            Accetta la richiesta di {item.name} {item.surname} per aggiungerla ai tuoi viaggi.
                        </Text>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={styles.actionSlot}
                                onPress={() => respond(item, true)}
                            >
                                <View style={styles.accept}>
                                    <Text style={styles.acceptText}>Accetta</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={styles.actionSlot}
                                onPress={() => respond(item, false)}
                            >
                                <View style={styles.reject}>
                                    <Text style={styles.rejectText}>Rifiuta</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ds.colors.surface,
    },
    content: {
        paddingHorizontal: ds.layout.screenPadding,
        paddingTop: 70,
        paddingBottom: ds.layout.contentBottomPadding,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: ds.space[6],
    },
    headerTitle: {
        fontFamily: ds.fontFamily.bold,
        fontSize: 18,
        color: ds.colors.text,
        marginLeft: ds.space[4],
    },
    card: {
        borderWidth: 1,
        borderColor: ds.colors.borderSubtle,
        borderRadius: ds.radius.l,
        backgroundColor: ds.colors.surface,
        padding: ds.space[5],
        marginBottom: ds.space[4],
        ...ds.shadow.md,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: ds.space[3] + 2,
    },
    cardTitle: {
        flex: 1,
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.text,
        marginLeft: ds.space[3] + 2,
    },
    cardSubtitle: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 12,
        lineHeight: 18,
        color: ds.colors.textSecondary,
        marginBottom: ds.space[4] + 2,
    },
    actions: {
        flexDirection: "row",
    },
    actionSlot: {
        flex: 1,
    },
    accept: {
        height: ds.control.sm,
        borderRadius: ds.radius.m,
        backgroundColor: ds.colors.action,
        alignItems: "center",
        justifyContent: "center",
        marginRight: ds.space[3] - 1,
    },
    acceptText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 12,
        color: ds.colors.white,
    },
    reject: {
        height: ds.control.sm,
        borderRadius: ds.radius.m,
        borderWidth: 1,
        borderColor: ds.colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: ds.space[3] - 1,
    },
    rejectText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 12,
        color: ds.colors.errorText,
    },
});
