import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, TouchableNativeFeedback, Image } from 'react-native';
import { color, font, paddingTopPage } from '../global/globalVariable';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CardPartecipants from './cardPartecipants';

export default function HeaderTravelDetail({ navigation, data }) {
    let top = paddingTopPage + 15;

    return (
        <LinearGradient
            style={styles.header}
            start={{ x: 0.5, y: 0.2 }}
            colors={[color.primary, color.secondary]}
        >
            <TouchableNativeFeedback>
                <Image source={require("../assets/image/icona-edit.png")} style={{ tintColor: "white", height: 25, width: 25, position: "absolute", right: 20, top: top }} />
            </TouchableNativeFeedback>
            <View style={styles.row}>
                <TouchableNativeFeedback onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name='arrow-left' size={24} color={"white"} />
                </TouchableNativeFeedback>
                <Text style={styles.title}>{data.name}</Text>
            </View>
            <Text style={styles.subtitle}>Creato da {data.creator}</Text>

            <Text style={styles.subtitle}>Codice invito: {data.code}</Text>

            <TouchableOpacity style={{ flexDirection: "row", marginLeft: 44, marginTop: 15, width: 100 }} onPress={() => navigation.navigate("TravelPartecipants", data)} >
                <CardPartecipants data={data} />
            </TouchableOpacity>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: color.primary,
        width: "100%",
        paddingTop: paddingTopPage,
        paddingBottom: 20,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 10,
        marginTop: 10,
    },
    title: {
        color: "white",
        fontFamily: font.montserrat,
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