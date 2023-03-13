import { Avatar } from "@react-native-material/core";
import React from "react";
import { StyleSheet, View, FlatList, Text, TouchableOpacity } from "react-native";
import { font } from "../global/globalVariable";

export default function TravelPartecipants({ navigation, route }) {
    return (
        <View style={styles.container}>
            <FlatList
                data={route.params.participants}
                renderItem={({ item }) => (
                    <TouchableOpacity>
                        <View style={styles.avatarContainer}>
                            <Avatar label={item} autoColor size={35} labelStyle={{ fontFamily: font.montserrat, fontSize: 15 }} />
                            <Text style={styles.text}>{item}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        paddingTop: 40,
    },
    avatarContainer: {
        marginLeft: 20,
        marginRight: 20,
        paddingBottom: 10,
        paddingTop: 10,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    text: {
        marginLeft: 10,
        fontSize: 20,
        fontFamily: font.montserrat,
    }
});