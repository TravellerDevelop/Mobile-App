import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { color, paddingTopPage, font } from "../global/globalVariable";

export default function PaymentInfo({ navigation, route }) {
    console.log(route.params.item);
    let items = route.params.item;

    return (
        <View style={styles.container}>
            <FlatList
                data={items.destinator}
                renderItem={({ item }) => (
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10 }}>
                        <Text style={{ marginLeft: 10 }}>{item.userid}</Text>
                        {
                            (item.payed) ?
                                <View style={[styles.status, { backgroundColor: "green" }]}>
                                    <Text style={styles.statusText}>Pagato</Text>
                                </View>
                                :
                                <View style={styles.status}>
                                    <Text style={styles.statusText}>Non pagato</Text>
                                </View>
                        }
                    </View>
                )}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: paddingTopPage,
        backgroundColor: "white",
    },
    status: {
        backgroundColor: "#FF0000",
        width: 100,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        elevation: 3,
    },
    statusText: {
        color: "#FFF",
        fontSize: 12,
        fontFamily: font.montserratBold,
    },
});