import React, { useEffect, useState } from "react";
import { ComponentStyles } from "./componentStyle";
import { View, Text, StyleSheet, Image } from "react-native";
import { Checkbox } from "react-native-paper";
import { font, serverLink } from "../../global/globalVariable";
import axios from "axios";
import PostCard from "./PostCard";

export default function ToDo({ data, home, travel, loadPosts, username }) {
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
        <PostCard item={data} home={home} travel={travel} loadPosts={loadPosts} username={username}>
            <Text style={styles.description} >{data.description}</Text>
            <View style={{}}>
                {
                    temp.items.map(item => (
                        <View style={styles.row} key={item.key}>
                            <Checkbox status={item.checked ? 'checked' : 'unchecked'} color="#4960FF"
                                onPress={() => {
                                    handleCheckboxPress(item.key)
                                }}
                            />
                            <Text style={styles.textOption}>{item.label}</Text>
                        </View>
                    ))
                }
            </View>
        </PostCard>
    )
}

const styles = StyleSheet.create({
    row: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center"
    },
    textOption: {
        fontFamily: font.text,
        fontSize: 16
    },
    description: {
        fontFamily: font.text,
        fontSize: 16
    }
});