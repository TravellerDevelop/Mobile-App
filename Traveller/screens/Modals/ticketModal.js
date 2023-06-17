import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, Modal, View, TouchableWithoutFeedback, Image, FlatList, Dimensions, TextInput, SafeAreaView } from "react-native";
import { font, color, serverLink } from "../../global/globalVariable";
import QRCode from "react-native-qrcode-svg";
import QrCodeModal from "./qrCodeModal";
import { ComponentStyles } from "../../components/Travel-Componets/componentStyle";
import axios from "axios";
import { getData } from "../../shared/data/localdata";
import { Avatar } from "@react-native-material/core";
import { ScrollView } from "react-native-gesture-handler";

export default function TicketModal({ data, visibility, setVisibility, takeInfo }) {
    let [qrVisibility, setQrVisibility] = useState(false);
    let [showMenu, setShowMenu] = React.useState(false);
    let [showShare, setShowShare] = React.useState(false);

    let [searchFriend, setSearchFriend] = useState("");
    let [extraData, setExtraData] = useState(false);

    const toggleExtraData = () => {
        setExtraData(!extraData);
    };

    let [friends, setFriends] = useState([]);

    React.useEffect(() => {
        uData();

        async function uData() {
            let aus = await getData("user");

            axios.get(serverLink + "api/follow/takeFollowingsWithInfo?from=" + aus._id)
                .then((response) => {
                    if (response.status == 200) {
                        for (let item of response.data) {
                            item.sent = false;
                        }

                        setFriends(response.data);
                        setSearchFriend(response.data);
                    }
                })
                .catch((error) => {
                    console.log(error);
                })
        }
    }, [])

    return (
        <Modal visible={visibility} animationType="slide" >
            <SafeAreaView style={modalstyles.container}>
                <View
                    style={{ position: "relative", top: 0, right: 0, zIndex: 99 }}
                >
                    <TouchableOpacity
                        style={{ position: "absolute", top: 10, right: 10, zIndex: 100 }}
                        onPress={() => {
                            showMenu ? setShowMenu(false) : setShowMenu(true);
                        }}>
                        <Image source={require("../../assets/image/icona-more-cerchio.png")} style={{ width: 30, height: 30, tintColor: "white" }} />
                    </TouchableOpacity>
                </View>
                <QrCodeModal
                    data={data.qrdata}
                    visibility={qrVisibility}
                    setVisibility={setQrVisibility}
                />
                <View style={modalstyles.top}>
                    <TouchableOpacity onPress={() => setVisibility(false)} >
                        <Image source={require("../../assets/image/icona-freccia-left.png")} style={{ height: 25, width: 25 }} resizeMode="contain" />
                    </TouchableOpacity>
                    <Text style={{ color: "#FFF", fontSize: 20, fontFamily: font.montserrat, marginLeft: 20 }}>{data.title}</Text>
                </View>
                <Text style={modalstyles.name}>{data.surname} {data.name}</Text>
                <Text style={modalstyles.destination} >Da{data.from.name.split(',')[1]} a{data.to.name.split(',')[1]}</Text>
                <Text style={modalstyles.position}>Modello: {data.aircraft}</Text>
                <Text style={modalstyles.position}>Nr. volo: {data.flightNumber}</Text>
                <View style={modalstyles.row}>
                    <Text style={modalstyles.position}>Data: {new Date(data.date).toLocaleDateString("it-IT", { timeZone: "Europe/Andorra" })}</Text>
                </View>
                <TouchableOpacity style={modalstyles.qrcode} onPress={() => {
                    setQrVisibility(true)
                }}  >
                    <QRCode
                        value={data.qrdata}
                        size={180}
                    />
                </TouchableOpacity>
            </SafeAreaView>

            <Modal transparent visible={showShare} animationType='slide' >
                <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }} >
                    <TouchableWithoutFeedback onPress={() => setShowShare(false)}>
                        <View style={{ position: "absolute", top: 0, width: "100%", height: Dimensions.get('screen').height - 250, backgroundColor: "#FFFFFF00" }} >
                        </View>
                    </TouchableWithoutFeedback>
                    <View style={[modalstyles.shareContent]}>
                        <TextInput placeholder="Cerca un amico" style={[modalstyles.input]} placeholderTextColor="gray"
                            onChangeText={(value) => {
                                let aus = friends.filter((item) => {
                                    return item.name.toLowerCase().includes(value.toLowerCase()) || item.surname.toLowerCase().includes(value.toLowerCase());
                                })

                                setSearchFriend(aus);

                                if (value == "") {
                                    setSearchFriend(friends);
                                }

                                toggleExtraData();
                            }}
                        />
                        <FlatList
                            data={searchFriend}
                            scrollEnabled={true}
                            extraData={extraData}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <View style={{ flexDirection: "row", justifyContent: "flex-start", alignItems: "center", width: Dimensions.get("window").width - 40, height: 50, borderBottomWidth: 1, borderBottomColor: "lightgray" }}>
                                    <Avatar
                                        size={40}
                                        autoColor
                                        labelStyle={{ fontFamily: font.montserrat, fontSize: 20, color: "black" }}
                                        label={item.name + " " + item.surname}
                                        style={{ marginRight: 10 }}
                                    />

                                    <Text style={{ fontFamily: font.montserrat, fontSize: 20, color: "black" }}>{item.name} {item.surname}</Text>

                                    <TouchableOpacity style={{ position: "absolute", right: 10 }}
                                        onPress={async () => {
                                            let aus = await getData("user");

                                            axios.post(serverLink + "api/tickets/share", { userid: item._id, content: data, createBy: aus.username })
                                                .then((response) => {
                                                    item.sent = true;
                                                    setShowShare(false);
                                                })
                                                .catch((error) => {
                                                    console.log(error);
                                                })
                                        }}
                                    >
                                        <View style={(!item.sent) ? { borderRadius: 10, borderWidth: 1, backgroundColor: "#4900FF", paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5 } : { borderRadius: 10, borderWidth: 1, backgroundColor: "green", paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5 }} >
                                            <Text style={{ fontFamily: font.montserrat, fontSize: 15, color: "white", textAlign: "center" }} >{(!item.sent) ? "Invia" : "Inviato"}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>
                </SafeAreaView>
            </Modal>



            <Modal transparent visible={showMenu} animationType='slide' >
                <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                    <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}>
                        <View style={ComponentStyles.editContent}>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowShare(true);
                                }}
                            >
                                <View style={{ borderBottomWidth: 1, borderBottomColor: "lightgray", paddingBottom: 10, flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }} >
                                    <Image source={require("../../assets/image/icona-condividi.png")} style={{ width: 22, height: 22, tintColor: "black", marginRight: 10 }} />
                                    <Text style={{ fontFamily: font.montserrat, fontSize: 20, color: "black" }}>Condividi il biglietto</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    axios.post(serverLink + "api/tickets/delete", { id: data._id })
                                        .then((response) => {
                                            takeInfo();
                                            setShowMenu(false);
                                            setVisibility(false);
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                        })
                                }}>

                                <View
                                    style={{ paddingTop: 10, flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }}
                                >
                                    <Image source={require("../../assets/image/icona-cestino.png")} style={{ width: 22, height: 22, tintColor: "red", marginRight: 10 }} />
                                    <Text style={{ fontFamily: font.montserrat, fontSize: 20, color: "red" }}>Elimina biglietto</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </TouchableWithoutFeedback>
            </Modal>
        </Modal >
    )
}

const modalstyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: color.primary,
    },
    name: {
        color: "#FFF",
        fontSize: 22,
        fontFamily: font.montserratBold,
        marginTop: 20,
        marginLeft: 20,
    },
    top: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        height: 50,
        paddingLeft: 20,
    },
    qrcode: {
        height: 220,
        width: 220,
        borderRadius: 20,
        backgroundColor: "#FFF",
        position: "absolute",
        bottom: 40,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
    },
    destination: {
        color: "#FFF",
        fontSize: 18,
        fontFamily: font.montserrat,
        marginTop: 25,
        marginLeft: 20,
        marginRight: 20,
    },
    position: {
        color: "#FFF",
        fontSize: 18,
        fontFamily: font.montserrat,
        marginTop: 25,
        marginLeft: 20,
        marginRight: 20,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    time: {
        color: "#FFF",
        fontSize: 18,
        fontFamily: font.montserrat,
        marginTop: 25,
        marginLeft: 20,
    },
    shareContent: {
        padding: 20,
        backgroundColor: "#FFF",
        height: 250,
        width: "100%",
        position: "absolute",
        bottom: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    input: {
        width: Dimensions.get("window").width - 20,
        fontFamily: font.montserrat,
        height: 40,
        backgroundColor: "#F5F5F5",
        marginBottom: 20,
        borderRadius: 10,
        paddingLeft: 10,
        paddingRight: 10,
        marginLeft: 10
    },
});