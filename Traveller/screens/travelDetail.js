import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BudgetIndicator from "../components/Travel-Componets/BudgetIndicator";
import ImagesComponent from "../components/Travel-Componets/ImagesComponent";
import PaymentComponent from "../components/Travel-Componets/payments";
import TextComponent from "../components/Travel-Componets/textcomponent";
import Vote from "../components/Travel-Componets/vote";
import { font, getUserInfo, serverLink } from "../global/globalVariable";
import { getData } from "../shared/data/localdata";
import HeaderTravelDetail from "../shared/headerTravelDetail";
// import socketService from '../components/utils/socketServise';
import MenuNewPost from "../components/MenuNewPost";
import ToDo from "../components/Travel-Componets/ToDo";
import PostLoading from "../components/loading/PostLoading";
import { joinTravelSocket, leaveTravelSocket, takeSocket } from "../global/socket";

export default function TravelDetail({ navigation, route }) {
  let [personalBudget, setPersonalBudget] = useState(0);
  let [postLoading, setPostLoading] = useState(true);
  let [postData, setPostData] = useState([]);
  let username = route.params.username;
  useEffect(() => {
    loadPosts(route.params.data._id);

    joinTravelSocket(route.params.data._id)

    takeSocket().on("NewPostFromServer", (data) => {
      setPostData([data, ...postData]);
    })
  }, []);

  React.useEffect(
    // Prima di uscire dalla pagina esce dalla room del socket
    () =>
      navigation.addListener('beforeRemove', (e) => {
        leaveTravelSocket();
      }),
    [navigation]
  );

  const [refreshing, setRefreshing] = useState(false);
  const [spent, setSpent] = useState(0);

  const onRefresh = async () => {
    setPostLoading(true);
    setRefreshing(true);
    loadPosts(route.params.data._id);
    setRefreshing(false);
  };

  async function loadPosts(travelId) {
    let aus = 
    setUserData(aus);
    axios
      .get(serverLink + "api/post/take?travel=" + travelId)
      .then(async (response) => {
        if (response.status == 200) {
          let aus = response.data;

          for (let item of aus) {
            item.dateTime = new Date(item.dateTime).toLocaleString("it-IT", {
              timeZone: "Europe/Andorra",
            });
            if (item.type == "images") {
              let i = 0;
              let aus = [];

              for (let image of item.source) {
                aus.push({ id: i, source: image });
                item.source = aus;
                i++;
              }
            }
          }

          await setPostData(aus);
          await setPostLoading(false);
        }
      })
      .catch((error) => {
        console.log(error);
      });

    axios
      .get(
        serverLink +
        "api/post/takeTotalPayedByTravel?travel=" +
        travelId +
        "&userid=" +
        aus._id
      )
      .then(async (response) => {
        if (response.status == 200) {
          await setSpent(response.data);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function onAddData(data) {
    // loadPosts(route.params.data._id);
    data["creatorData"] = [getUserInfo()];
    data["dateTime"] = new Date().toLocaleString("it-IT", {
      timeZone: "Europe/Andorra",
    });
    takeSocket().emit('newpost', data);
  }

  return (
    <>
      <View style={styles.container}>
        <MenuNewPost
          navigation={navigation}
          data={route.params.data}
          onAddData={onAddData}
        />
        <ScrollView
          style={{
            flex: 1,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <HeaderTravelDetail
            navigation={navigation}
            data={route.params.data}
          />

          <View
            style={
              route.params.data.image
                ? { flex: 1, backgroundColor: "#000" }
                : { flex: 1, backgroundColor: "#4960FF" }
            }
          >
            <View style={styles.contentContainer}>
              <BudgetIndicator
                budget={parseFloat(route.params.data.budget)}
                spent={spent}
                personalbudget={personalBudget}
                setPersonalBudget={setPersonalBudget}
                creator={false}
              />

              {postLoading && <PostLoading />}

              {postData.length > 0 && postData != null && !postLoading && (
                <FlatList
                  scrollEnabled={false}
                  style={{ marginTop: 20 }}
                  data={[...postData].sort((a, b) =>
                    a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1
                  )}
                  renderItem={({ item }) => (
                    <>
                      {item.type == "text" ? (
                        <TextComponent
                          item={item}
                          home={false}
                          loadPosts={loadPosts}
                          username={username}
                        />
                      ) : item.type == "vote" ? (
                        <Vote
                          item={item}
                          home={false}
                          loadPosts={loadPosts}
                          username={username}
                        />
                      ) : item.type == "payments" ? (
                        <PaymentComponent
                          navigation={navigation}
                          item={item}
                          home={false}
                          loadPosts={loadPosts}
                          username={username}
                        />
                      ) : item.type == "images" ? (
                        <ImagesComponent
                          item={item}
                          home={false}
                          loadPosts={loadPosts}
                          username={username}
                        />
                      ) : (
                        item.type == "todo" && (
                          <ToDo
                            data={item}
                            loadPosts={loadPosts}
                            home={false}
                            username={username}
                          />
                        )
                      )}
                    </>
                  )}
                />
              )}
              {(postData.length == 0 || postData == null) && !postLoading && (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    height: 300,
                  }}
                >
                  <Text
                    style={{
                      color: "#000",
                      fontSize: 16,
                      textAlign: "center",
                      fontFamily: font.text_bold,
                    }}
                  >
                    Non ci sono post
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ height: 100 }}></View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopEndRadius: 20,
    borderTopLeftRadius: 20,
    minHeight: 100,
    marginTop: -20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    margin: 10,
    padding: 10,
    elevation: 5,
  },
  contentText: {
    color: "#000",
    fontSize: 16,
    textAlign: "left",
    fontFamily: font.text,
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 5,
  },
  nameText: {
    color: "#000",
    fontSize: 16,
    textAlign: "left",
    fontFamily: font.text,
    marginRight: 5,
  },
  datetimeText: {
    color: "#000",
    fontSize: 12,
    fontFamily: font.text_light,
    marginBottom: 10,
  },
  rowVote: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  cardButton: {
    backgroundColor: "#4900FF",
    borderRadius: 10,
    margin: 10,
    padding: 10,
    elevation: 5,
    alignItems: "center",
  },
  cardButtonText: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    fontFamily: font.text,
  },
  questionText: {
    color: "#000",
    fontSize: 18,
    textAlign: "left",
    fontFamily: font.text,
    marginBottom: 10,
  },
});
