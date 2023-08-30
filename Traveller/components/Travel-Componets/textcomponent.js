import React from 'react';
import { View, Text, Image, TouchableOpacity, TouchableWithoutFeedback, Modal, StyleSheet } from 'react-native';
import { ComponentStyles } from './componentStyle';
import { Badge } from '@react-native-material/core';
import { getData } from '../../shared/data/localdata';
import { font, serverLink } from '../../global/globalVariable';
import axios from 'axios';

export default function TextComponent({ item, home, travel, loadPosts, isLoading }) {

    let [userData, setUserData] = React.useState(false);
    let [showMenu, setShowMenu] = React.useState(false);

    async function getUserData() {
        setUserData(await getData("user"));
    }

    React.useEffect(() => {
        getUserData();
    }, [])

    return (
        <View style={(!isLoading) ? ComponentStyles.card : {display: "none"}}  >
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
                                            <Text style={{ fontFamily: font.text, fontSize: 20 }}>Rimuovi pin</Text>
                                            :
                                            <Text style={{ fontFamily: font.text, fontSize: 20 }}>Aggiungi pin</Text>
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
                                    <Text style={{ fontFamily: font.text, fontSize: 20, color: "red" }}>Elimina post</Text>
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
                <Text style={ComponentStyles.datetimeText} >{item.dateTime.substring(0, item.dateTime.length - 3)}</Text>
            </View>
            <Text style={ComponentStyles.contentText} >{item.content}</Text>
        </View>
    )
}