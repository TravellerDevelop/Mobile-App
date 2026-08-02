import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";
import { StatusBadge } from "../ui";
import { getData } from "../../shared/data/localdata";
import PostCard from "./PostCard";

/**
 * @param {{ navigation?: any, item: any, home: any, travel?: any, loadPosts?: any, username: any }} props
 */
export default function PaymentComponent({
  navigation,
  item,
  home,
  travel,
  loadPosts,
  username
}) {
  let [info, setInfo] = React.useState([]);
  let [isMine, setIsMine] = React.useState(false);

  let [isCreator, setIsCreator] = React.useState(false);
  let [isPersonal, setIsPersonal] = React.useState(false);

  useEffect(() => {
    const test = async () => {
      let aus = await getData("user");

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

  // Stato mostrato nel badge in alto a destra della riga importo
  let badge = { label: "Da saldare", intent: "error" };
  if (isCreator && !isPersonal) badge = { label: "Creato da te", intent: "info" };
  else if (isPersonal) badge = { label: "Personale", intent: "info" };
  else if (info.payed) badge = { label: "Pagato", intent: "success" };

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
        <View>
          <PostCard item={item} home={home} travel={travel} loadPosts={loadPosts} username={username}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name="wallet-outline"
                  size={18}
                  color={ds.colors.action}
                />
              </View>
              <View style={styles.amountBlock}>
                <Text style={styles.description}>
                  {!isPersonal
                    ? "Richiesta di pagamento"
                    : "Pagamento personale"}
                </Text>
                <Text style={styles.amount}>€ {item.amount}</Text>
              </View>
              <StatusBadge label={badge.label} intent={badge.intent} />
            </View>

            {home ? null : (
              <Text style={styles.hint}>Tocca per maggiori informazioni</Text>
            )}
          </PostCard>
        </View>
      </TouchableWithoutFeedback>
    )
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: ds.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ds.colors.actionSubtle,
    marginRight: ds.space[3] + 2,
  },
  amountBlock: {
    flex: 1,
    marginRight: ds.space[3],
  },
  description: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  amount: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 18,
    color: ds.colors.text,
    marginTop: 2,
  },
  hint: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginTop: ds.space[4],
  },
});
