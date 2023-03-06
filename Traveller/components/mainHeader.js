import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Avatar, Badge } from '@react-native-material/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import color from '../global/globalVariable';

export default function MainHeader() {
    return (
        <LinearGradient
            style={styles.header}
            start={{ x: 0.5, y: 0.2 }}
            colors={['#4960FF', '#4900FF']}
        >
            <View style={styles.rowHeader}>
                <Text style={styles.logo}>TRAVELLER</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Badge label={
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons style={{ marginRight: 5 }} name='bell-outline' color="white" />
                            <Text
                                style={{ color: 'white', fontFamily: "montserrat-regular" }}
                            >3+</Text>
                        </View>
                    }
                        color="#490099" />

                    <View style={styles.whiteRound} ></View>
                    <Avatar label="Pietro Bossolasco" size={40} autoColor uppercase labelStyle={{ fontFamily: 'montserrat-regular' }} />
                </View>
            </View>
            <View>
                <Text style={styles.headerTitle}>Buongiorno Pietro!</Text>
                <Text style={styles.headerSubtitle}>Dove andiamo oggi? 🚀</Text>
            </View>
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
        backgroundColor: "#4960FF",
        width: "100%",
        paddingTop: 40,
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
    }
})