import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, TouchableNativeFeedback } from 'react-native';
import { color, font } from '../global/globalVariable';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from '@react-native-material/core';

export default function HeaderTravelDetail ({ navigation, data }) {
    return (
            <LinearGradient
                style={styles.header}
                start={{ x: 0.5, y: 0.2 }}
                colors={[color.primary, color.secondary]}
            >

                <View style={styles.row}>
                    <TouchableNativeFeedback onPress={() => navigation.navigate("Home")}>
                        <MaterialCommunityIcons name='arrow-left' size={24} color={"white"} />
                    </TouchableNativeFeedback>
                    <Text style={styles.title}>Titolo Viaggio</Text>
                </View>
                <Text style={styles.subtitle}>Creato da Abbaghiro</Text>

                <TouchableOpacity style={{ flexDirection: "row", marginLeft: 44, marginTop: 15, width: 100 }}>
                    <View style={styles.avatarContainer}>
                        <Avatar label={"Marco Montemagno"} autoColor size={30} />
                    </View>
                    <View style={styles.avatarContainer}>
                        <Avatar label={"Andrea Abbate"} autoColor size={30} />
                    </View>
                    <View style={styles.avatarContainer}>
                        <Avatar label={"Testa di cazzo"} autoColor size={30} />
                    </View>
                    <View style={styles.avatarContainer}>
                        <Avatar label={"+ 4"} size={30} />
                    </View>
                </TouchableOpacity>
            </LinearGradient>
    )
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: color.primary,
        width: "100%",
        paddingTop: 40,
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