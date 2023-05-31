import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableNativeFeedback, Image, StyleSheet, Modal, TouchableWithoutFeedback, TouchableOpacity, Dimensions } from 'react-native';
import { RadioButton, ProgressBar } from 'react-native-paper';
import { ComponentStyles } from './componentStyle';
import { color, serverLink } from '../../global/globalVariable';
import { getData } from '../../shared/data/localdata';
import { font } from '../../global/globalVariable';
import { Badge } from '@react-native-material/core';
import axios from 'axios';

let percent = {}
let ausItem;
let totalVotes;
let username = "";


export default function Vote({ item, home, travel, loadPosts, isLoading }) {
    let [checkDisabled, setCheckDisabled] = React.useState(false);
    let [numVote, setNumVote] = React.useState({});

    let [showMenu, setShowMenu] = React.useState(false);
    let [userData, setUserData] = React.useState(false);

    ausItem = item;

    async function getUserData() {
        setUserData(await getData("user"));
    }

    useEffect(() => {
        const test = async () => {
            getUserData();
            let aus = await getData("user")
            username = aus.username
            ausItem = item;

            let i = 0

            for (item of ausItem.votes) {
                for (aus of item) {
                    if (aus == username) {
                        setChecked(ausItem.content[i])
                        setCheckDisabled(true)
                    }
                }

                i++
            }

            let a = {};
            for (let i = 0; i < ausItem.content.length; i++) {
                a[ausItem.content[i]] = ausItem.votes[i].length;
            }

            setNumVote(a);

            return aus;
        }

        test();


    }, []);


    let [checked, setChecked] = React.useState("");

    if (percent[item.content[0]] == undefined) {
        ausItem = item;

        totalVotes = 0;

        for (let aus of ausItem.votes) {
            totalVotes += aus.length;
        }
        let i = 0

        for (let aus of ausItem.votes) {
            percent[ausItem.content[i]] = (aus.length / totalVotes)
            if (isNaN(percent[ausItem.content[i]])) {
                percent[ausItem.content[i]] = 0;
            }
            i++
        }
    }

    return (
        <View style={(!isLoading) ? ComponentStyles.card : {display: "none"}}>

            <Modal transparent visible={showMenu} animationType='slide' >
                <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}>
                        <View style={ComponentStyles.editContent}>
                            <TouchableOpacity
                                onPress={() => {
                                    item.pinned = !item.pinned;

                                    axios.post(serverLink + "api/post/updatePinPost", { param: item })
                                        .then((response) => {
                                            setShowMenu(false);
                                            loadPosts(item.travel)
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                        })
                                }}>
                                <View
                                    style={{ borderBottomWidth: 1, borderBottomColor: "lightgray", paddingBottom: 10, flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }}
                                >
                                    <Image source={require("../../assets/image/pin.png")} style={{ width: 22, height: 22, tintColor: "lightgray", marginRight: 10 }} />
                                    {
                                        (item.pinned) ?
                                            <Text style={{ fontFamily: font.montserrat, fontSize: 20 }}>Rimuovi pin</Text>
                                            :
                                            <Text style={{ fontFamily: font.montserrat, fontSize: 20 }}>Aggiungi pin</Text>
                                    }
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    axios.post(serverLink + "api/post/deletePost", { id: item._id })
                                        .then((response) => {
                                            setShowMenu(false);
                                            loadPosts(item.travel)
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                        })
                                }}>

                                <View
                                    style={{ paddingTop: 10, flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }}
                                >
                                    <Image source={require("../../assets/image/icona-cestino.png")} style={{ width: 22, height: 22, tintColor: "red", marginRight: 10 }} />
                                    <Text style={{ fontFamily: font.montserrat, fontSize: 20, color: "red" }}>Elimina post</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {
                ((item.creator == userData.username) && !home) ?
                    <View
                        style={{ position: "absolute", top: 0, right: 0, zIndex: 99 }}
                    >
                        <TouchableOpacity
                            style={{ position: "absolute", top: 5, right: 5, zIndex: 100 }}
                            onPress={() => {
                                showMenu ? setShowMenu(false) : setShowMenu(true);
                            }}>
                            <Image source={require("../../assets/image/icona-more-cerchio.png")} style={{ width: 20, height: 20, tintColor: "lightgray" }} />
                        </TouchableOpacity>
                    </View>
                    : null

            }

            {(item.pinned && !home) ?
                <View style={ComponentStyles.pinned}>
                    <Image source={require("../../assets/image/pin.png")} style={{ width: 20, height: 20, marginRight: 5, tintColor: "lightgray" }} />
                    <Text style={ComponentStyles.pinnedText}>Fissato in alto</Text>
                </View>
                : null
            }

            {(home) ?
                <Badge label={travel} style={ComponentStyles.Badge} labelStyle={ComponentStyles.BadgeText} />
                : null
            }
            <View style={ComponentStyles.headerContainer}>
                <View style={ComponentStyles.nameContainer}>
                    <Text style={ComponentStyles.nameText}>@{item.creator}</Text>
                </View>
                <Text style={ComponentStyles.datetimeText} >{item.dateTime}</Text>
            </View>
            <Text style={ComponentStyles.questionText} >{item.question}</Text>
            <FlatList
                data={item.content}
                scrollEnabled={false}
                renderItem={
                    ({ item }) => (
                        <View style={ComponentStyles.voteContent}>
                            <Text style={ComponentStyles.contentText} >{item}</Text>
                            <View style={ComponentStyles.rowVote}>
                                <RadioButton
                                    disabled={checkDisabled}
                                    value={item}
                                    color={color.secondary}
                                    status={checked === item ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        if (checked != "") {
                                            let i = 0;

                                            while (checked != ausItem.content[i]) {
                                                i++;
                                            }

                                            percent[ausItem.content[i]] = ((ausItem.votes[i].length) / (totalVotes));

                                            if (isNaN(percent[ausItem.content[i]])) {
                                                percent[ausItem.content[i]] = 0;
                                            }
                                        }
                                        setChecked(item);
                                        let i = 0;

                                        while (item != ausItem.content[i]) {
                                            i++;
                                        }

                                        percent[ausItem.content[i]] = ((ausItem.votes[i].length + 1) / (totalVotes + 1));
                                    }}
                                />
                                <ProgressBar progress={percent[item]} color={"#4900FF"} style={{ width: 250, height: 10, borderRadius: 10 }} />
                                <Text style={styles.numVote}>{numVote[item]}</Text>
                            </View>
                        </View>
                    )
                }
            />

            <TouchableNativeFeedback
                onPress={() => {
                    if (checked != "" && !checkDisabled) {
                        let aus = item.votes;

                        let i = 0;

                        while (checked != ausItem.content[i]) {
                            i++;
                        }

                        aus[i].push(username);

                        axios.post(serverLink + "api/post/updateVote", { id: item._id, vote: aus })
                            .then((res) => {
                                setCheckDisabled(true);
                            })
                            .catch((err) => {
                                console.log(err);
                            })
                    }
                }}
            >
                {
                    (checkDisabled) ?
                        <View style={[ComponentStyles.cardButton, { backgroundColor: "green", flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
                            <Image source={require("../../assets/image/icona-check.png")} style={{ width: 20, height: 20, marginRight: 5, tintColor: "white" }} />
                            <Text style={ComponentStyles.cardButtonText} >Risposta inviata!</Text>
                        </View>
                        :
                        <View style={[ComponentStyles.cardButton, (checked != "") ? null : { backgroundColor: "lightgray" }]}>
                            <Text style={ComponentStyles.cardButtonText} >{"Invia risposta!"}</Text>
                        </View>
                }
            </TouchableNativeFeedback>
        </View>
    )
}

const styles = StyleSheet.create({
    numVote: {
        color: "gray",
        fontSize: 15,
        marginLeft: 15,
        fontFamily: font.montserrat
    }
})
