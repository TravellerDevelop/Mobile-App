import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Badge } from "@react-native-material/core";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Image,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from "react-native";
import {
  color,
  font,
  paddingTopPage,
  serverLink,
} from "../global/globalVariable";
import { getUserInfo } from "../controllers/userData";

export default function HeaderTravelDetail({ navigation, data }) {
  let username = getUserInfo().username
  let creator = "";

  for (let item of data.participants) {
    if (item.creator) {
      creator = item.username;
    }
  }

  return (
    <>
      {!data.image ? (
        <LinearGradient
          style={styles.header}
          start={{ x: 0.5, y: 0.2 }}
          colors={[color.primary, color.secondary]}
        >
          <SafeAreaView>
            {creator == username && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('EditTravel', data)
                  }}
                  style={{ zIndex: 100 }}
                >
                  <View
                    style={{
                      height: 35,
                      width: 35,
                      position: "absolute",
                      right: 20,
                      top: 15,
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 100,
                    }}
                  >
                    <Image
                      source={require("../assets/image/icona-edit.png")}
                      style={{ tintColor: "white", height: 25, width: 25 }}
                    />
                  </View>
                </TouchableOpacity>
              </>
            )}
            <View style={styles.row}>
              <TouchableNativeFeedback onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={"white"}
                />
              </TouchableNativeFeedback>
              <Text style={styles.title}>{data.name}</Text>
            </View>
            <Text style={styles.subtitle}>Creato da {creator}</Text>

            <Text style={styles.subtitle}>Codice invito: {data.code}</Text>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                marginLeft: 44,
                marginTop: 15,
                width: 300,
              }}
              onPress={() => navigation.navigate("TravelPartecipants", data)}
            >
              <Badge
                label={
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons
                      style={{ marginRight: 5 }}
                      name="information-outline"
                      color="white"
                    />
                    <Text style={{ color: "white", fontFamily: font.text }}>
                      Informazioni sul viaggio
                    </Text>
                  </View>
                }
                color="#490099"
              />
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      ) : (
        <ImageBackground
          style={styles.header}
          source={{ uri: serverLink + "userImage/" + data.image }}
          imageStyle={{ opacity: 0.85 }}
        >
          <SafeAreaView>
            {creator == username ? (
              <>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('EditTravel', data)
                  }}
                  style={{ zIndex: 100 }}
                >
                  <View
                    style={{
                      height: 35,
                      width: 35,
                      position: "absolute",
                      right: 20,
                      top: 15,
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 100,
                    }}
                  >
                    <Image
                      source={require("../assets/image/icona-edit.png")}
                      style={{ tintColor: "white", height: 25, width: 25 }}
                    />
                  </View>
                </TouchableOpacity>
              </>
            ) : null}
            <View style={styles.row}>
              <TouchableNativeFeedback onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={"white"}
                />
              </TouchableNativeFeedback>
              <Text style={styles.title}>{data.name}</Text>
            </View>
            <Text style={styles.subtitle}>Creato da {creator}</Text>

            <Text style={styles.subtitle}>Codice invito: {data.code}</Text>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                marginLeft: 44,
                marginTop: 15,
                width: 300,
              }}
              onPress={() => navigation.navigate("TravelPartecipants", data)}
            >
              <Badge
                label={
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons
                      style={{ marginRight: 5 }}
                      name="information-outline"
                      color="white"
                    />
                    <Text style={{ color: "white", fontFamily: font.text }}>
                      Informazioni sul viaggio
                    </Text>
                  </View>
                }
                color="#490099"
              />
            </TouchableOpacity>
          </SafeAreaView>
        </ImageBackground>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#000",
    width: "100%",
    paddingTop: paddingTopPage,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    marginTop: 10,
  },
  title: {
    color: "white",
    fontFamily: font.text_bold,
    fontSize: 25,
    marginLeft: 10,
  },
  subtitle: {
    marginLeft: 44,
    color: "white",
    fontFamily: font.text,
    fontSize: 16,
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
});
