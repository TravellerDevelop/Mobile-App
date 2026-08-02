import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ds } from '../global/designSystem';
import { EmptyState, OverscrollBackdrop, Sheet } from '../components/ui';
import BudgetIndicator from '../components/Travel-Componets/BudgetIndicator';
import ImagesComponent from '../components/Travel-Componets/ImagesComponent';
import PaymentComponent from '../components/Travel-Componets/payments';
import TextComponent from '../components/Travel-Componets/textcomponent';
import Vote from '../components/Travel-Componets/vote';
import { serverLink } from '../global/globalVariable';
import { getData } from '../shared/data/localdata';
import HeaderTravelDetail from '../shared/headerTravelDetail';
// import socketService from '../components/utils/socketServise';
import MenuNewPost from '../components/MenuNewPost';
import ToDo from '../components/Travel-Componets/ToDo';
import ItineraryEvent from '../components/Travel-Componets/ItineraryEvent';
import PostLoading from '../components/loading/PostLoading';

// const socket = io('http://192.168.1.127:1337'); // Assicurati di sostituire con il tuo indirizzo IP o dominio

export default function TravelDetail({ navigation, route }: { navigation: any; route: any }) {
    let [personalBudget, setPersonalBudget] = useState(0)
    let [postLoading, setPostLoading] = useState(true);
    let [userData, setUserData] = useState<any>({});
    // NOTA: i post arrivano tipizzati dal server ma vengono rimodellati per la UI
    // (dateTime formattata, source immagini trasformato in {id, source}[]), quindi
    // l'array viene tenuto "any[]" invece di forzare un tipo violato subito dopo.
    let [postData, setPostData] = useState<any[]>([]);
    let username = route.params.username;

    useEffect(() => {
        loadPosts(route.params.data._id);
    }, [])

    const [refreshing, setRefreshing] = useState(false);
    const [spent, setSpent] = useState(0);

    const onRefresh = async () => {
        setPostLoading(true);
        setRefreshing(true);
        loadPosts(route.params.data._id);
        setRefreshing(false);
    };

    async function loadPosts(travelId: string) {
        let aus = await getData("user");
        setUserData(aus);
        setPostData([]);
        axios.get<any[]>(serverLink + "api/post/take?travel=" + travelId)
            .then(async (response) => {
                if (response.status == 200) {
                    let aus = response.data;

                    for (let item of aus) {
                        item.dateTime = new Date(item.dateTime).toLocaleString("it-IT", { timeZone: "Europe/Andorra" })
                        if (item.type == "images") {
                            let i = 0;
                            let aus = [];

                            for (let image of item.source) {
                                aus.push({ id: i, source: image })
                                item.source = aus;
                                i++;
                            }
                        }
                    }

                    setPostData(aus);
                    setPostLoading(false);
                }
            })
            .catch((error) => {
                console.log(error);
            })

        axios.get<string>(serverLink + "api/post/takeTotalPayedByTravel?travel=" + travelId + "&userid=" + aus._id)
            .then(async (response) => {
                if (response.status == 200) {
                    // Il backend restituisce la somma come stringa (sum.toString());
                    // la convertiamo qui per rispettare il tipo numerico atteso da BudgetIndicator.
                    setSpent(Number(response.data));
                }
            })
            .catch((error) => {
                console.log(error);
            })
    }

    function onAddData(data: any) {
        loadPosts(route.params.data._id);
    }

    return (

            <View style={styles.container}>
                <MenuNewPost
                    navigation={navigation}
                    data={route.params.data}
                    onAddData={onAddData}
                />
                <View style={styles.flex}>
                <OverscrollBackdrop topColor={ds.colors.brand} bottomColor={ds.colors.surface} />
                <ScrollView
                    style={styles.flex}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                >
                    <HeaderTravelDetail navigation={navigation} data={route.params.data} />

                    <View style={styles.sheetBackground}>
                        <Sheet style={styles.contentContainer} overlap={-16}>
                            <BudgetIndicator budget={parseFloat(route.params.data.budget)} spent={spent} personalbudget={personalBudget} setPersonalBudget={setPersonalBudget} creator={false} />

                            {
                                (postLoading) && (
                                    <PostLoading />
                                )
                            }

                            {
                                (postData.length > 0 && postData != null && !postLoading) &&
                                <FlatList
                                    scrollEnabled={false}
                                    style={{ marginTop: ds.space[6] }}
                                    data={([...postData].sort((a, b) => a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1))}
                                    renderItem={({ item }) => (
                                        <>
                                            {(item.type == "text") ?
                                                <TextComponent item={item} home={false} loadPosts={loadPosts} username={username} />
                                                :
                                                (item.type == "vote") ?
                                                    <Vote item={item} home={false} loadPosts={loadPosts} username={username} />
                                                    :
                                                    (item.type == "payments") ?
                                                        <PaymentComponent navigation={navigation} item={item} home={false} loadPosts={loadPosts} username={username} />
                                                        :
                                                        (item.type == "images") ?
                                                            <ImagesComponent item={item} home={false} loadPosts={loadPosts} username={username}/>
                                                            :
                                                            (item.type == "todo") ?
                                                                <ToDo data={item} loadPosts={loadPosts} home={false} username={username}/>
                                                                :
                                                                (item.type == "itinerary") &&
                                                                <ItineraryEvent
                                                                    item={item}
                                                                    home={false}
                                                                    loadPosts={loadPosts}
                                                                    username={username}
                                                                    navigation={navigation}
                                                                    travelData={route.params.data}
                                                                />
                                            }
                                        </>
                                    )}
                                />
                            }
                            {
                                ((postData.length == 0 || postData == null) && !postLoading) &&
                                <EmptyState
                                    icon="post-outline"
                                    title="Non ci sono post"
                                    description="Usa il pulsante + per aggiungere il primo post."
                                />
                            }
                        </Sheet>
                    </View>
                    <View style={{ height: 100, backgroundColor: ds.colors.surface }}></View>
                </ScrollView >
                </View>
            </View >

    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ds.colors.surface,
    },
    flex: {
        flex: 1,
    },
    sheetBackground: {
        flex: 1,
        backgroundColor: ds.colors.brand,
    },
    contentContainer: {
        flex: 1,
        paddingBottom: ds.layout.contentBottomPadding,
    },
});
