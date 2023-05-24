import React, { useContext, useEffect } from "react";
import { StyleSheet, View, Text, Dimensions, ScrollView, RefreshControl } from "react-native";
import { font, color, serverLink } from "../global/globalVariable";
import { getData } from "../shared/data/localdata";
import MoneyHeader from "../shared/Headers/moneyHeaders";
import axios from "axios";

export default function Money() {
    const data=[ {value:50}, {value:80}, {value:90}, {value:70} ]

    let [lastYear, setLastYear] = React.useState("-- ");
    let [totalToPay, setTotalToPay] = React.useState("-- ");
    let [totalToGet, setTotalToGet] = React.useState("-- ");

    useEffect(() => {
        takeUserData();
    }, [])

    async function takeUserData(){
        let aus = await getData("user");

        axios.get(serverLink + "api/post/takeTotalExpenses?userid=" + aus._id)
            .then((response) => {
                if (response.status == 200) {
                    setLastYear(response.data);
                }
            })
            .catch((error) => {
                console.log(error);
            })

        axios.get(serverLink + "api/post/takeTotalToPay?userid=" + aus._id)
            .then((response) => {
                if (response.status == 200) {
                    setTotalToPay(response.data);
                }
            })
            .catch((error) => {
                console.log(error);
            })

        axios.get(serverLink + "api/post/takeTotalToReceive?username=" + aus.username + "&userid=" + aus._id)
            .then((response) => {
                if (response.status == 200) {
                    setTotalToGet(response.data);
                }
            })
            .catch((error) => {
                console.log(error);
            })
    }

    let [refreshing, setRefreshing] = React.useState(false);

    onRefresh = () => {
        setRefreshing(true);
        takeUserData();
        setRefreshing(false);
    }

    return (
        <>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <MoneyHeader />

                <View style={styles.container}>
                    <View style={styles.topCard}>
                        <View style={styles.row}>
                            <View style={styles.minicard}>
                                <Text style={{ fontFamily: font.montserrat, fontSize: 16, textAlign: "center", marginTop: 20 }}>Spese degli ultimi 12 mesi</Text>
                                <Text style={{ fontFamily: font.montserratBold, fontSize: 25, textAlign: "center", marginTop: 20 }}>{lastYear}€</Text>
                            </View>
                            <View style={styles.minicard}>
                                <Text style={{ fontFamily: font.montserrat, fontSize: 16, textAlign: "center", marginTop: 20 }}>Spese dell'ultimo mese</Text>
                                <Text style={{ fontFamily: font.montserratBold, fontSize: 25, textAlign: "center", marginTop: 20 }}>{lastYear}€</Text>
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.minicard}>
                                <Text style={{ fontFamily: font.montserrat, fontSize: 16, textAlign: "center", marginTop: 20 }}>Soldi da pagare</Text>
                                <Text style={{ fontFamily: font.montserratBold, fontSize: 25, textAlign: "center", marginTop: 20, color: "red" }}>{totalToPay}€</Text>
                            </View>
                            <View style={styles.minicard}>
                                <Text style={{ fontFamily: font.montserrat, fontSize: 16, textAlign: "center", marginTop: 20 }}>Soldi da ritirare</Text>
                                <Text style={{ fontFamily: font.montserratBold, fontSize: 25, textAlign: "center", marginTop: 20, color: "green" }}>{totalToGet}€</Text>
                            </View>
                        </View>
                    </View>

                </View>
            </ScrollView>
        </>
    )
}

let styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        flex: 1,
        paddingTop: 20,
        paddingLeft: 10,
        paddingBottom: 20,
        paddingRight: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    title: {
        color: "black",
        textAlign: "center",
        fontFamily: font.montserrat,
        fontSize: 25,
        marginLeft: 10
    },
    minicard: {
        width: 150,
        height: 150,
        backgroundColor: "white",
        elevation: 5,
        borderRadius: 20,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
    },
});