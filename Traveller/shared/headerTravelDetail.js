import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, TouchableNativeFeedback, Image, ImageBackground } from 'react-native';
import { color, font, paddingTopPage, serverLink } from '../global/globalVariable';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getData } from './data/localdata';
import { Badge } from '@react-native-material/core';
import EditTravel from '../screens/Modals/edittravel';
import CardPartecipants from './cardPartecipants';

export default function HeaderTravelDetail({ navigation, data }) {
    let top = paddingTopPage - 20;
    let [username, setUsername] = React.useState()

    let creator = "";

    for (let item of data.participants) {
        if (item.creator) {
            creator = item.username;
        }
    }

    useEffect(() => {
        const test = async () => {
            let aus = await getData("user")
            setUsername(aus.username)
            return aus;
        }

        test();
    }, []);

    let [editVisibility, setEditVisibility] = React.useState(false)

    return (
        <>
            {
                (!data.image) ?
                    <LinearGradient
                        style={styles.header}
                        start={{ x: 0.5, y: 0.2 }}
                        colors={[color.primary, color.secondary]}
                    >

                        {
                            creator == username ? <>
                                {editVisibility ? <EditTravel visible={editVisibility} setVisible={setEditVisibility} item={data} /> : null}
                                <TouchableOpacity onPress={() => {
                                    setEditVisibility(true)
                                }} style={{ zIndex: 100 }}>
                                    <View style={{ height: 35, width: 35, position: "absolute", right: 20, top: 15, justifyContent: "center", alignItems: "center", zIndex: 100 }}>
                                        <Image source={require("../assets/image/icona-edit.png")} style={{ tintColor: "white", height: 25, width: 25 }} />
                                    </View>
                                </TouchableOpacity>
                            </>
                                :
                                null

                        }
                        <View style={styles.row}>
                            <TouchableNativeFeedback onPress={() => navigation.goBack()}>
                                <MaterialCommunityIcons name='arrow-left' size={24} color={"white"} />
                            </TouchableNativeFeedback>
                            <Text style={styles.title}>{data.name}</Text>
                        </View>
                        <Text style={styles.subtitle}>Creato da {creator}</Text>

                        <Text style={styles.subtitle}>Codice invito: {data.code}</Text>

                        <TouchableOpacity style={{ flexDirection: "row", marginLeft: 44, marginTop: 15, width: 300 }} onPress={() => navigation.navigate("TravelPartecipants", data)} >
                            <Badge label={
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialCommunityIcons style={{ marginRight: 5 }} name='information-outline' color="white" />
                                    <Text
                                        style={{ color: 'white', fontFamily: font.montserrat }}
                                    >Informazioni sul viaggio</Text>
                                </View>
                            }
                                color="#490099" />
                        </TouchableOpacity>
                    </LinearGradient>
                    :
                    <ImageBackground
                        style={styles.header}
                        source={{ uri: serverLink + "userImage/" + data.image }}
                        imageStyle={{ opacity: 0.9 }}
                    >
                        {
                            creator == username ? <>
                                {editVisibility ? <EditTravel visible={editVisibility} setVisible={setEditVisibility} item={data} /> : null}
                                <TouchableOpacity onPress={() => {
                                    setEditVisibility(true)
                                }} style={{ zIndex: 100 }}>
                                    <View style={{ height: 35, width: 35, position: "absolute", right: 20, top: 15, justifyContent: "center", alignItems: "center", zIndex: 100 }}>
                                        <Image source={require("../assets/image/icona-edit.png")} style={{ tintColor: "white", height: 25, width: 25 }} />
                                    </View>
                                </TouchableOpacity>
                            </>
                                :
                                null

                        }
                        <View style={styles.row}>
                            <TouchableNativeFeedback onPress={() => navigation.goBack()}>
                                <MaterialCommunityIcons name='arrow-left' size={24} color={"white"} />
                            </TouchableNativeFeedback>
                            <Text style={styles.title}>{data.name}</Text>
                        </View>
                        <Text style={styles.subtitle}>Creato da {creator}</Text>

                        <Text style={styles.subtitle}>Codice invito: {data.code}</Text>

                        <TouchableOpacity style={{ flexDirection: "row", marginLeft: 44, marginTop: 15, width: 300 }} onPress={() => navigation.navigate("TravelPartecipants", data)} >
                            <Badge label={
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialCommunityIcons style={{ marginRight: 5 }} name='information-outline' color="white" />
                                    <Text
                                        style={{ color: 'white', fontFamily: font.montserrat }}
                                    >Informazioni sul viaggio</Text>
                                </View>
                            }
                                color="#490099" />
                        </TouchableOpacity>
                    </ImageBackground>
            }
        </>
    )
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: color.primary,
        width: "100%",
        paddingTop: paddingTopPage,
        paddingBottom: 40,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 10,
        marginTop: 10,
    },
    title: {
        color: "white",
        fontFamily: font.montserratBold,
        fontSize: 25,
        marginLeft: 10,
    },
    subtitle: {
        marginLeft: 44,
        color: "white",
        fontFamily: font.montserratLight,
        fontSize: 16,
        marginTop: 5,
    },
    avatarContainer: {
        backgroundColor: "white",
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        height: 35,
        width: 35,
        marginRight: -15,
    },
})