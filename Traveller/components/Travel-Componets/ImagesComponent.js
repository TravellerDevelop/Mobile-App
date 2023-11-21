import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Badge } from "@react-native-material/core";
import { getData } from "../../shared/data/localdata";
import { ComponentStyles } from "./componentStyle";
import { font, serverLink } from "../../global/globalVariable";
import { FlatList } from "react-native-gesture-handler";
import axios from "axios";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { isFilePresent, savePostToGallery } from "../utils/fileSystem";

const styles = StyleSheet.create({
  description: {
    color: "#000",
    fontSize: 16,
    textAlign: "left",
    fontFamily: font.text,
    marginTop: 10,
  },
  dots: {
    backgroundColor: "#4900FF50",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
    marginTop: 3,
    marginBottom: 3,
  },
  activeDots: {
    backgroundColor: "#4900FF",
    width: 8,
  },
});

export default function ImagesComponent({ item, home, loadPosts, travel }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [userData, setUserData] = useState(false);

  const [savedIntoGallery, setSavedIntoGallery] = useState(false);
  const [ausItems, setAusItems] = useState({});

  async function getUserData() {
    setUserData(await getData("user"));
  }

  async function downloadImages() {
    let x = item;
    for (let i of item.source) {
      const filePath = FileSystem.documentDirectory + "post" + i.source;
      if (!(await isFilePresent(filePath))) {
        x.source[i.id].defSource = i.source;
        try {
          const downloadedFile = await FileSystem.downloadAsync(
            serverLink + "userImage/posts/" + i.source,
            filePath
          );
        } catch (error) {
          console.error("Error saving image to gallery:", error);
        }
      } else {
        x.source[i.id].defSource = "uripost:" + filePath;
      }
    }
    setAusItems(x);
  }

  React.useEffect(() => {
    downloadImages();
    getUserData();
  }, []);

  return (
    <View style={[ComponentStyles.card]}>
      <Modal transparent visible={showMenu} animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}>
            <View style={ComponentStyles.editContent}>
              <TouchableOpacity
                onPress={async () => {
                  if (!savedIntoGallery) {
                    try {
                      const { status } =
                        await MediaLibrary.requestPermissionsAsync();
                      if (status === "granted") {
                        try {
                          for (let i of item.source) {
                            await savePostToGallery(i.source);
                          }
                          setSavedIntoGallery(true);
                        } catch (error) {
                          console.error(
                            "Error saving image to gallery:",
                            error
                          );
                        }
                      } else {
                        console.log("Permission denied");
                      }
                    } catch (error) {
                      console.error("Error requesting permission:", error);
                    }
                  }
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
                    source={
                      savedIntoGallery
                        ? require("../../assets/image/icona-check.png")
                        : require("../../assets/image/icona-download.png")
                    }
                    style={{
                      width: 22,
                      height: 22,
                      tintColor: savedIntoGallery ? "green" : "gray",
                      marginRight: 10,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: font.text,
                      fontSize: 20,
                      color: savedIntoGallery ? "green" : "black",
                    }}
                  >
                    {savedIntoGallery
                      ? "Salvato nella galleria!"
                      : "Salva nella galleria"}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  item.pinned = !item.pinned;

                  axios
                    .post(serverLink + "api/post/updatePinPost", {
                      param: item,
                    })
                    .then((response) => {
                      setShowMenu(false);
                      loadPosts(item.travel);
                    })
                    .catch((error) => {
                      console.log(error);
                    });
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
                    paddingTop: 10,
                  }}
                >
                  <Image
                    source={require("../../assets/image/pin.png")}
                    style={{
                      width: 22,
                      height: 22,
                      tintColor: "lightgray",
                      marginRight: 10,
                    }}
                  />
                  {item.pinned ? (
                    <Text style={{ fontFamily: font.text, fontSize: 20 }}>
                      Rimuovi pin
                    </Text>
                  ) : (
                    <Text style={{ fontFamily: font.text, fontSize: 20 }}>
                      Aggiungi pin
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  axios
                    .post(serverLink + "api/post/deletePost", { id: item._id })
                    .then((response) => {
                      setShowMenu(false);
                      loadPosts(item.travel);
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
                    Elimina post
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </Modal>

      {home ? (
        <Badge
          label={travel}
          style={ComponentStyles.Badge}
          labelStyle={ComponentStyles.BadgeText}
        />
      ) : null}

      {item.creator == userData.username && !home ? (
        <View style={{ position: "absolute", top: 0, right: 0, zIndex: 99 }}>
          <TouchableOpacity
            style={{ position: "absolute", top: 5, right: 5, zIndex: 100 }}
            onPress={() => {
              showMenu ? setShowMenu(false) : setShowMenu(true);
            }}
          >
            <Image
              source={require("../../assets/image/icona-more-cerchio.png")}
              style={{ width: 20, height: 20, tintColor: "lightgray" }}
            />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={ComponentStyles.headerContainer}>
        <View style={ComponentStyles.nameContainer}>
          <Text style={ComponentStyles.nameText}>@{item.creator}</Text>
        </View>
        <Text style={ComponentStyles.datetimeText}>
          {item.dateTime.substring(0, item.dateTime.length - 3)}
        </Text>
      </View>

      <FlatList
        data={ausItems.source}
        renderItem={({ item }) => (
          <View>
            <Image
              source={{
                uri: item.source.includes("uripost:")
                  ? item.source.replace("uripost:", "")
                  : serverLink + "userImage/posts/" + item.source,
              }}
              style={{
                width: (Dimensions.get("screen").width / 100) * 88,
                height: "100%",
              }}
            />
          </View>
        )}
        onScroll={(e) => {
          setCurrentIndex(
            Math.round(
              e.nativeEvent.contentOffset.x /
                ((Dimensions.get("screen").width / 100) * 88)
            )
          );
        }}
        horizontal={true}
        pagingEnabled={true}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={{
          width: (Dimensions.get("window").width / 100) * 88,
          height: 300,
        }}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          marginTop: 10,
          padding: 2,
          borderRadius: 50,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#4060FF20",
            padding: 2,
            borderRadius: 50,
          }}
        >
          {item.source.map((item) => {
            return (
              <View
                key={item.id}
                style={[
                  styles.dots,
                  currentIndex == item.id ? styles.activeDots : null,
                ]}
              ></View>
            );
          })}
        </View>
      </View>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );
}
