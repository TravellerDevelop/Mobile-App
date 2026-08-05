import * as FileSystem from "expo-file-system/legacy";
import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { ds } from "../../global/designSystem";
import { getData } from "../../shared/data/localdata";
import { isFilePresent } from "../utils/fileSystem";
import { imageFileName, resolveImageUri } from "../../shared/imageUrl";
import PostCard from "./PostCard";

const styles = StyleSheet.create({
  description: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: ds.colors.textBody,
    textAlign: "left",
    marginBottom: ds.space[3],
  },
  galleryWrap: {
    width: "100%",
    height: 240,
    borderRadius: ds.radius.l,
    overflow: "hidden",
  },
  gallery: {
    height: "100%",
    overflow: "hidden",
    backgroundColor: ds.colors.scale.neutral[4],
  },
  dots: {
    backgroundColor: ds.colors.scale.accent[4],
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    marginVertical: 3,
  },
  activeDots: {
    backgroundColor: ds.colors.action,
    width: 14,
  },
  dotsTrack: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ds.colors.actionSubtle,
    paddingHorizontal: ds.space[2],
    paddingVertical: 2,
    borderRadius: ds.radius.full,
  },
});

/**
 * @param {{ item: any, home: any, loadPosts?: any, travel?: any, username: any }} props
 */
export default function ImagesComponent({ item, home, loadPosts, travel, username }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ausItems, setAusItems] = useState({});
  const [galleryWidth, setGalleryWidth] = useState(0);

  async function downloadImages() {
    let x = item;
    for (let i of item.source) {
      const filePath = FileSystem.documentDirectory + "post" + imageFileName(i.source);
      if (!(await isFilePresent(filePath))) {
        x.source[i.id].defSource = i.source;
        try {
          const downloadedFile = await FileSystem.downloadAsync(
            resolveImageUri(i.source, "userImage/posts/"),
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
  }, []);

  return (
    <PostCard item={item} home={home} travel={travel} loadPosts={loadPosts} username={username}>
      {item.description ? (
        <Text style={styles.description}>{item.description}</Text>
      ) : null}
      <View
        style={styles.galleryWrap}
        onLayout={(e) => setGalleryWidth(e.nativeEvent.layout.width)}
      >
        {galleryWidth > 0 && (
          <FlatList
            data={ausItems.source}
            renderItem={({ item }) => (
              <View style={[styles.gallery, { width: galleryWidth }]}>
                <Image
                  source={{
                    uri: item.source.includes("uripost:")
                      ? item.source.replace("uripost:", "")
                      : resolveImageUri(item.source, "userImage/posts/"),
                  }}
                  style={{
                    width: galleryWidth,
                    height: "100%",
                  }}
                  resizeMode="cover"
                />
              </View>
            )}
            onScroll={(e) => {
              setCurrentIndex(
                Math.round(e.nativeEvent.contentOffset.x / galleryWidth)
              );
            }}
            horizontal={true}
            pagingEnabled={true}
            snapToInterval={galleryWidth}
            decelerationRate="fast"
            disableIntervalMomentum={true}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            style={{ width: galleryWidth, height: "100%" }}
          />
        )}
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          marginTop: ds.space[3],
        }}
      >
        <View style={styles.dotsTrack}>
          {item.source.map((item) => {
            return (
              <View
                key={item.id}
                style={[
                  styles.dots,
                  currentIndex == item.id && styles.activeDots,
                ]}
              ></View>
            );
          })}
        </View>
      </View>
    </PostCard>
  );
}
