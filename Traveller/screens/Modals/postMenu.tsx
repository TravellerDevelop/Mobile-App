import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import * as MediaLibrary from "expo-media-library";
import React, { useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ds } from "../../global/designSystem";
import { savePostToGallery } from "../../components/utils/fileSystem";
import { serverLink } from "../../global/globalVariable";

interface PostMenuProps {
    item: any,
    showMenu: boolean,
    setShowMenu: (bool: boolean) => void,
    type: 'text' | 'vote' | 'payments' | 'images' | 'todo',
    loadPosts: (param: any) => void
}

export default function PostMenu({ item, showMenu, setShowMenu, type, loadPosts }: PostMenuProps) {
    const [savedIntoGallery, setSavedIntoGallery] = useState(false);
    const insets = useSafeAreaInsets();

    const saveImages = async () => {
        if (savedIntoGallery) return;
        try {
            // writeOnly: dobbiamo solo salvare immagini, non leggere la libreria.
            // granularPermissions: solo "photo", per non richiedere il permesso
            // AUDIO (non dichiarato in AndroidManifest, causava un crash).
            const { status } = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
            if (status === "granted") {
                try {
                    for (let i of item.source) {
                        await savePostToGallery(i.source);
                    }
                    setSavedIntoGallery(true);
                } catch (error) {
                    console.error("Error saving image to gallery:", error);
                }
            } else {
                console.log("Permission denied");
            }
        } catch (error) {
            console.error("Error requesting permission:", error);
        }
    };

    const togglePin = () => {
        item.pinned = !item.pinned;
        axios
            .post(serverLink + "api/post/updatePinPost", { param: item })
            .then(() => {
                setShowMenu(false);
                loadPosts(item.travel);
            })
            .catch((error) => console.log(error));
    };

    const deletePost = () => {
        axios
            .post(serverLink + "api/post/deletePost", { id: item._id, travel: item.travel })
            .then(() => {
                setShowMenu(false);
                loadPosts(item.travel);
            })
            .catch((error) => console.log(error));
    };

    return (
        <Modal transparent visible={showMenu} animationType="slide" onRequestClose={() => setShowMenu(false)}>
            <Pressable style={styles.scrim} onPress={() => setShowMenu(false)} />

            <View style={[styles.sheet, { paddingBottom: ds.space[5] + insets.bottom }]}>
                <View style={styles.grabber} />

                {type === 'images' && (
                    <MenuRow
                        icon={savedIntoGallery ? "check-circle" : "download-outline"}
                        label={savedIntoGallery ? "Salvato nella galleria" : "Salva nella galleria"}
                        tone={savedIntoGallery ? ds.colors.success : ds.colors.text}
                        onPress={saveImages}
                    />
                )}

                <MenuRow
                    icon={item.pinned ? "pin-off-outline" : "pin-outline"}
                    label={item.pinned ? "Rimuovi pin" : "Aggiungi pin"}
                    tone={ds.colors.text}
                    onPress={togglePin}
                />

                <MenuRow
                    icon="trash-can-outline"
                    label="Elimina post"
                    tone={ds.colors.error}
                    onPress={deletePost}
                    last
                />
            </View>
        </Modal>
    );
}

function MenuRow({
    icon,
    label,
    tone,
    onPress,
    last,
}: {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    label: string;
    tone: string;
    onPress: () => void;
    last?: boolean;
}) {
    return (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
            <View style={[styles.row, !last && styles.rowDivider]}>
                <View style={[styles.iconWrap, { backgroundColor: tone === ds.colors.error ? ds.colors.errorSoft : ds.colors.scale.neutral[3] }]}>
                    <MaterialCommunityIcons name={icon} size={18} color={tone} />
                </View>
                <Text style={[styles.rowLabel, { color: tone }]}>{label}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    scrim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: ds.colors.scrim,
    },
    sheet: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: ds.colors.surface,
        borderTopLeftRadius: ds.radius.xl,
        borderTopRightRadius: ds.radius.xl,
        paddingHorizontal: ds.space[6],
        paddingTop: ds.space[4],
        paddingBottom: ds.space[9],
        ...ds.shadow.lg,
    },
    grabber: {
        width: 36,
        height: 5,
        borderRadius: ds.radius.full,
        backgroundColor: ds.colors.scale.neutral[6],
        alignSelf: "center",
        marginBottom: ds.space[5],
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: ds.space[4],
    },
    rowDivider: {
        borderBottomWidth: 1,
        borderBottomColor: ds.colors.borderSubtle,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: ds.radius.m,
        alignItems: "center",
        justifyContent: "center",
        marginRight: ds.space[4],
    },
    rowLabel: {
        fontFamily: ds.fontFamily.medium,
        fontSize: 14,
    },
});
