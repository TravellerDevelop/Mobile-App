import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { ds } from "../../global/designSystem";
import { POST_TYPE_OPTIONS } from "./postTypes";
import type { PostType } from "./types";

interface NewPostTypeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: PostType) => void;
}

/* Bottom sheet di scelta del tipo di post (design "Nuovo post") */
export default function NewPostTypeSheet({ visible, onClose, onSelect }: NewPostTypeSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(160)} style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={SlideInDown.duration(240)}
          exiting={SlideOutDown.duration(180)}
          style={styles.sheet}
        >
          <View style={styles.grabber} />

          <Text style={styles.title}>Nuovo post</Text>
          <Text style={styles.subtitle}>
            Scegli il tipo di contenuto da condividere nel viaggio
          </Text>

          <View style={styles.options}>
            {POST_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                activeOpacity={0.7}
                onPress={() => onSelect(option.type)}
              >
                <View style={styles.option}>
                  <View style={[styles.optionTile, { backgroundColor: option.color }]}>
                    <MaterialCommunityIcons
                      name={option.icon as never}
                      size={18}
                      color={ds.colors.white}
                    />
                  </View>

                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={18}
                    color={ds.colors.scale.neutral[8]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
            <Text style={styles.cancel}>Annulla</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: ds.colors.scrim,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.layout.sheetRadius,
    borderTopRightRadius: ds.layout.sheetRadius,
    paddingTop: ds.space[4] + 2,
    paddingHorizontal: ds.space[6],
    paddingBottom: ds.space[9],
    ...ds.shadow.lg,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[6],
    alignSelf: "center",
    marginBottom: ds.space[5] + 2,
  },
  title: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 19,
    color: ds.colors.text,
    marginBottom: ds.space[2],
  },
  subtitle: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[5] + 2,
  },
  options: {
    gap: ds.space[3] + 2,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: ds.space[4],
  },
  optionTile: {
    width: 40,
    height: 40,
    borderRadius: ds.radius.m,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
    marginHorizontal: ds.space[4],
  },
  optionLabel: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.text,
  },
  optionDescription: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  cancel: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.textSecondary,
    textAlign: "center",
    marginTop: ds.space[6],
  },
});
