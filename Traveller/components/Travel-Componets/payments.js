import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import { font } from "../../global/globalVariable";
import PostCard from "./PostCard";
import { ComponentStyles } from "./componentStyle";
import { getUserInfo } from "../../controllers/userData";

export default function PaymentComponent({
  navigation,
  item,
  home,
  travel,
  loadPosts,
}) {
  let [info, setInfo] = React.useState([]);
  let [isMine, setIsMine] = React.useState(false);

  let [isCreator, setIsCreator] = React.useState(false);
  let [isPersonal, setIsPersonal] = React.useState(false);

  useEffect(() => {
    const test = async () => {
      let aus = getUserInfo();
      if (aus.username == item.creator && item.paymentType == "normal") {
        setIsMine(true);
        setIsCreator(true);
      }

      if (item.paymentType == "personal") {
        setIsMine(true);
        setIsPersonal(true);
        setIsCreator(true);
      }

      for (let i of item.destinator) {
        if (i.userid == aus._id) {
          setIsMine(true);
        }

        if (i.userid == aus._id) {
          setInfo(i);
        }
      }
    };
    test();
  }, []);

  return (
    info != [] &&
    isMine && (
      <TouchableWithoutFeedback
        onPress={() => {
          if (!home) {
            navigation.navigate("PaymentInfo", { item: item });
          }
        }}
      >
        <PostCard item={item} home={home} travel={travel} loadPosts={loadPosts}>
          {info.payed && !isCreator ? (
            <View style={[styles.status, { backgroundColor: "green" }]}>
              <Text style={styles.statusText}>Pagato</Text>
            </View>
          ) : (
            <View style={styles.status}>
              <Text style={styles.statusText}>Non pagato</Text>
            </View>
          )}

          {isCreator && !isPersonal && (
            <View style={[styles.status, { backgroundColor: "#4900FF" }]}>
              <Text style={styles.statusText}>Creato da te</Text>
            </View>
          )}

          <View>
            <Text style={ComponentStyles.contentText}>
              {!isPersonal
                ? "Ti ha inviato una richiesta di:"
                : "Pagamento personale di:"}
            </Text>
            <Text
              style={[
                ComponentStyles.contentText,
                { fontSize: 25, fontFamily: font.text_bold },
              ]}
            >
              {item.amount}€
            </Text>
            {home ? null : (
              <Text
                style={[
                  ComponentStyles.contentText,
                  { fontSize: 12, marginTop: 10, color: "gray" },
                ]}
              >
                Clicca per maggiori informazioni
              </Text>
            )}
          </View>
        </PostCard>
      </TouchableWithoutFeedback>
    )
  );
}

const styles = StyleSheet.create({
  status: {
    backgroundColor: "#FF0000",
    width: 100,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 35,
    right: 0,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    elevation: 3,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: font.text_bold,
  },
});
