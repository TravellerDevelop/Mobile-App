import { Badge } from "@react-native-material/core";
import * as FileSystem from "expo-file-system";
import * as Notifications from "expo-notifications";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { font, serverLink } from "../../global/globalVariable";
import { getData } from "../../shared/data/localdata";
import { isFilePresent } from "../utils/fileSystem";
import { ComponentStyles } from "./componentStyle";
import PostMenu from "../../screens/Modals/postMenu";

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
      <PostMenu item={item} showMenu={showMenu} setShowMenu={setShowMenu} type="image" loadPosts={loadPosts} />
      {home ? (
        <Badge
          label={travel}
          style={ComponentStyles.Badge}
          labelStyle={ComponentStyles.BadgeText}
        />
      ) : null}

      {item.creator == userData.username && !home ? (
        <View style={{ position: "absolute", top: 0, right: 0, zIndex: 99 }}>
          <TouchableOpacity style={{ position: "absolute", top: 5, right: 5, zIndex: 100 }} onPress={() => { setShowMenu(!showMenu) }} >
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