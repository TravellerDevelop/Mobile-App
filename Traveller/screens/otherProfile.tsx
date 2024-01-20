import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableNativeFeedback,
  FlatList,
  ScrollView,
  Dimensions,
} from "react-native";
import { Avatar } from "@react-native-material/core";
import {
  color,
  font,
  paddingTopPage,
  serverLink,
} from "../global/globalVariable";
import axios from "axios";
import { getData } from "../shared/data/localdata";
import AnimatedLottieView from "lottie-react-native";
import Card from "../shared/card";
import SkeletonScreen from "../components/SkeletonScreen";
import * as SecureStore from "expo-secure-store";

export default function OtherProfile({ navigation, route }: any) {
  let [myData, setMyData]: any = React.useState({});
  let [user, setUser]: any = React.useState({});
  let [requestStatus, setRequestStatus] = React.useState("");
  let [myTravel, setMyTravel] = React.useState([]);

  let [ntravel, setNtravel] = React.useState(0);
  let [followed, setFollowed] = React.useState(0);
  let [followers, setFollowers] = React.useState(0);

  let [isLoading, setIsLoading] = useState(false);

  async function getUserData() {
    setMyData(await SecureStore.getItemAsync("user-info") as string);
  }

  React.useEffect(() => {
    setIsLoading(true);
    getUserData();

    axios
      .get(serverLink + "api/user/takeUserById?id=" + route.params.userid)
      .then((response) => {
        setUser(response.data[0]);

        axios
          .get(
            serverLink +
            "api/user/takeTravelsNum?userid=" +
            response.data[0]._id
          )
          .then((response) => {
            setNtravel(response.data.count);

            axios
              .get(
                serverLink +
                "api/follow/takeFromTo?from=" +
                myData._id +
                "&to=" +
                route.params.userid
              )
              .then((response) => {
                if (response.data.length) {
                  if (response.data[0].accepted === false)
                    setRequestStatus("Sent");
                  else setRequestStatus("Followed");
                } else {
                  setRequestStatus("Not sent");
                }

                setIsLoading(false);
              })
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
          });

        axios
          .get(
            serverLink +
            "api/travel/takeByCreator?userid=" +
            response.data[0]._id
          )
          .then((response) => {
            setMyTravel(response.data);
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        console.log(error);
      });
    axios
      .get(serverLink + "api/follow/takeFollowers?to=" + route.params.userid)
      .then((response) => {
        setFollowers(response.data.length);
      })
      .catch((error) => {
        console.log(error);
      });

    axios
      .get(serverLink + "api/follow/takeFollowings?from=" + route.params.userid)
      .then((response) => {
        setFollowed(response.data.length);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return (
    <ScrollView>
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
                label={user.name + " " + user.surname}
                autoColor
                size={100}
                labelStyle={{ fontFamily: font.text, fontSize: 50 }}
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
            <Text style={styles.name}>
              {user.name} {user.surname}
            </Text>
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
                <Text style={styles.subtext}>Followers</Text>
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
          <TouchableNativeFeedback
            onPress={() => {
              if (requestStatus == "Sent" || requestStatus == "Followed") {
                axios
                  .post(serverLink + "api/follow/delete", {
                    from: myData._id,
                    to: user._id,
                  })
                  .then((response) => {
                    setRequestStatus("Not sent");
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              } else if (requestStatus == "Not sent") {
                axios
                  .post(serverLink + "api/follow/create", {
                    from: myData._id,
                    to: user._id,
                  })
                  .then((response) => {
                    setRequestStatus("Sent");
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              }
            }}
          >
            {isLoading ? (
              <SkeletonScreen
                width={(Dimensions.get("window").width / 100) * 90}
                height={50}
                borderRadius={10}
                style={{ marginBottom: 20 }}
              />
            ) : (
              <View style={styles.button}>
                {requestStatus == "Sent" ? (
                  <Text
                    style={{
                      fontFamily: font.text,
                      fontSize: 20,
                      color: "#FFF",
                    }}
                  >
                    Richiesta inviata
                  </Text>
                ) : requestStatus == "Followed" ? (
                  <Text
                    style={{
                      fontFamily: font.text,
                      fontSize: 20,
                      color: "#FFF",
                    }}
                  >
                    Segui già
                  </Text>
                ) : requestStatus == "Not sent" && (
                  <Text
                    style={{
                      fontFamily: font.text,
                      fontSize: 20,
                      color: "#FFF",
                    }}
                  >
                    Inizia a seguire
                  </Text>
                )}
              </View>
            )}
          </TouchableNativeFeedback>
          {
            isLoading ? (
              <SkeletonScreen
                width={(Dimensions.get("window").width / 100) * 90}
                height={500}
                borderRadius={10}
                style={{ marginBottom: 20 }} />
            )
              :
              (
                !myTravel.length ? (
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
                      I viaggi creati da {user.name}:
                    </Text>
                    {myTravel.length && (
                      <FlatList
                        scrollEnabled={false}
                        data={myTravel}
                        renderItem={({ item }) => (
                          <Card vertical={true} data={item} navigation={navigation} />
                        )}
                      />
                    )}
                  </View>
                )
              )
          }

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
    fontFamily: font.text,
    fontSize: 18,
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
    fontFamily: font.text,
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
