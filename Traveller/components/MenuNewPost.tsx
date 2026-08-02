import React, { useCallback, useState } from "react";
import { LogBox, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../global/designSystem";
import NewPostTypeSheet from "./newPost/NewPostTypeSheet";
import type { NewPostPayload, PostType, Travel } from "./newPost/types";

interface MenuNewPostProps {
  data: Travel;
  navigation: { navigate: (screen: string, params: object) => void };
  onAddData: (payload: NewPostPayload) => void;
}

/* La callback `refresh` viaggia nei parametri di navigazione:
   React Navigation avvisa che non è serializzabile, ma qui è voluto. */
LogBox.ignoreLogs(["Non-serializable values were found in the navigation state"]);

/* FAB del dettaglio viaggio + bottom sheet di scelta del tipo di post */
export default function MenuNewPost({ data, navigation, onAddData }: MenuNewPostProps) {
  const [isSheetVisible, setSheetVisible] = useState(false);

  const openSheet = useCallback(() => setSheetVisible(true), []);
  const closeSheet = useCallback(() => setSheetVisible(false), []);

  const handleSelect = useCallback(
    (type: PostType) => {
      setSheetVisible(false);
      navigation.navigate("NewPost", { data, refresh: onAddData, type });
    },
    [navigation, data, onAddData]
  );

  return (
    <>
      <NewPostTypeSheet visible={isSheetVisible} onClose={closeSheet} onSelect={handleSelect} />

      <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={openSheet}>
        <MaterialCommunityIcons name="plus" size={24} color={ds.colors.white} />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: ds.space[6],
    bottom: 92,
    width: 52,
    height: 52,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.action,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    ...ds.shadow.lg,
  },
});
