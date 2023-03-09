import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Avatar, Badge } from '@react-native-material/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { userInfo, color, font } from "../global/globalVariable";


export default function MainHeader({ navigation }) {
    let [user, setUser] = useState(userInfo());

    return (
        <LinearGradient
            style={styles.header}
            start={{ x: 0.5, y: 0.2 }}
            colors={[color.primary, color.secondary]}
        >
            <View style={styles.rowHeader}>
                <Text style={styles.logo}>TRAVELLER</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.navigate("Notifications")} >
                        <Badge label={
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons style={{ marginRight: 5 }} name='bell-outline' color="white" />
                                <Text
                                    style={{ color: 'white', fontFamily: "montserrat-regular" }}
                                >3+</Text>
                            </View>
                        }
                            color="#490099" />
                    </TouchableOpacity>

                    <View style={styles.whiteRound} ></View>
                    <Avatar label={user.name + " " + user.surname} size={40} autoColor uppercase labelStyle={{ fontFamily: 'montserrat-regular' }} />
                </View>
            </View>
            <View>
                <Text style={styles.headerTitle}>Buongiorno {user.name}!</Text>
                <Text style={styles.headerSubtitle}>Dove andiamo oggi? 🚀</Text>
            </View>

            <TouchableOpacity>
                <View style={styles.headerButton}>
                    <Text style={styles.headerText}>+ Unisciti ad un viaggio!</Text>
                </View>
            </TouchableOpacity>

            {/* <Badge label="+ Aggiungiti ad un viaggio" style={{height: 30, fontFamily: font.montserrat }} fontFamily={font.montserrat} tintColor="white" color={color.third} /> */}
        </LinearGradient>
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
        fontFamily: "montserrat-regular",
    },
    headerSubtitle: {
        color: "white",
        marginLeft: 10,
        fontSize: 15,
        fontFamily: "montserrat-light",
    },
    header: {
        backgroundColor: color.primary,
        width: "100%",
        paddingTop: 15,
        paddingBottom: 20,
        justifyContent: 'space-between',
        padding: 10,
    },
    logo: {
        color: "white",
        fontSize: 20,
        marginLeft: 10,
        fontFamily: "montserrat-bold",
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
        fontFamily: font.montserrat,
    }
})