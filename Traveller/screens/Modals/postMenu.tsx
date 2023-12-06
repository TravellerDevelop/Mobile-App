import axios from "axios";
import * as MediaLibrary from "expo-media-library";
import React, { useState } from "react";
import {
    Image,
    Modal,
    SafeAreaView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { ComponentStyles } from "../../components/Travel-Componets/componentStyle";
import { savePostToGallery } from "../../components/utils/fileSystem";
import { font, getUserInfo, serverLink } from "../../global/globalVariable";
import { takeSocket } from "../../global/socket";

interface PostMenuProps {
    item: any,
    showMenu: boolean,
    setShowMenu: (bool: boolean) => void,
    type: 'text' | 'vote' | 'payments' | 'images' | 'todo',
    loadPosts: (param: any) => void
}

export default function PostMenu({ item, showMenu, setShowMenu, type, loadPosts }: PostMenuProps) {
    const [savedIntoGallery, setSavedIntoGallery] = useState(false);
    let userData: any = getUserInfo();
    return (
        <Modal transparent visible={showMenu} animationType="slide">
            <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}>
                    <View style={ComponentStyles.editContent}>
                        {
                            type === 'images' &&
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
                        }
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
                                takeSocket().emit('delete', item._id)
                                setShowMenu(false);
                                loadPosts(item.travel);
                                axios
                                    .post(serverLink + "api/post/deletePost", { id: item._id, travel: item.travel, userid: userData._id })
                                    .then((response) => {
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

    )
}