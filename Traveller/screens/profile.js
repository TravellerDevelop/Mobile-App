import React from "react";
import { View, StyleSheet, Text, Image, TouchableNativeFeedback, FlatList, ScrollView, RefreshControl } from "react-native";
import { font, color, paddingTopPage, serverLink } from "../global/globalVariable";
import { Avatar } from "@react-native-material/core";
import AnimatedLottieView from "lottie-react-native";
import { getData } from "../shared/data/localdata";
import axios from "axios";
import Card from "../shared/card";

export default function MyProfile({ navigation, route }) {
    let [user, setUser] = React.useState({});
    let [ntravel, setNtravel] = React.useState("--");
    let [myTravel, setMyTravel] = React.useState([]);

    let [followed, setFollowed] = React.useState("--");
    let [followers, setFollowers] = React.useState("--");

    let [refreshing, setRefreshing] = React.useState(false);

    async function getUserData() {
        let data = await getData("user");
        axios.get(serverLink + "api/user/takeTravelsNum?username=" + data.username)
            .then((response) => {
                setNtravel(response.data);
            })
            .catch((error) => {
                console.log(error);
            })
        setUser(data);

        axios.get(serverLink + "api/travel/takeByCreator?username=" + data.username)
            .then((response) => {
                setMyTravel(response.data);
                console.log(response.data);
            })
            .catch((error) => {
                console.log(error);
            })

        axios.get(serverLink + "api/follow/takeFollowers?to=" + data._id)
            .then((response) => {
                setFollowers(response.data.length);
            })
            .catch((error) => {
                console.log(error);
            })

        axios.get(serverLink + "api/follow/takeFollowings?from=" + data._id)
            .then((response) => {
                setFollowed(response.data.length);
            })
            .catch((error) => {
                console.log(error);
            })
    }
    
    React.useEffect(() => {
        getUserData();
    }, [])
    
    const onRefresh = async () => {
        setRefreshing(true);
        getUserData();
        setRefreshing(false);
    }

    return (
        <ScrollView
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            }
        >
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
                    <TouchableNativeFeedback>
                        <View style={styles.button}>
                            <Text style={{ fontFamily: font.montserrat, fontSize: 20, color: "#FFF" }}>Modifica profilo</Text>
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