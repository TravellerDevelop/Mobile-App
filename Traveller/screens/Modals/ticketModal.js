import { Avatar } from "@react-native-material/core";
import axios from "axios";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ComponentStyles } from "../../components/Travel-Componets/componentStyle";
import { getUserInfo } from "../../controllers/userData";
import { color, font, serverLink } from "../../global/globalVariable";
import QrCodeModal from "./qrCodeModal";

export default function TicketModal({ navigation, route }) {
  let [data, setData] = useState({});

  let [from, setFrom] = useState("");
  let [to, setTo] = useState("");

  let [qrVisibility, setQrVisibility] = useState(false);
  let [showMenu, setShowMenu] = React.useState(false);
  let [showShare, setShowShare] = React.useState(false);

  // LogBox.ignoreLogs([
  //   "Non-serializable values were found in the navigation state",
  //   "Cannot update a component",
  // ]);

  let [searchFriend, setSearchFriend] = useState("");
  let [extraData, setExtraData] = useState(false);

  const toggleExtraData = () => {
    setExtraData(!extraData);
  };

  let [friends, setFriends] = useState([]);

  React.useEffect(() => {
    uData();
    setData(route.params.data);

    setFrom(route.params.data.from.name.split(",")[1]);
    setTo(route.params.data.to.name.split(",")[1]);

    async function uData() {
      let aus = getUserInfo();

      axios
        .get(serverLink + "api/follow/takeFollowingsWithInfo?from=" + aus._id)
        .then((response) => {
          if (response.status == 200) {
            for (let item of response.data) {
              item.sent = false;
            }

            setFriends(response.data);
            setSearchFriend(response.data);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, []);

  if (data != {}) {
    return (
      <SafeAreaView style={modalstyles.container}>
        <View>
          <TouchableOpacity
            style={{ position: "absolute", top: 10, right: "5%", zIndex: 100 }}
            onPress={() => {
              showMenu ? setShowMenu(false) : setShowMenu(true);
            }}
          >
            <Image
              source={require("../../assets/image/icona-more-cerchio.png")}
              style={{ width: 30, height: 30, tintColor: "black" }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ position: "absolute", top: 10, left: "5%", zIndex: 100 }}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require("../../assets/image/icona-freccia-left.png")}
              style={{ height: 25, width: 25, tintColor: "black" }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <View style={modalstyles.ticketContainer}>
          <View style={modalstyles.topContainer}>
            <View style={modalstyles.top}>
              <Text style={modalstyles.name}>{data.title}</Text>
            </View>
            <Text>
              {data.surname} {data.name}
            </Text>
            <Text style={modalstyles.destination}>{`Da ${
              JSON.stringify(data) != "{}" && data.from.name
            } a ${JSON.stringify(data) != "{}" && data.to.name}`}</Text>
            <Text style={modalstyles.position}>Modello: {data.aircraft}</Text>
            <Text style={modalstyles.position}>
              Nr. volo: {data.flightNumber}
            </Text>
            <View style={modalstyles.row}>
              <Text style={modalstyles.position}>
                Data:{" "}
                {new Date(data.date).toLocaleDateString("it-IT", {
                  timeZone: "Europe/Andorra",
                })}
              </Text>
            </View>
          </View>
          <View style={modalstyles.bottomContainer}>
            <TouchableNativeFeedback
              onPress={() => {
                setQrVisibility(true);
              }}
            >
              <View style={modalstyles.qrcode}>
                <QRCode value={data.qrdata} size={120} />
              </View>
            </TouchableNativeFeedback>
          </View>
          <QrCodeModal
            data={data.qrdata}
            visibility={qrVisibility}
            setVisibility={setQrVisibility}
          />

          <Modal transparent visible={showShare} animationType="slide">
            <SafeAreaView
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}
            >
              <TouchableWithoutFeedback onPress={() => setShowShare(false)}>
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    width: "100%",
                    height: Dimensions.get("screen").height - 250,
                    backgroundColor: "#FFFFFF00",
                  }}
                ></View>
              </TouchableWithoutFeedback>
              <View style={[modalstyles.shareContent]}>
                <TextInput
                  placeholder="Cerca un amico"
                  style={[modalstyles.input]}
                  placeholderTextColor="gray"
                  onChangeText={(value) => {
                    let aus = friends.filter((item) => {
                      return (
                        item.name.toLowerCase().includes(value.toLowerCase()) ||
                        item.surname.toLowerCase().includes(value.toLowerCase())
                      );
                    });

                    setSearchFriend(aus);

                    if (value == "") {
                      setSearchFriend(friends);
                    }

                    toggleExtraData();
                  }}
                />
                <FlatList
                  data={searchFriend}
                  scrollEnabled={true}
                  extraData={extraData}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        width: Dimensions.get("window").width - 40,
                        height: 50,
                        borderBottomWidth: 1,
                        borderBottomColor: "lightgray",
                      }}
                    >
                      <Avatar
                        size={40}
                        autoColor
                        labelStyle={{
                          fontFamily: font.text_bold,
                          fontSize: 20,
                          color: "#FFF",
                        }}
                        label={item.name + " " + item.surname}
                        style={{ marginRight: 10 }}
                      />

                      <Text
                        style={{
                          fontFamily: font.text,
                          fontSize: 20,
                          color: "black",
                        }}
                      >
                        {item.name} {item.surname}
                      </Text>

                      <TouchableOpacity
                        style={{ position: "absolute", right: 10 }}
                        onPress={() => {
                          axios
                            .post(serverLink + "api/tickets/share", {
                              userid: item._id,
                              content: data,
                              createBy: getUserInfo()._id,
                            })
                            .then((response) => {
                              item.sent = true;
                              setShowShare(false);
                            })
                            .catch((error) => {
                              console.log(error);
                            });
                        }}
                      >
                        <View
                          style={
                            !item.sent
                              ? {
                                  borderRadius: 10,
                                  borderWidth: 1,
                                  backgroundColor: "#4900FF",
                                  paddingLeft: 10,
                                  paddingRight: 10,
                                  paddingTop: 5,
                                  paddingBottom: 5,
                                }
                              : {
                                  borderRadius: 10,
                                  borderWidth: 1,
                                  backgroundColor: "green",
                                  paddingLeft: 10,
                                  paddingRight: 10,
                                  paddingTop: 5,
                                  paddingBottom: 5,
                                }
                          }
                        >
                          <Text
                            style={{
                              fontFamily: font.text,
                              fontSize: 15,
                              color: "white",
                              textAlign: "center",
                            }}
                          >
                            {!item.sent ? "Invia" : "Inviato"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            </SafeAreaView>
          </Modal>

          <Modal transparent visible={showMenu} animationType="slide">
            <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
              <SafeAreaView
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}
              >
                <View style={ComponentStyles.editContent}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowShare(true);
                    }}
                  >
                    <View
                      style={{
                        borderBottomWidth: 1,
                        borderBottomColor: "lightgray",
                        paddingBottom: 10,
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={require("../../assets/image/icona-condividi.png")}
                        style={{
                          width: 22,
                          height: 22,
                          tintColor: "black",
                          marginRight: 10,
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: font.text,
                          fontSize: 20,
                          color: "black",
                        }}
                      >
                        Condividi il biglietto
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      axios
                        .post(serverLink + "api/tickets/delete", {
                          id: data._id,
                        })
                        .then((response) => {
                          setShowMenu(false);
                          setVisibility(false);
                        })
                        .catch((error) => {
                          console.log(error);
                        });
                    }}
                  >
                    <View
                      style={{
                        paddingTop: 10,
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={require("../../assets/image/icona-cestino.png")}
                        style={{
                          width: 22,
                          height: 22,
                          tintColor: "red",
                          marginRight: 10,
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: font.text,
                          fontSize: 20,
                          color: "red",
                        }}
                      >
                        Elimina biglietto
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </SafeAreaView>
    );
  } else {
    return <></>;
  }
}

const modalstyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  name: {
    color: color.secondary,
    fontSize: 22,
    fontFamily: font.text,
  },
  top: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    height: 50,
    paddingLeft: 20,
  },
  qrcode: {
    height: 150,
    width: 150,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  destination: {
    fontSize: 18,
    fontFamily: font.text,
  },
  position: {
    fontSize: 18,
    fontFamily: font.text,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: font.text,
  },
  shareContent: {
    padding: 20,
    backgroundColor: "#FFF",
    height: 250,
    width: "100%",
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    width: Dimensions.get("window").width - 20,
    fontFamily: font.text,
    height: 40,
    backgroundColor: "#F5F5F5",
    marginBottom: 20,
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 10,
    marginLeft: 10,
  },
  ticketContainer: {
    // backgroundColor: color.primary,
    // height: Dimensions.get("window").height / 1.3,
    marginTop: Dimensions.get("window").height / 10,
    width: "90%",
    marginLeft: "5%",
  },
  topContainer: {
    // height: 50,
    width: "100%",
    backgroundColor: color.secondary + "60",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  bottomContainer: {
    height: 200,
    width: "100%",
    backgroundColor: color.secondary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
  },
});
