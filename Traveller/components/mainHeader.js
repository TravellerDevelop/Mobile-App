import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Avatar, Badge } from "@react-native-material/core";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedLottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  color,
  font,
  getUserInfo,
  paddingTopPage,
  serverLink,
} from "../global/globalVariable";
import EnterTravel from "../screens/Modals/enterTravel";

export default function MainHeader({ navigation, updateJoinTravels, refresh }) {
  let user = getUserInfo();
  let [enter, setEnter] = useState(false);
  let [notification, setNotification] = useState(0);
  let [friendRequest, setFriendRequest] = useState([]);

  const getFollowsRequest = () => {
    axios
      .get(serverLink + "api/follow/takeFollowersRequest?to=" + user._id)
      .then((response) => {
        setFriendRequest(response.data);
        setNotification(response.data.length);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    getFollowsRequest();
  }, []);

  useEffect(() => {
    getFollowsRequest();
  }, [refresh]);

  return (
    <>
      {enter ? (
        <EnterTravel
          visibility={enter}
          setVisibility={setEnter}
          updateJoinTravels={updateJoinTravels}
        />
      ) : null}
      <LinearGradient
        style={styles.header}
        start={{ x: 0.5, y: 0.2 }}
        colors={[color.primary, color.secondary]}
      >
        <View style={styles.rowHeader}>
          <Text style={styles.logo}>TRAVELLER</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Notifications", {
                  notification: friendRequest,
                })
              }
            >
              <Badge
                label={
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons
                      style={{ marginRight: 5 }}
                      name="bell-outline"
                      color="white"
                    />
                    <Text
                      style={{
                        color: "white",
                        fontFamily: font.text,
                        marginRight: 5,
                      }}
                    >
                      {notification}
                    </Text>
                  </View>
                }
                color="#490099"
              />
            </TouchableOpacity>

            <View style={styles.whiteRound}></View>
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Avatar
                label={`${user.name} ${user.surname}`}
                size={40}
                autoColor
                uppercase
                labelStyle={{ fontFamily: font.text }}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View>
          <Text style={styles.headerTitle}>{`Buongiorno ${user.name}!`}</Text>
          <Text style={styles.headerSubtitle}>Dove andiamo oggi? 🚀</Text>
        </View>

        <TouchableOpacity onPress={() => setEnter(true)}>
          <View style={styles.headerButton}>
            <Text style={styles.headerText}>+ Unisciti ad un viaggio!</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </>
  );
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
    fontFamily: font.text,
  },
  headerSubtitle: {
    color: "white",
    marginLeft: 10,
    fontSize: 15,
    fontFamily: font.text_light,
  },
  header: {
    backgroundColor: color.primary,
    width: "100%",
    paddingTop: paddingTopPage,
    paddingBottom: 20,
    justifyContent: "space-between",
    padding: 10,
  },
  logo: {
    color: "white",
    fontSize: 20,
    marginLeft: 10,
    fontFamily: font.montserratBold,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: "black",
    fontSize: 12,
    fontFamily: font.text,
  },
});
