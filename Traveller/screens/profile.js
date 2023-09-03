import React, { useState } from "react";
import { View, StyleSheet, Text, Image, TouchableNativeFeedback, FlatList, ScrollView, RefreshControl, Dimensions } from "react-native";
import { font, color, paddingTopPage, serverLink } from "../global/globalVariable";
import { Avatar } from "@react-native-material/core";
import AnimatedLottieView from "lottie-react-native";
import { getData } from "../shared/data/localdata";
import axios from "axios";
import Card from "../shared/card";
import SkeletonScreen from "../components/SkeletonScreen";

export default function MyProfile({ navigation, route }) {
    let [user, setUser] = React.useState({});
    let [ntravel, setNtravel] = React.useState(null);
    let [myTravel, setMyTravel] = React.useState([]);
    let [isLoading, setIsLoading] = useState(true);

    let [followed, setFollowed] = React.useState(null);
    let [followers, setFollowers] = React.useState(null);

    let [refreshing, setRefreshing] = React.useState(false);

    async function getUserData() {
        setIsLoading(true);
        setNtravel(null);
        setMyTravel([]);
        setFollowers(null);
        setFollowed(null);
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

    React.useEffect(() => {
        if (ntravel != null && myTravel !== [] && followers != null && followed != null) {
            setIsLoading(false);
        }
    }, [ntravel, myTravel, followers, followed])

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
                        {
                            isLoading ?
                                <SkeletonScreen width={100} height={100} borderRadius={100} />
                                :
                                <Avatar label={user.name + " " + user.surname} autoColor size={100} labelStyle={{ fontFamily: font.text, fontSize: 50 }} style={styles.avatar} />
                        }
                    </View>
                    {
                        isLoading ?
                            <View style={{ display: "flex", flexDirection: "row" }}>
                                <SkeletonScreen width={150} height={40} borderRadius={5} />
                                <SkeletonScreen width={150} height={40} borderRadius={5} style={{ marginLeft: 20 }} />
                            </View>
                            :
                            <Text style={styles.name}>{user.name} {user.surname}</Text>
                    }
                    {
                        isLoading ?
                            <SkeletonScreen width={100} height={25} borderRadius={5} style={{ marginTop: 10 }} />
                            :
                            <Text style={styles.nickname}>@{user.username}</Text>
                    }
                    <View style={styles.row}>
                        <TouchableNativeFeedback>
                            <View style={styles.column}>
                                {
                                    isLoading ? (
                                        <SkeletonScreen
                                            width={50}
                                            height={30}
                                            borderRadius={5}
                                        />
                                    )
                                        :
                                        <Text style={styles.subtext} >{ntravel}</Text>
                                }
                                <Text style={styles.subtext}>Viaggi</Text>
                            </View>
                        </TouchableNativeFeedback>
                        <TouchableNativeFeedback>
                            <View style={styles.column}>
                                {
                                    isLoading ? (
                                        <SkeletonScreen
                                            width={50}
                                            height={30}
                                            borderRadius={5}
                                        />
                                    )
                                        :
                                        <Text style={styles.subtext} >{followers}</Text>
                                }
                                <Text style={styles.subtext}>Follower</Text>
                            </View>
                        </TouchableNativeFeedback>
                        <TouchableNativeFeedback>
                            <View style={styles.column}>
                                {
                                    isLoading ? (
                                        <SkeletonScreen
                                            width={50}
                                            height={30}
                                            borderRadius={5}
                                        />
                                    )
                                        :
                                        <Text style={styles.subtext} >{followed}</Text>
                                }
                                <Text style={styles.subtext}>Seguiti</Text>
                            </View>
                        </TouchableNativeFeedback>
                    </View>
                    {
                        isLoading ?
                            <SkeletonScreen
                                width={(Dimensions.get("window").width / 100) * 90}
                                height={50}
                                borderRadius={10}
                                style={{ marginBottom: 20 }}
                            />
                            :
                            <TouchableNativeFeedback>
                                <View style={styles.button}>
                                    <Text style={{ fontFamily: font.text_bold, fontSize: 20, color: "#FFF" }}>Modifica profilo</Text>
                                </View>
                            </TouchableNativeFeedback>
                    }

                    {
                        (ntravel == 0) ?
                            <View style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", paddingTop: 50 }}>
                                <AnimatedLottieView source={require("../assets/animation/sadGuyWalking.json")} autoPlay loop style={{ width: 150, height: 150 }} />
                                <Text style={styles.err}>Ancora nessun viaggio 😥</Text>
                            </View>
                            :
                            <View style={{ width: "100%" }}>
                                <Text style={{ fontFamily: font.text, fontSize: 20, color: "#000", textAlign: "left", marginLeft: "5%" }}>I viaggi creati da te:</Text>
                                {
                                    (!isLoading) && (
                                        (myTravel.length > 0) ?
                                            <FlatList
                                                scrollEnabled={false}
                                                data={myTravel}
                                                renderItem={({ item }) => <Card vertical={true} data={item} navigation={navigation} />}
                                            />
                                            :
                                            null
                                    )
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
        fontFamily: font.text_bold,
        fontSize: 30,
        color: "black",
    },
    nickname: {
        fontFamily: font.text,
        fontSize: 20,
        color: "black",
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