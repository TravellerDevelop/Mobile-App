import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { color, font } from '../global/globalVariable';

export default function Notifications() {
    return (
        <View style={styles.container}>
            <FlatList
                data={[
                    { key: '1', title: 'Notifica 1', subtitle: 'Sei stato invitato in un nuovo viaggio! 🪁' },
                    { key: '2', title: 'Notifica 2', subtitle: 'Creato il 10/02/2023' },
                ]}

                renderItem={({ item }) =>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                    </View>
                }
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    card: {
        backgroundColor: "white",
        width: "90%",
        borderRadius: 10,
        margin: '5%',
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,

        elevation: 6,
    },
    cardTitle: {
        color: "#000",
        fontSize: 26,
        textAlign: "left",
        fontFamily: font.montserrat,
    },
    cardSubtitle: {
        color: "#000",
        fontSize: 18,
        textAlign: "left",
        fontFamily: font.montserratLight,
    }
});