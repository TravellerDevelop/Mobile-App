import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, FlatList, Text, TouchableNativeFeedback } from 'react-native';
import { font, serverLink } from '../global/globalVariable';
import HeaderTravelDetail from '../shared/headerTravelDetail';
import TextComponent from '../components/Travel-Componets/textcomponent';
import Vote from '../components/Travel-Componets/vote';
import PaymentComponent from '../components/Travel-Componets/payments';
import NewPost from './Modals/NewPost';
import axios from 'axios';
import LoadingPost from '../shared/loadingPost';

export default function TravelDetail({ navigation, route }) {
    let [newPost, setNewPost] = useState(false);
    let [postLoading, setPostLoading] = useState(true);

    let [postData, setPostData] = useState([]);

    useEffect(() => {
        loadPosts(route.params._id);
    }, [])


    function loadPosts(travelId) {
        axios.get(serverLink + "api/post/take?travel=" + travelId)
            .then(async (response) => {
                if (response.status == 200) {
                    await setPostData(response.data);
                    await setPostLoading(false);
                }
            })
            .catch((error) => {
                console.log(error);
            })
    }

    function onAddData(data) {
        setPostData([...postData, data]);
    }


    return (
        <>
            {newPost ? <NewPost setNewPost={setNewPost} refresh={onAddData} data={route.params} /> : null}
            <View style={styles.container}>
                <ScrollView>
                    <HeaderTravelDetail navigation={navigation} data={route.params} />

                    <View style={{ flex: 1, backgroundColor: "#4900FF" }}>
                        <View style={styles.contentContainer}>
                            <TouchableNativeFeedback
                                onPress={() => setNewPost(true)}
                            >
                                <View style={[styles.cardButton, { marginTop: 30, marginBottom: 0 }]}>
                                    <Text style={[styles.cardButtonText, { fontSize: 18 }]}>+ Aggiungi un nuovo post</Text>
                                </View>
                            </TouchableNativeFeedback>
                            {
                                (postLoading) ?
                                    <View>
                                        <LoadingPost />
                                        <LoadingPost />
                                        <LoadingPost />
                                    </View>
                                    :
                                    (postData.length == 0) ?
                                        < View style={{ flex: 1, justifyContent: "center", alignItems: "center", height: 300 }}>
                                            <Text style={{ color: "#000", fontSize: 16, textAlign: "center", fontFamily: font.montserrat }}>Non ci sono post</Text>
                                        </View>
                                        :
                                        <FlatList
                                            scrollEnabled={false}
                                            style={{ marginTop: 20 }}
                                            data={([...postData].sort((a, b) => a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1))}
                                            renderItem={({ item }) => (
                                                <>
                                                    {(item.type == "text") ?
                                                        <TextComponent item={item} home={false} />
                                                        :
                                                        (item.type == "vote") ?
                                                            <Vote item={item} home={false} />
                                                            :
                                                            (item.type == "payment") ?
                                                                <PaymentComponent item={item} home={false} />
                                                                :
                                                                null}
                                                </>
                                            )}
                                        />
                            }
                        </View>
                    </View>
                    <View style={{ height: 100 }}></View>
                </ScrollView >
            </View >
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    contentContainer: {
        flex: 1,
        backgroundColor: "#FFF",
        borderTopEndRadius: 20,
        borderTopLeftRadius: 20,
        minHeight: 100
    },
    card: {
        backgroundColor: "#FFF",
        borderRadius: 10,
        margin: 10,
        padding: 10,
        elevation: 5,
    },
    contentText: {
        color: "#000",
        fontSize: 16,
        textAlign: "left",
        fontFamily: font.montserrat,
    },
    nameContainer: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: 5,
    },
    nameText: {
        color: "#000",
        fontSize: 16,
        textAlign: "left",
        fontFamily: font.montserrat,
        marginRight: 5,
    },
    datetimeText: {
        color: "#000",
        fontSize: 12,
        fontFamily: font.montserratLight,
        marginBottom: 10,
    },
    rowVote: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
    },
    cardButton: {
        backgroundColor: "#4900FF",
        borderRadius: 10,
        margin: 10,
        padding: 10,
        elevation: 5,
        alignItems: "center",
    },
    cardButtonText: {
        color: "#FFF",
        fontSize: 16,
        textAlign: "center",
        fontFamily: font.montserrat,
    },
    questionText: {
        color: "#000",
        fontSize: 18,
        textAlign: "left",
        fontFamily: font.montserrat,
        marginBottom: 10,
    },
});
