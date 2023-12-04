import axios from "axios";
import React, { useEffect } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  View,
} from "react-native";
import { ProgressBar, RadioButton } from "react-native-paper";
import { color, font, getUserInfo, serverLink } from "../../global/globalVariable";
import { getData } from "../../shared/data/localdata";
import PostCard from "./PostCard";
import { ComponentStyles } from "./componentStyle";

let percent = {};
let ausItem;
let totalVotes;

export default function Vote({ item, home, travel, loadPosts }) {
  let [checkDisabled, setCheckDisabled] = React.useState(false);
  let [numVote, setNumVote] = React.useState({});

  useEffect(() => {
    const test = async () => {
      let aus = getUserInfo();
      username = aus.username;
      ausItem = item;
      let i = 0;
      for (item of ausItem.votes) {
        for (aus of item) {
          if (aus == username) {
            setChecked(ausItem.content[i]);
            setCheckDisabled(true);
          }
        }
        i++;
      }
      let a = {};
      for (let i = 0; i < ausItem.content.length; i++) {
        a[ausItem.content[i]] = ausItem.votes[i].length;
      }
      setNumVote(a);
      return aus;
    };

    test();
  }, []);

  let [checked, setChecked] = React.useState("");

  if (percent[item.content[0]] == undefined) {
    ausItem = item;

    totalVotes = 0;

    for (let aus of ausItem.votes) {
      totalVotes += aus.length;
    }
    let i = 0;

    for (let aus of ausItem.votes) {
      percent[ausItem.content[i]] = aus.length / totalVotes;
      if (isNaN(percent[ausItem.content[i]])) {
        percent[ausItem.content[i]] = 0;
      }
      i++;
    }
  }

  return (
    <PostCard item={item} home={home} travel={travel} loadPosts={loadPosts}>
      <Text style={ComponentStyles.questionText}>{item.question}</Text>
      <FlatList
        data={item.content}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={ComponentStyles.voteContent}>
            <Text style={ComponentStyles.contentText}>{item}</Text>
            <View style={ComponentStyles.rowVote}>
              <RadioButton
                disabled={checkDisabled}
                value={item}
                color={color.secondary}
                status={checked === item ? "checked" : "unchecked"}
                onPress={() => {
                  if (checked != "") {
                    let i = 0;

                    while (checked != ausItem.content[i]) {
                      i++;
                    }

                    percent[ausItem.content[i]] =
                      ausItem.votes[i].length / totalVotes;

                    if (isNaN(percent[ausItem.content[i]])) {
                      percent[ausItem.content[i]] = 0;
                    }
                  }
                  setChecked(item);
                  let i = 0;

                  while (item != ausItem.content[i]) {
                    i++;
                  }

                  percent[ausItem.content[i]] =
                    (ausItem.votes[i].length + 1) / (totalVotes + 1);
                }}
              />
              <ProgressBar
                progress={percent[item]}
                color={"#4900FF"}
                style={{ width: 250, height: 10, borderRadius: 10 }}
              />
              <Text style={styles.numVote}>{numVote[item]}</Text>
            </View>
          </View>
        )}
      />

      <TouchableNativeFeedback
        onPress={() => {
          if (checked != "" && !checkDisabled) {
            let aus = item.votes;

            let i = 0;

            while (checked != ausItem.content[i]) {
              i++;
            }

            aus[i].push(username);

            axios
              .post(serverLink + "api/post/updateVote", {
                id: item._id,
                vote: aus,
                travelid: item.travel
              })
              .then((res) => {
                setCheckDisabled(true);
              })
              .catch((err) => {
                console.log(err);
              });
          }
        }}
      >
        {checkDisabled ? (
          <View
            style={[
              ComponentStyles.cardButton,
              {
                backgroundColor: "green",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <Image
              source={require("../../assets/image/icona-check.png")}
              style={{
                width: 20,
                height: 20,
                marginRight: 5,
                tintColor: "white",
              }}
            />
            <Text style={ComponentStyles.cardButtonText}>
              Risposta inviata!
            </Text>
          </View>
        ) : (
          <View
            style={[
              ComponentStyles.cardButton,
              checked == "" && { backgroundColor: "lightgray" },
            ]}
          >
            <Text style={ComponentStyles.cardButtonText}>
              {"Invia risposta!"}
            </Text>
          </View>
        )}
      </TouchableNativeFeedback>
    </PostCard>
  );
}

const styles = StyleSheet.create({
  numVote: {
    color: "gray",
    fontSize: 15,
    marginLeft: 15,
    fontFamily: font.text,
  },
});
