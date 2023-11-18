import React, { useContext, useEffect } from "react";
import { StyleSheet, View, Text, Dimensions, ScrollView, RefreshControl } from "react-native";
import { font, color, serverLink } from "../global/globalVariable";
import { getData } from "../shared/data/localdata";
import MoneyHeader from "../shared/Headers/moneyHeaders";
import axios from "axios";
import { BarChart } from "react-native-chart-kit";
import { ActivityIndicator } from "@react-native-material/core";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Money() {
    let [lastYear, setLastYear] = React.useState("-- ");
    let [totalToPay, setTotalToPay] = React.useState("-- ");
    let [totalToGet, setTotalToGet] = React.useState("-- ");
    let [payedGroupByTravel, setPayedGroupByTravel] = React.useState([]);
    let [barChartData, setBarChartData] = React.useState({});
    let [chartDataLoading, setChartDataLoading] = React.useState(true);

    useEffect(() => {
        takeUserData();
    }, [])

    async function takeUserData() {
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
            });

        axios.get(serverLink + "api/post/takePayedGroupByTravel?userid=" + aus._id)
            .then((response) => {
                if (response.status == 200) {
                    let aus = response.data;
                    let labels = [];
                    let data = [];

                    for (let item of aus) {
                        labels.push(item.name);
                        data.push(item.total);
                    }

                    setBarChartData({
                        labels: labels,
                        datasets: [
                            {
                                data: data
                            }
                        ]
                    })

                    setChartDataLoading(false);
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
            style={{
                backgroundColor: "#4960FF"
            }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <SafeAreaView
                    style={{
                        flex: 1,
                    }}
                >
                    <MoneyHeader />

                    <View style={styles.container}>
                        <View style={styles.topCard}>
                            <View style={styles.row}>
                                <View style={styles.minicard}>
                                    <Text style={{ fontFamily: font.text, fontSize: 16, textAlign: "center", marginTop: 20 }}>Spese degli ultimi 12 mesi</Text>
                                    <Text style={{ fontFamily: font.text_bold, fontSize: 25, textAlign: "center", marginTop: 20 }}>{lastYear.toFixed(2)}€</Text>
                                </View>
                                <View style={styles.minicard}>
                                    <Text style={{ fontFamily: font.text, fontSize: 16, textAlign: "center", marginTop: 20 }}>Spese dell'ultimo mese</Text>
                                    <Text style={{ fontFamily: font.text_bold, fontSize: 25, textAlign: "center", marginTop: 20 }}>{lastYear.toFixed(2)}€</Text>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.minicard}>
                                    <Text style={{ fontFamily: font.text, fontSize: 16, textAlign: "center", marginTop: 20 }}>Soldi da pagare</Text>
                                    <Text style={{ fontFamily: font.text_bold, fontSize: 25, textAlign: "center", marginTop: 20, color: "red" }}>{totalToPay.toFixed(2)}€</Text>
                                </View>
                                <View style={styles.minicard}>
                                    <Text style={{ fontFamily: font.text, fontSize: 16, textAlign: "center", marginTop: 20 }}>Soldi da ritirare</Text>
                                    <Text style={{ fontFamily: font.text_bold, fontSize: 25, textAlign: "center", marginTop: 20, color: "green" }}>{totalToGet.toFixed(2)}€</Text>
                                </View>
                            </View>
                        </View>

                        {
                            (chartDataLoading == false) ?
                                <View style={styles.bottomCard}>
                                    <Text style={{ fontFamily: font.text_bold, fontSize: 25, textAlign: "center", marginTop: 20 }}>Spese per viaggio</Text>
                                    <BarChart
                                        data={barChartData}
                                        width={Dimensions.get("window").width - 20}
                                        height={220}
                                        yAxisLabel="€"
                                        chartConfig={{
                                            backgroundColor: "#FFF",
                                            backgroundGradientFrom: "#FFF",
                                            backgroundGradientTo: "#FFF",
                                            decimalPlaces: 0,
                                            color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
                                            style: {
                                                borderRadius: 16,
                                            },
                                            padding: 0,
                                        }}
                                        style={{
                                            marginVertical: 8,
                                            borderRadius: 16,
                                        }}
                                    />
                                </View>
                                :
                                <ActivityIndicator size={50} color={color.primary} style={{ marginTop: 50 }} />
                        }
                    </View>
                </SafeAreaView>
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
        paddingBottom: 100,
        paddingRight: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        color: "black",
        textAlign: "center",
        fontFamily: font.text,
        fontSize: 25,
        marginLeft: 10
    },
    minicard: {
        width: 150,
        height: 150,
        backgroundColor: "white",
        borderColor: "#CCCCCC90",
        borderWidth: 0.5,
        elevation: 5,
        borderRadius: 20,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
    },
});