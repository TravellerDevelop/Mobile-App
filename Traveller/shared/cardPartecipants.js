import { Avatar } from "@react-native-material/core";
import React from "react";
import { StyleSheet, View, FlatList } from "react-native";

export default function CardPartecipants(data) {

    if (data.data.participants.length < 4) {
        console.log(data.data.participants.length)
        console.log(data.data.participants)

        if (data.data.participants.length == 1) {
            return (
                <View style={styles.row}>
                    <View style={styles.avatarContainer}>
                        <Avatar label={data.data.participants[0]} autoColor size={30} />
                    </View>
                </View>
            )
        }
        else if (data.data.participants.length == 2) {
            return (
                <View style={styles.row}>
                    <View style={styles.avatarContainer}>
                        <Avatar label={data.data.participants[0]} autoColor size={30} />
                    </View>
                    <View style={styles.avatarContainer}>
                        <Avatar label={data.data.participants[1]} autoColor size={30} />
                    </View>
                </View>
            )
        }
        else if (data.data.participants.length == 3) {
            return (
                <View style={styles.row}>
                    <View style={styles.avatarContainer}>
                        <Avatar label={data.data.participants[0]} autoColor size={30} />
                    </View>
                    <View style={styles.avatarContainer}>
                        <Avatar label={data.data.participants[1]} autoColor size={30} />
                    </View>
                    <View style={styles.avatarContainer}>
                        <Avatar label={data.data.participants[2]} autoColor size={30} />
                    </View>
                </View>
            )
        }
    }
    else {
        let length = data.data.participants.length - 3;

        let ausdata = [
            data.data.participants[0],
            data.data.participants[1],
            data.data.participants[2],
        ]

        return (
            <View style={styles.row}>

                <View style={styles.avatarContainer}>
                    <Avatar label={ausdata[0]} autoColor size={30} />
                </View>
                <View style={styles.avatarContainer}>
                    <Avatar label={ausdata[1]} autoColor size={30} />
                </View>
                <View style={styles.avatarContainer}>
                    <Avatar label={ausdata[2]} autoColor size={30} />
                </View>
                <View style={styles.avatarContainer}>
                    <Avatar label={"+ " + length} autoColor size={30} />
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    avatarContainer: {
        backgroundColor: "white",
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        height: 35,
        width: 35,
        marginRight: -15,
    },
    row: {
        flexDirection: "row",        
    }
})