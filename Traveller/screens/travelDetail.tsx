import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ds } from '../global/designSystem';
import { EmptyState, FeedGroup, OverscrollBackdrop, Sheet } from '../components/ui';
import BudgetIndicator from '../components/Travel-Componets/BudgetIndicator';
import ImagesComponent from '../components/Travel-Componets/ImagesComponent';
import PaymentComponent from '../components/Travel-Componets/payments';
import TextComponent from '../components/Travel-Componets/textcomponent';
import Vote from '../components/Travel-Componets/vote';
import { serverLink } from '../global/globalVariable';
import { getData } from '../shared/data/localdata';
import { apiGet, apiSend, isOfflineError } from '../shared/data/apiClient';
import { cacheKeys } from '../shared/data/offlineCache';
import { shapePost, shapePosts } from '../shared/data/postShape';
import { useOnReconnect } from '../global/networkContext';
import HeaderTravelDetail from '../shared/headerTravelDetail';
import { useTravelRealtime } from '../components/realtime';
import MenuNewPost from '../components/MenuNewPost';
import ToDo from '../components/Travel-Componets/ToDo';
import ItineraryEvent from '../components/Travel-Componets/ItineraryEvent';
import PostLoading from '../components/loading/PostLoading';

export default function TravelDetail({ navigation, route }: { navigation: any; route: any }) {
    /* Il budget personale è persistito sul partecipante (vedi
       api/travel/setPersonalBudget): qui si parte dal valore che arriva
       con il viaggio, così non sparisce a ogni rimontaggio della schermata. */
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
        markSeen(route.params.data._id);
    }, [])

    useOnReconnect(() => {
        loadPosts(route.params.data._id);
    });

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

        // Budget personale salvato sull'elemento "participants" dell'utente.
        const me = route.params.data?.participants?.find(
            (participant: any) => String(participant.userid) === String(aus?._id)
        );
        setPersonalBudget(Number(me?.personalBudget) || 0);

        /* Niente setPostData([]) qui: svuotare la lista prima di sapere se
           la richiesta andrà a buon fine faceva sparire il feed a ogni
           refresh fallito. Ora i post restano finché non arriva la nuova
           versione (dal server o dalla cache). */
        try {
            const { data } = await apiGet<any[]>(
                serverLink + "api/post/take?travel=" + travelId,
                { cacheKey: cacheKeys.travelPosts(travelId), transform: shapePosts }
            );
            setPostData(data);
        } catch (error) {
            if (!isOfflineError(error)) console.log(error);
        } finally {
            setPostLoading(false);
        }

        if (!aus?._id) return;

        try {
            const { data } = await apiGet<string>(
                serverLink + "api/post/takeTotalPayedByTravel?travel=" + travelId + "&userid=" + aus._id,
                { cacheKey: cacheKeys.travelSpent(travelId, aus._id) }
            );
            // Il backend restituisce la somma come stringa (sum.toString());
            // la convertiamo qui per rispettare il tipo numerico atteso da BudgetIndicator.
            setSpent(Number(data));
        } catch (error) {
            if (!isOfflineError(error)) console.log(error);
        }
    }

    function onAddData(data: any) {
        loadPosts(route.params.data._id);
    }

    /**
     * Azzera il badge "non letti" della card di questo viaggio in home.
     * Fire-and-forget e non in coda offline (vedi CLAUDE.md, "cosa è
     * deliberatamente non in coda"): un "letto" arrivato tardi non ha senso,
     * e se fallisce il badge resta semplicemente com'era.
     */
    async function markSeen(travelId: string) {
        const aus = await getData("user");
        if (!aus?._id) return;

        try {
            await apiSend(serverLink + "api/travel/markSeen", { travelid: travelId, userid: aus._id });
        } catch (error) {
            if (!isOfflineError(error)) console.log(error);
        }
    }

    /* ---------------------------------------------------------------
       Realtime

       Una modifica fatta da un altro partecipante arriva qui invece che
       al prossimo pull-to-refresh. Due strategie diverse a seconda di
       quanto costa avere torto:

       - post nuovo o eliminato: si applica direttamente alla lista, il
         payload basta e un roundtrip in più si vedrebbe come un salto;
       - tutto il resto (voti, quote, to-do, pin, itinerario): si
         ricarica dal server, perché il payload dice solo *cosa* è
         cambiato e ricostruire lo stato a mano porterebbe due
         dispositivi a divergere.

       Le ricariche sono accorpate: una spunta rapida su una lista
       to-do condivisa genera una raffica di eventi, e senza questo
       ognuno sarebbe una richiesta.
       --------------------------------------------------------------- */
    const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleReload = useCallback(() => {
        if (reloadTimer.current) clearTimeout(reloadTimer.current);
        reloadTimer.current = setTimeout(() => {
            reloadTimer.current = null;
            loadPosts(route.params.data._id);
        }, 400);
    }, [route.params.data._id]);

    useEffect(() => () => {
        if (reloadTimer.current) clearTimeout(reloadTimer.current);
    }, []);

    useTravelRealtime(
        route.params.data._id,
        {
            onPostNew: ({ post }) => {
                if (!post) {
                    scheduleReload();
                    return;
                }
                const shaped = shapePost(post);
                setPostData((current) =>
                    // Guardia contro il doppione: l'evento può incrociarsi
                    // con una loadPosts già in volo che ha visto lo stesso post.
                    current.some((item) => item._id === shaped._id)
                        ? current
                        : [shaped, ...current]
                );
            },
            onPostDeleted: ({ postId }) => {
                setPostData((current) => current.filter((item) => item._id !== postId));
            },
            onPostUpdated: scheduleReload,
            onItineraryChanged: scheduleReload,
        },
        { currentUserId: userData?._id }
    );

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
                            <BudgetIndicator
                                budget={parseFloat(route.params.data.budget)}
                                spent={spent}
                                personalbudget={personalBudget}
                                setPersonalBudget={setPersonalBudget}
                                creator={false}
                                travelId={route.params.data._id}
                                userId={userData?._id}
                            />

                            {
                                (postLoading) && (
                                    <PostLoading />
                                )
                            }

                            {
                                (postData.length > 0 && postData != null && !postLoading) &&
                                <FeedGroup style={styles.feedGroup}>
                                    <FlatList
                                        scrollEnabled={false}
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
                                </FeedGroup>
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
    feedGroup: {
        marginTop: ds.space[6],
    },
});
