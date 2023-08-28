import React from "react";
import { View, StyleSheet, Text, Image, TouchableNativeFeedback, FlatList, ScrollView } from "react-native";
import { Avatar } from "@react-native-material/core";
import { color, font, paddingTopPage, serverLink } from "../global/globalVariable";
import axios from "axios";
import { getData } from "../shared/data/localdata";
import AnimatedLottieView from "lottie-react-native";
import Card from "../shared/card";

export default function OtherProfile({ navigation, route }) {
    let [myData, setMyData] = React.useState({});
    let [user, setUser] = React.useState({});
    let [ntravel, setNtravel] = React.useState("--");
    let [requestStatus, setRequestStatus] = React.useState(false);
    let [myTravel, setMyTravel] = React.useState([]);

    let [followed, setFollowed] = React.useState("--");
    let [followers, setFollowers] = React.useState("--");

    let [refreshing, setRefreshing] = React.useState(false);

    async function getUserData() {
        setMyData(await getData("user"));
        console.log(myData)
    }

    React.useEffect(() => {
        getUserData();

        axios.get(serverLink + "api/user/takeUserById?id=" + route.params.userid)
            .then((response) => {
                setUser(response.data[0]);

                axios.get(serverLink + "api/user/takeTravelsNum?username=" + response.data[0].username)
                    .then((response) => {
                        setNtravel(response.data);

                        axios.get(serverLink + "api/follow/takeFromTo?from=" + myData._id + "&to=" + route.params.userid)
                            .then((response) => {
                                if (response.data.length > 0) {
                                    if (response.data[0].accepted === false)
                                        setRequestStatus("Sent");
                                    else
                                        setRequestStatus("Followed");
                                }
                                else if (response.data.length == 0) {
                                    setRequestStatus("Not sent");
                                }

                            })
                            .catch((error) => {
                                console.log(error);
                            })
                    })
                    .catch((error) => {
                        console.log(error);
                    })

                axios.get(serverLink + "api/travel/takeByCreator?username=" + response.data[0].username)
                    .then((response) => {
                        setMyTravel(response.data);
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            })
            .catch((error) => {
                console.log(error);
            })
        axios.get(serverLink + "api/follow/takeFollowers?to=" + route.params.userid)
            .then((response) => {
                setFollowers(response.data.length);
            })
            .catch((error) => {
                console.log(error);
            })

        axios.get(serverLink + "api/follow/takeFollowings?from=" + route.params.userid)
            .then((response) => {
                setFollowed(response.data.length);
            })
            .catch((error) => {
                console.log(error);
            })

    }, [])

    return (
        <ScrollView>
            <View style={styles.container}>

                <TouchableNativeFeedback onPress={() => { navigation.goBack() }}>
                    <Image source={require("../assets/image/icona-freccia-left.png")} style={styles.back} />
                </TouchableNativeFeedback>
                <View style={styles.content}>
                    <View style={styles.avatarview}>
                        <Avatar label={user.name + " " + user.surname} autoColor size={100} labelStyle={{ fontFamily: font.montserrat, fontSize: 50 }} style={styles.avatar} />
                    </View>
                    <Text style={styles.name}>{user.name} {user.surname}</Text>
                    <Text style={styles.nickname}>@{user.username}</Text>
                    <View style={styles.row}>
                        <TouchableNativeFeedback>
                            <View style={styles.column}>
                                <Text style={styles.subtext} >{ntravel}</Text>
                                <Text style={styles.subtext}>Viaggi</Text>
                            </View>
                        </TouchableNativeFeedback>
                        <TouchableNativeFeedback>
                            <View style={styles.column}>
                                <Text style={styles.subtext}>{followers}</Text>
                                <Text style={styles.subtext}>Follower</Text>
                            </View>
                        </TouchableNativeFeedback>
                        <TouchableNativeFeedback>
                            <View style={styles.column}>
                                <Text style={styles.subtext}>{followed}</Text>
                                <Text style={styles.subtext}>Seguiti</Text>
                            </View>
                        </TouchableNativeFeedback>
                    </View>
                    <TouchableNativeFeedback onPress={
                        () => {
                            if (requestStatus == "Sent" || requestStatus == "Followed") {
                                axios.post(serverLink + "api/follow/delete", { from: myData._id, to: user._id })
                                    .then((response) => {
                                        setRequestStatus("Not sent");
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                    })
                            }
                            else if (requestStatus == "Not sent" && myData != {}) {
                                console.log(myData)
                                axios.post(serverLink + "api/follow/create", { from: myData._id, to: user._id })
                                    .then((response) => {
                                        setRequestStatus("Sent");
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                    })
                            }
                        }
                    }>
                        <View style={styles.button}>
                            {
                                (requestStatus == "Sent") ?
                                    <Text style={{ fontFamily: font.montserrat, fontSize: 20, color: "#FFF" }}>Richiesta inviata</Text>
                                    : (requestStatus == "Followed") ?
                                        <Text style={{ fontFamily: font.montserrat, fontSize: 20, color: "#FFF" }}>Segui già</Text>
                                        : (requestStatus == "Not sent") ?
                                            <Text style={{ fontFamily: font.montserrat, fontSize: 20, color: "#FFF" }}>Inizia a seguire</Text>
                                            : null
                            }
                        </View>
                    </TouchableNativeFeedback>
                    {
                        (ntravel == 0) ?
                            <View style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", paddingTop: 50 }}>
                                <AnimatedLottieView source={require("../assets/animation/sadGuyWalking.json")} autoPlay loop style={{ width: 150, height: 150 }} />
                                <Text style={styles.err}>Ancora nessun viaggio 😥</Text>
                            </View>
                            :
                            <View style={{ width: "100%" }}>
                                <Text style={{ fontFamily: font.montserrat, fontSize: 20, color: "#000", textAlign: "left", marginLeft: "5%" }}>I viaggi creati da te:</Text>
                                {
                                    (myTravel.length > 0) ?
                                        <FlatList
                                            scrollEnabled={false}
                                            data={myTravel}
                                            renderItem={({ item }) => <Card vertical={true} data={item} navigation={navigation} />}
                                        />
                                        :
                                        null
                                }
                            </View>
                    }
                </View >
            </View>
        </ScrollView>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: color.primary,
        paddingTop: paddingTopPage,
    },
    content: {
        flex: 1,
        marginTop: 100,
        width: "100%",
        backgroundColor: "#FFF",
        borderTopLeftRadius: 15,
        paddingBottom: 80,
        borderTopRightRadius: 15,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarview: {
        backgroundColor: "#FFF",
        borderRadius: 100,
        width: 110,
        height: 110,
        elevation: 5,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -55,
        marginBottom: 20,
    },
    name: {
        fontFamily: font.montserratBold,
        fontSize: 23,
        color: color.secondary,
    },
    nickname: {
        fontFamily: font.montserrat,
        fontSize: 15,
        color: color.secondary,
    },
    row: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: 20,
        marginBottom: 20,
    },
    column: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    subtext: {
        fontFamily: font.montserrat,
        fontSize: 15,
        color: "#000",
    },
    button: {
        width: "90%",
        height: 50,
        backgroundColor: color.secondary,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    err: {
        fontFamily: font.montserrat,
        fontSize: 20,
        color: "#000",
    },
    back: {
        width: 30,
        height: 30,
        position: "absolute",
        top: 40,
        left: 10,
    }
});