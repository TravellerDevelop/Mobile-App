import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, TouchableNativeFeedback } from 'react-native';
import { color, font } from '../global/globalVariable';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from '@react-native-material/core';
import CardPartecipants from './cardPartecipants';

export default function HeaderTravelDetail ({ navigation, data }) {
    return (
            <LinearGradient
                style={styles.header}
                start={{ x: 0.5, y: 0.2 }}
                colors={[color.primary, color.secondary]}
            >

                <View style={styles.row}>
                    <TouchableNativeFeedback onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name='arrow-left' size={24} color={"white"} />
                    </TouchableNativeFeedback>
                    <Text style={styles.title}>{data.key}</Text>
                </View>
                <Text style={styles.subtitle}>Creato da {data.creator}</Text>

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
        paddingTop: 20,
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