import axios from "axios";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Checkbox } from "react-native-paper";
import { font, serverLink } from "../../global/globalVariable";
import PostCard from "./PostCard";

export default function ToDo({ data, home, travel, loadPosts }) {
  let [temp, setTemp] = useState(data);

  const handleCheckboxPress = async (itemKey) => {
    const updatedItems = temp.items.map((item) => {
      if (item.key === itemKey) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });

    setTemp({ ...temp, items: updatedItems });

    try {
      await axios.post(serverLink + "api/post/updateToDo", {
        id: data._id,
        items: updatedItems,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <PostCard item={data} home={home} travel={travel} loadPosts={loadPosts}>
      <Text style={styles.description}>{data.description}</Text>
      <View style={{}}>
        {temp.items.map((item) => (
          <View style={styles.row} key={item.key}>
            {Platform.OS == "ios" ? (
              <View
                style={{
                  backgroundColor: "#CCCCCC50",
                  borderRadius: "50%",
                  marginRight: 10,
                  marginBottom: 5
                }}
              >
                <Checkbox
                  status={item.checked ? "checked" : "unchecked"}
                  onPress={() => {
                    if(!home){
                        handleCheckboxPress(item.key);
                    }
                  }}
                  style={{ borderColor: "#CCC", borderWidth: 1 }}
                  uncheckedColor="#CCC"
                  color="#4900FF"
                />
              </View>
            ) : (
              <Checkbox
                status={item.checked ? "checked" : "unchecked"}
                disabled={home}
                onPress={() => {
                    if(!home){
                        handleCheckboxPress(item.key);
                    }
                }}
                style={{ borderColor: "#CCC", borderWidth: 1 }}
                uncheckedColor="#CCC"
                color="#4900FF"
              />
            )}
            <Text style={styles.textOption}>{item.label}</Text>
          </View>
        ))}
      </View>
    </PostCard>
  );
}

const styles = StyleSheet.create({
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  textOption: {
    fontFamily: font.text,
    fontSize: 16,
  },
  description: {
    fontFamily: font.text,
    fontSize: 16,
  },
});
