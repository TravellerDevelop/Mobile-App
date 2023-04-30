import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, FlatList, Text, TouchableNativeFeedback } from 'react-native';
import { font } from '../global/globalVariable';
import HeaderTravelDetail from '../shared/headerTravelDetail';
import TextComponent from '../components/Travel-Componets/textcomponent';
import Vote from '../components/Travel-Componets/vote';
import PaymentComponent from '../components/Travel-Componets/payments';
import NewPost from './Modals/NewPost';

export default function TravelDetail({ navigation, route }) {
    let [testData, setTestData] = useState([
        { type: "text", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ", creator: "Bosso", pinned: true, dateTime: "2020-12-12 12:12:12" },
        { type: "vote", question: "Sta sera cosa si fa?", content: ["Vota 1", "Vota 2", "Vota 3", "Vota 4", "Vota 5"], "votes": [["Bosso"], ["Ciao", "Ok", "Lollo"], [], ["Miao"], []], creator: "Bosso", pinned: false, dateTime: "2020-12-12 12:12:12" },
        { type: "text", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ", creator: "Bosso", pinned: false, dateTime: "2020-12-12 12:12:12" },
        { type: "payment", mode: "pay", to: [], creator: "Bosso", amount: "28.00€", pinned: true, dateTime: "2020-12-12 12:12:12" },
    ])

    let [sortedData, setSortedData] = useState([...testData].sort((a, b) => a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));

    let [newPost, setNewPost] = useState(false);

    return (
        <>
            { newPost ? <NewPost setNewPost={setNewPost} data={route.params} /> : null }
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
                            <FlatList
                                scrollEnabled={false}
                                style={{ marginTop: 20 }}
                                data={sortedData}
                                renderItem={({ item }) => (
                                    (item.type == "text") ?
                                        <TextComponent item={item} />
                                        :
                                        (item.type == "vote") ?
                                            <Vote item={item} />
                                            :
                                            (item.type == "payment") ?
                                                <PaymentComponent item={item} />
                                                :
                                                null
                                )}
                            />
                        </View>
                    </View>
                    <View style={{ height: 100 }}></View>
                </ScrollView>
            </View>
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
