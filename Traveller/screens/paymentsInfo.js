import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableNativeFeedback,
    View,
} from "react-native";
import { Checkbox } from "react-native-paper";
import {
    color,
    font,
    getUserInfo,
    paddingTopPage,
    serverLink,
} from "../global/globalVariable";

export default function PaymentInfo({ navigation, route }) {
  let [items, setItems] = useState(route.params.item);
  let [aus, setAus] = React.useState(route.params.item);

  let myData = getUserInfo();
  let [editVisibility, setEditVisibility] = React.useState(false);
  let [checked, setChecked] = React.useState(false);

  let [extraData, setExtraData] = React.useState(false);

  const toggleExtraData = () => {
    setExtraData(!extraData);
  };

  async function getUserData() {
    let ids = [];
    items.destinator.forEach((item) => {
      ids.push(item.userid);
    });

    let aus2 = [];
    for (let item of items.destinator) {
      aus2.push({ userid: item.userid, selected: item.payed });
    }
    setChecked(aus2);

    axios
      .post(serverLink + "api/user/fromIdToUsernames", { id: ids })
      .then(async (response) => {
        for (let item of response.data) {
          for (let dest of items.destinator) {
            if (item._id == dest.userid) {
              dest.nameShow = item.name + " " + item.surname;
            }
          }
        }

        await setAus(items);
        toggleExtraData();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <View style={styles.container}>
      <Modal visible={editVisibility} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "white", marginTop: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableNativeFeedback onPress={() => setEditVisibility(false)}>
              <Image
                source={require("../assets/image/icona-freccia-left.png")}
                style={{
                  width: 25,
                  height: 25,
                  marginLeft: 20,
                  tintColor: "#000",
                }}
              />
            </TouchableNativeFeedback>
            <Text
              style={{
                fontSize: 20,
                fontFamily: font.montserratBold,
                marginLeft: 20,
              }}
            >
              Modifica pagamento
            </Text>
          </View>
          <Text
            style={{
              fontSize: 16,
              fontFamily: font.montserratBold,
              marginLeft: 20,
              marginTop: 20,
            }}
          >
            Persone che hanno pagato:
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
              paddingLeft: 10,
            }}
          >
            <FlatList
              data={aus.destinator}
              renderItem={({ item }) => (
                <View style={{ height: 30 }}>
                  <Text
                    style={{
                      marginLeft: 10,
                      fontSize: 18,
                      fontFamily: font.montserrat,
                      lineHeight: 30,
                    }}
                  >
                    {item.nameShow}
                  </Text>
                </View>
              )}
            />
            <FlatList
              data={checked}
              renderItem={({ item, index }) => (
                <View style={{ height: 30 }}>
                  <Checkbox
                    status={item.selected ? "checked" : "unchecked"}
                    onPress={() => {
                      const tempArr = [...checked];
                      tempArr.splice(index, 1, {
                        ...item,
                        selected: !item.selected,
                      });
                      setChecked(tempArr);
                    }}
                  />
                </View>
              )}
            />
          </View>
          <TouchableNativeFeedback
            onPress={() => {
              let aus2 = [];
              for (let item of checked) {
                aus2.push({ userid: item.userid, payed: item.selected });
              }

              axios
                .post(serverLink + "api/post/updatePayment", {
                  id: items._id,
                  destinator: aus2,
                })
                .then((response) => {
                  if (response.status == 200) {
                    setEditVisibility(false);
                  }
                })
                .catch((error) => {
                  console.log(error);
                });
            }}
          >
            <View
              style={{
                backgroundColor: color.primary,
                width: "90%",
                height: 50,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "center",
                position: "absolute",
                bottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: font.montserratBold,
                  color: "#FFF",
                }}
              >
                Salva modifiche
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>
      </Modal>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableNativeFeedback onPress={() => navigation.goBack()}>
          <Image
            source={require("../assets/image/icona-freccia-left.png")}
            style={{ width: 25, height: 25, marginLeft: 20, tintColor: "#000" }}
          />
        </TouchableNativeFeedback>
        <Text
          style={{
            fontSize: 20,
            fontFamily: font.montserratBold,
            marginLeft: 20,
          }}
        >
          Dettagli pagamento
        </Text>
      </View>

      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 40,
              fontFamily: font.montserratBold,
              marginLeft: 20,
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            {items.amount}€
          </Text>
          <View style={{ marginRight: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: font.montserrat,
                marginLeft: 20,
                marginTop: 5,
                marginBottom: 0,
                color: "gray",
              }}
            >
              Creato da {items.creator}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: font.montserrat,
                marginLeft: 20,
                marginTop: 0,
                marginBottom: 5,
                color: "gray",
              }}
            >
              il {items.dateTime}
            </Text>
          </View>
        </View>
        <Text
          style={{ fontSize: 20, fontFamily: font.montserrat, marginLeft: 20 }}
        >
          {items.description}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 20,
          fontFamily: font.montserratBold,
          marginLeft: 20,
          marginTop: 20,
        }}
      >
        Destinatari:
      </Text>

      <FlatList
        data={aus.destinator}
        extraData={extraData}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 10,
            }}
          >
            <Text
              style={{
                marginLeft: 10,
                fontSize: 18,
                fontFamily: font.montserrat,
              }}
            >
              {item.nameShow}
            </Text>
            {item.payed ? (
              <View style={[styles.status, { backgroundColor: "green" }]}>
                <Text style={styles.statusText}>Pagato</Text>
              </View>
            ) : (
              <View style={styles.status}>
                <Text style={styles.statusText}>Non pagato</Text>
              </View>
            )}
          </View>
        )}
      />

      {myData.username == items.creator ? (
        <TouchableNativeFeedback onPress={() => setEditVisibility(true)}>
          <View
            style={{
              backgroundColor: color.primary,
              width: "90%",
              height: 50,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              alignSelf: "center",
              position: "absolute",
              bottom: 100,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontFamily: font.montserratBold,
                color: "#FFF",
              }}
            >
              Modifica pagamento
            </Text>
          </View>
        </TouchableNativeFeedback>
      ) : null}
    </View>
  );
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
    marginRight: 10,
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
