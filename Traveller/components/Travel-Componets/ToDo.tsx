import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serverLink } from "../../global/globalVariable";
import { ds } from "../../global/designSystem";
import axios from "axios";
import PostCard from "./PostCard";
import { ProgressTrack } from "../ui";

interface ToDoProps {
    data: any;
    home: any;
    travel?: any;
    loadPosts?: any;
    username: any;
}

export default function ToDo({ data, home, travel, loadPosts, username }: ToDoProps) {
    let [temp, setTemp] = useState(data);

    const handleCheckboxPress = async (itemKey: number) => {
        const updatedItems = temp.items.map((item: any) => {
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

    const total = temp.items.length;
    const done = temp.items.filter((item: any) => item.checked).length;

    return (
        <PostCard item={data} home={home} travel={travel} loadPosts={loadPosts} username={username}>
            {data.description ? (
                <Text style={styles.title}>{data.description}</Text>
            ) : null}

            {total > 0 && (
                <View style={styles.progressRow}>
                    <ProgressTrack
                        progress={total ? done / total : 0}
                        color={ds.colors.success}
                        height={6}
                        style={styles.progressTrack}
                    />
                    <Text style={styles.progressLabel}>
                        {done}/{total}
                    </Text>
                </View>
            )}

            <View style={styles.list}>
                {temp.items.map((item: any) => (
                    <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.7}
                        onPress={() => handleCheckboxPress(item.key)}
                    >
                        <View style={[styles.row, item.checked && styles.rowChecked]}>
                            <MaterialCommunityIcons
                                name={item.checked ? "check-circle" : "checkbox-blank-circle-outline"}
                                size={20}
                                color={item.checked ? ds.colors.success : ds.colors.scale.neutral[8]}
                                style={styles.icon}
                            />
                            <Text
                                style={[
                                    styles.label,
                                    item.checked && styles.labelChecked,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </PostCard>
    );
}

const styles = StyleSheet.create({
    title: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.text,
        marginBottom: ds.space[3],
    },
    progressRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: ds.space[4],
    },
    progressTrack: {
        flex: 1,
        marginRight: ds.space[3],
    },
    progressLabel: {
        fontFamily: ds.fontFamily.metaSemibold,
        fontSize: 11,
        color: ds.colors.textSecondary,
    },
    list: {
        gap: ds.space[2],
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: ds.radius.m,
        paddingVertical: ds.space[3],
        paddingHorizontal: ds.space[3],
    },
    rowChecked: {
        backgroundColor: ds.colors.successSoft,
    },
    icon: {
        marginRight: ds.space[3],
    },
    label: {
        flex: 1,
        fontFamily: ds.fontFamily.regular,
        fontSize: 12,
        color: ds.colors.text,
    },
    labelChecked: {
        color: ds.colors.textSecondary,
        textDecorationLine: "line-through",
    },
});
