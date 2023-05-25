import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableWithoutFeedback, Modal, TouchableOpacity } from "react-native";
import { ComponentStyles } from "./componentStyle";
import { font, serverLink } from "../../global/globalVariable";
import { getData } from "../../shared/data/localdata";
import { Badge } from '@react-native-material/core';
import axios from "axios";

export default function PaymentComponent({ navigation, item, home, travel, isLoading, loadPosts }) {
    let [info, setInfo] = React.useState([]);

    let [userData, setUserData] = React.useState(false);
    let [showMenu, setShowMenu] = React.useState(false);

    let [isCreator, setIsCreator] = React.useState(false);
    let [isPersonal, setIsPersonal] = React.useState(false);

    async function getUserData() {
        setUserData(await getData("user"));
    }

    useEffect(() => {

        const test = async () => {
            let aus = await getData("user")

            if (aus.username == item.creator && (item.destinator.length != 1)) {
                setIsCreator(true);
            }
            else if(item.destinator.length == 1 && item.destinator[0].personal === true){
                setIsPersonal(true);
            }

            for (let i of item.destinator) {
                if (i.userid == aus._id) {
                    setInfo(i);
                }
            }
        }

        getUserData();
        test();

    }, []);

    return (
        (info != []) ?
            <TouchableWithoutFeedback onPress={
                () => {
                    if (!home) {
                        navigation.navigate("PaymentInfo", { item: item })
                    }
                }
            } >
                <View style={(!isLoading) ? ComponentStyles.card : { display: "none" }}>
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

                    {
                        (info.payed && !isCreator) ?
                            <View style={[styles.status, { backgroundColor: "green" }]}>
                                <Text style={styles.statusText}>Pagato</Text>
                            </View>
                            :
                            <View style={styles.status}>
                                <Text style={styles.statusText}>Non pagato</Text>
                            </View>
                    }

                    {
                        (isCreator) && (
                            <View style={[styles.status, { backgroundColor: "#4900FF" }]}>
                                <Text style={styles.statusText}>Creato da te</Text>
                            </View>
                        )
                    }


                    <View style={ComponentStyles.headerContainer}>
                        <View style={ComponentStyles.nameContainer}>
                            <Text style={ComponentStyles.nameText}>@{item.creator}</Text>
                        </View>
                        <Text style={ComponentStyles.datetimeText}>{item.dateTime}</Text>
                    </View>
                    <View>
                        <Text style={ComponentStyles.contentText}>{ (!isPersonal) ? "Ti ha inviato una richiesta di:" : "Pagamento personale di:"}</Text>
                        <Text style={[ComponentStyles.contentText, { fontSize: 25, fontFamily: font.montserratBold }]}>{item.amount}€</Text>
                        {
                            (home) ?
                                null
                                :
                                <Text style={[ComponentStyles.contentText, { fontSize: 12, marginTop: 10, color: "gray" }]} >Clicca per maggiori informazioni</Text>
                        }
                    </View>
                </View>
            </TouchableWithoutFeedback>
            : <></>
    );
}

const styles = StyleSheet.create({
    status: {
        backgroundColor: "#FF0000",
        width: 100,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: 35,
        right: 0,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        elevation: 3,
    },
    statusText: {
        color: "#FFF",
        fontSize: 12,
        fontFamily: font.montserratBold,
    },
});