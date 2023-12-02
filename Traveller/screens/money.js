import React, { useContext, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ScrollView,
  RefreshControl,
} from "react-native";
import { font, color, serverLink, getUserInfo } from "../global/globalVariable";
import { getData } from "../shared/data/localdata";
import MoneyHeader from "../shared/Headers/moneyHeaders";
import axios from "axios";
import { BarChart } from "react-native-chart-kit";
import { ActivityIndicator } from "@react-native-material/core";
import { SafeAreaView } from "react-native-safe-area-context";
import SkeletonScreen from "../components/SkeletonScreen";

export default function Money() {
  let [lastYear, setLastYear] = React.useState("-- ");
  let [totalToPay, setTotalToPay] = React.useState("-- ");
  let [totalToGet, setTotalToGet] = React.useState("-- ");
  let [payedGroupByTravel, setPayedGroupByTravel] = React.useState([]);
  let [barChartData, setBarChartData] = React.useState({});
  let [isLoading, setIsLoading] = React.useState(true);

  const loadData = () => {
    setIsLoading(true);
    let aus = getUserInfo();

    let endpoints = [
      serverLink + "api/post/takeTotalExpenses?userid=" + aus._id,
      serverLink + "api/post/takeTotalToPay?userid=" + aus._id,
      serverLink +
        "api/post/takeTotalToReceive?username=" +
        aus.username +
        "&userid=" +
        aus._id,
      serverLink + "api/post/takePayedGroupByTravel?userid=" + aus._id,
    ];

    axios.all(endpoints.map((endpoint) => axios.get(endpoint))).then(
      axios.spread(
        (
          { data: takeTotalExpenses },
          { data: takeTotalToPay },
          { data: takeTotalToReceive },
          { data: takePayedGroupByTravel }
        ) => {
          setLastYear(takeTotalExpenses);
          setTotalToPay(takeTotalToPay);
          setTotalToGet(takeTotalToReceive);
          let ausTPGBT = takePayedGroupByTravel,
            labels = [],
            chartData = [];
          for (let item of ausTPGBT) {
            labels.push(item.name);
            chartData.push(item.total);
          }
          setBarChartData({ labels: labels, datasets: [{ data: chartData }] });
          setIsLoading(false);
        }
      )
    );
  };

  useEffect(() => {loadData()}, []);

  let [refreshing, setRefreshing] = React.useState(false);

  onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  return (
    <>
      <ScrollView
        style={{
          backgroundColor: "#4960FF",
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
                  <Text
                    style={{
                      fontFamily: font.text,
                      fontSize: 16,
                      textAlign: "center",
                      marginTop: 20,
                    }}
                  >
                    Spese degli ultimi 12 mesi
                  </Text>
                  {isLoading ? (
                    <SkeletonScreen
                      width={"80%"}
                      height={30}
                      borderRadius={5}
                      style={{ marginTop: 20, marginLeft: "10%" }}
                    />
                  ) : (
                    <Text
                      style={{
                        fontFamily: font.text_bold,
                        fontSize: 25,
                        textAlign: "center",
                        marginTop: 20,
                      }}
                    >
                      {!isNaN(lastYear) && lastYear.toFixed(2)}€
                    </Text>
                  )}
                </View>
                <View style={styles.minicard}>
                  <Text
                    style={{
                      fontFamily: font.text,
                      fontSize: 16,
                      textAlign: "center",
                      marginTop: 20,
                    }}
                  >
                    Spese dell'ultimo mese
                  </Text>
                  {isLoading ? (
                    <SkeletonScreen
                      width={"80%"}
                      height={30}
                      borderRadius={5}
                      style={{ marginTop: 20, marginLeft: "10%" }}
                    />
                  ) : (
                    <Text
                      style={{
                        fontFamily: font.text_bold,
                        fontSize: 25,
                        textAlign: "center",
                        marginTop: 20,
                      }}
                    >
                      {!isNaN(lastYear) && lastYear.toFixed(2)}€
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.minicard}>
                  <Text
                    style={{
                      fontFamily: font.text,
                      fontSize: 16,
                      textAlign: "center",
                      marginTop: 20,
                    }}
                  >
                    Soldi da pagare
                  </Text>
                  {isLoading ? (
                    <SkeletonScreen
                      width={"80%"}
                      height={30}
                      borderRadius={5}
                      style={{ marginTop: 20, marginLeft: "10%" }}
                    />
                  ) : (
                    <Text
                      style={{
                        fontFamily: font.text_bold,
                        fontSize: 25,
                        textAlign: "center",
                        marginTop: 20,
                        color: "red",
                      }}
                    >
                      {!isNaN(totalToPay) && totalToPay.toFixed(2)}€
                    </Text>
                  )}
                </View>
                <View style={styles.minicard}>
                  <Text
                    style={{
                      fontFamily: font.text,
                      fontSize: 16,
                      textAlign: "center",
                      marginTop: 20,
                    }}
                  >
                    Soldi da ritirare
                  </Text>
                  {isLoading ? (
                    <SkeletonScreen
                      width={"80%"}
                      height={30}
                      borderRadius={5}
                      style={{ marginTop: 20, marginLeft: "10%" }}
                    />
                  ) : (
                    <Text
                      style={{
                        fontFamily: font.text_bold,
                        fontSize: 25,
                        textAlign: "center",
                        marginTop: 20,
                        color: "green",
                      }}
                    >
                      {!isNaN(totalToGet) && totalToGet.toFixed(2)}€
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.bottomCard}>
              <Text
                style={{
                  fontFamily: font.text_bold,
                  fontSize: 25,
                  textAlign: "center",
                  marginTop: 20,
                }}
              >
                Spese per viaggio
              </Text>
              {!isLoading ? (
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
              ) : (
                <SkeletonScreen
                  height={220}
                  width={340}
                  borderRadius={5}
                  style={{ marginTop: 10 }}
                />
              )}
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </>
  );
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
    marginLeft: 10,
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
