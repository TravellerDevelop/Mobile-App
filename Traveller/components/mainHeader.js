import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TouchableWithoutFeedback, Modal } from 'react-native';
import { Avatar, Badge } from '@react-native-material/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { color, font, paddingTopPage, serverLink, userInfo } from "../global/globalVariable";
import AnimatedLottieView from 'lottie-react-native';
import { getData } from '../shared/data/localdata';
import EnterTravel from '../screens/Modals/enterTravel';
import axios from 'axios';


export default function MainHeader({ navigation, updateJoinTravels, refresh }) {
    let [user, setUser] = useState(null);
    let [touch, setTouch] = useState(0);
    let [easterVisibility, setEasterVisibility] = useState(false);
    let [enter, setEnter] = useState(false);
    let [notification, setNotification] = useState(0);
    let [friendRequest, setFriendRequest] = useState([]);

    setInterval(() => { setTouch(0) }, 5000)

    useEffect(() => {
        userData();

    }, []);

    async function userData() {
        let aus = await getData("user");

        setUser(aus);

        axios.get(serverLink + "api/follow/takeFollowersRequest?to=" + aus._id)
            .then((response) => {
                setFriendRequest(response.data);
                setNotification(response.data.length);
            })
            .catch((error) => {
                console.log(error);
            })
    }

    if(refresh){
        userData();
    }

    return (
        <>
            {enter ? <EnterTravel visibility={enter} setVisibility={setEnter} updateJoinTravels={updateJoinTravels} /> : null}
            <LinearGradient
                style={styles.header}
                start={{ x: 0.5, y: 0.2 }}
                colors={[color.primary, color.secondary]}
            >
                <Modal visible={easterVisibility} animation="slide">
                    <AnimatedLottieView source={require('../assets/animation/toucan-walk-cycle.json')} autoPlay loop />
                    <Text style={{ fontFamily: font.text, fontSize: 18, textAlign: "center", marginTop: 50 }}>Hai clickato troppe volte, ora sei obbligato a guardare il tucano!</Text>
                </Modal>
                <View style={styles.rowHeader}>
                    <TouchableWithoutFeedback onPress={() => {
                        setTouch(touch++);
                        if (touch == 10) {
                            setEasterVisibility(true);
                            setTouch(0);
                        }
                    }}>
                        <Text style={styles.logo}>TRAVELLER</Text>
                    </TouchableWithoutFeedback>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.navigate("Notifications", { notification: friendRequest })} >
                            <Badge label={
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialCommunityIcons style={{ marginRight: 5 }} name='bell-outline' color="white" />
                                    <Text
                                        style={{ color: 'white', fontFamily: font.text, marginRight: 5 }}
                                    >{notification}</Text>
                                </View>
                            }
                                color="#490099" />
                        </TouchableOpacity>

                        <View style={styles.whiteRound} ></View>
                        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                            <Avatar label={(user != null && user != '[]' && user != false && user != '') ? user.name + " " + user.surname : ""} size={40} autoColor uppercase labelStyle={{ fontFamily: font.text }} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View>
                    <Text style={styles.headerTitle}>Buongiorno {(user != null && user != '[]' && user != false && user != '') ? user.name : ""}!</Text>
                    <Text style={styles.headerSubtitle}>Dove andiamo oggi? 🚀</Text>
                </View>

                <TouchableOpacity onPress={() => setEnter(true)} >
                    <View style={styles.headerButton}>
                        <Text style={styles.headerText}>+ Unisciti ad un viaggio!</Text>
                    </View>
                </TouchableOpacity>
            </LinearGradient>
        </>
    )
}


const styles = StyleSheet.create({
    whiteRound: {
        width: 45,
        height: 45,
        borderRadius: 45,
        backgroundColor: "white",
        marginRight: -42.5,
        marginLeft: 20,
    },
    headerTitle: {
        color: "white",
        marginLeft: 10,
        fontSize: 20,
        fontFamily: font.text,
    },
    headerSubtitle: {
        color: "white",
        marginLeft: 10,
        fontSize: 15,
        fontFamily: font.text_light,
    },
    header: {
        backgroundColor: color.primary,
        width: "100%",
        paddingTop: paddingTopPage,
        paddingBottom: 20,
        justifyContent: 'space-between',
        padding: 10,
    },
    logo: {
        color: "white",
        fontSize: 20,
        marginLeft: 10,
        fontFamily: font.montserratBold,
    },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 10,
        marginBottom: 20,
    },
    headerButton: {
        marginLeft: 10,
        marginTop: 10,
        backgroundColor: "white",
        width: "50%",
        height: 25,
        borderRadius: 12.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        color: "black",
        fontSize: 12,
        fontFamily: font.text,
    }
})