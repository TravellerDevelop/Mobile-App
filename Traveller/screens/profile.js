import { Avatar } from "@react-native-material/core";
import axios from "axios";
import AnimatedLottieView from "lottie-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  View,
} from "react-native";
import SkeletonScreen from "../components/SkeletonScreen";
import {
  color,
  font,
  getUserInfo,
  paddingTopPage,
  serverLink,
} from "../global/globalVariable";
import Card from "../shared/card";

export default function MyProfile({ navigation, route }) {
  let [ntravel, setNtravel] = React.useState(null);
  let [myTravel, setMyTravel] = React.useState([]);
  let [isLoading, setIsLoading] = useState(true);
  let [followed, setFollowed] = React.useState(null);
  let [followers, setFollowers] = React.useState(null);
  let [refreshing, setRefreshing] = React.useState(false);
  let user = getUserInfo();

  const getData = () => {
    setIsLoading(true);
    let endpoints = [
      serverLink + "api/user/takeTravelsNum?username=" + user.username,
      serverLink + "api/travel/takeByCreator?username=" + user.username,
      serverLink + "api/follow/takeFollowers?to=" + user._id,
      serverLink + "api/follow/takeFollowings?from=" + user._id
    ]

    axios.all(endpoints.map((endpoint) => axios.get(endpoint))).then(
      axios.spread(({ data: takeTravelsNum }, { data: takeByCreator }, { data: takeFollowers }, { data: takeFollowings }) => {
        setNtravel(takeTravelsNum.count);
        setMyTravel(takeByCreator);
        setFollowers(takeFollowers.length);
        setFollowed(takeFollowings.length);
      }));
  }

  React.useEffect(() => {
    getData();
  }, []);

  React.useEffect(() => {
    if (ntravel != null && followers != null && followed != null) {
      setIsLoading(false);
    }
  }, [ntravel, myTravel, followers, followed]);

  const onRefresh = async () => {
    setRefreshing(true);
    getData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <TouchableNativeFeedback
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Image
            source={require("../assets/image/icona-freccia-left.png")}
            style={styles.back}
          />
        </TouchableNativeFeedback>
        <View style={styles.content}>
          <View style={styles.avatarview}>
            {isLoading ? (
              <SkeletonScreen width={100} height={100} borderRadius={100} />
            ) : (
              <Avatar
                label={`${user.name} ${user.surname}`}
                autoColor
                size={100}
                labelStyle={{ fontFamily: font.text, fontSize: 50 }}
                style={styles.avatar}
              />
            )}
          </View>
          {isLoading ? (
            <View style={{ display: "flex", flexDirection: "row" }}>
              <SkeletonScreen width={150} height={40} borderRadius={5} />
              <SkeletonScreen
                width={150}
                height={40}
                borderRadius={5}
                style={{ marginLeft: 20 }}
              />
            </View>
          ) : (
            <Text style={styles.name}>{user.name} {user.surname}</Text>
          )}
          {isLoading ? (
            <SkeletonScreen
              width={100}
              height={25}
              borderRadius={5}
              style={{ marginTop: 10 }}
            />
          ) : (
            <Text style={styles.nickname}>@{user.username}</Text>
          )}
          <View style={styles.row}>
            <TouchableNativeFeedback>
              <View style={styles.column}>
                {isLoading ? (
                  <SkeletonScreen width={50} height={30} borderRadius={5} />
                ) : (
                  <Text style={styles.subtext}>{ntravel}</Text>
                )}
                <Text style={styles.subtext}>Viaggi</Text>
              </View>
            </TouchableNativeFeedback>
            <TouchableNativeFeedback>
              <View style={styles.column}>
                {isLoading ? (
                  <SkeletonScreen width={50} height={30} borderRadius={5} />
                ) : (
                  <Text style={styles.subtext}>{followers}</Text>
                )}
                <Text style={styles.subtext}>Follower</Text>
              </View>
            </TouchableNativeFeedback>
            <TouchableNativeFeedback>
              <View style={styles.column}>
                {isLoading ? (
                  <SkeletonScreen width={50} height={30} borderRadius={5} />
                ) : (
                  <Text style={styles.subtext}>{followed}</Text>
                )}
                <Text style={styles.subtext}>Seguiti</Text>
              </View>
            </TouchableNativeFeedback>
          </View>
          {isLoading ? (
            <SkeletonScreen
              width={(Dimensions.get("window").width / 100) * 90}
              height={50}
              borderRadius={10}
              style={{ marginBottom: 20 }}
            />
          ) : (
            <TouchableNativeFeedback>
              <View style={styles.button}>
                <Text
                  style={{
                    fontFamily: font.text_bold,
                    fontSize: 20,
                    color: "#FFF",
                  }}
                >
                  Modifica profilo
                </Text>
              </View>
            </TouchableNativeFeedback>
          )}

          {ntravel == 0 ? (
            <View
              style={{
                flex: 1,
                backgroundColor: "#fff",
                alignItems: "center",
                paddingTop: 50,
              }}
            >
              <AnimatedLottieView
                source={require("../assets/animation/sadGuyWalking.json")}
                autoPlay
                loop
                style={{ width: 150, height: 150 }}
              />
              <Text style={styles.err}>Ancora nessun viaggio 😥</Text>
            </View>
          ) : (
            <View style={{ width: "100%" }}>
              <Text
                style={{
                  fontFamily: font.text,
                  fontSize: 20,
                  color: "#000",
                  textAlign: "left",
                  marginLeft: "5%",
                }}
              >
                I viaggi creati da te:
              </Text>
              {!isLoading &&
                (myTravel.length > 0 ? (
                  <FlatList
                    scrollEnabled={false}
                    data={myTravel}
                    renderItem={({ item }) => (
                      <Card
                        vertical={true}
                        data={item}
                        navigation={navigation}
                      />
                    )}
                  />
                ) : null)}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: color.primary,
    paddingTop: paddingTopPage,
  },
  content: {
    flex: 1,
    marginTop: 100,
    width: "100%",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 15,
    paddingBottom: 80,
    borderTopRightRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarview: {
    backgroundColor: "#FFF",
    borderRadius: 100,
    width: 110,
    height: 110,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -55,
    marginBottom: 20,
  },
  name: {
    fontFamily: font.text_bold,
    fontSize: 30,
    color: "black",
  },
  nickname: {
    fontFamily: font.text,
    fontSize: 20,
    color: "black",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
    marginBottom: 20,
  },
  column: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  subtext: {
    fontFamily: font.montserrat,
    fontSize: 15,
    color: "#000",
  },
  button: {
    width: "90%",
    height: 50,
    backgroundColor: color.secondary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  err: {
    fontFamily: font.montserrat,
    fontSize: 20,
    color: "#000",
  },
  back: {
    width: 30,
    height: 30,
    position: "absolute",
    top: 40,
    left: 10,
  },
});
