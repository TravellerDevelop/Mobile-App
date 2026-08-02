import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";
import { SegmentedControl } from "../../components/newPost/fields";
import CreateTravelForm from "../../components/newTravel/CreateTravelForm";
import JoinTravelForm from "../../components/newTravel/JoinTravelForm";
import { useCreateTravelForm } from "../../components/newTravel/useCreateTravelForm";
import { useJoinTravel } from "../../components/newTravel/useJoinTravel";
import type { NewTravelTab } from "../../components/newTravel/types";

interface NewTravelProps {
  navigation: { goBack: () => void };
  route: {
    params?: {
      initialTab?: NewTravelTab;
      /** aggiorna la lista viaggi della home */
      updateTravels?: (username: string, userid: string) => void;
    };
  };
}

const tabs: ReadonlyArray<{ value: NewTravelTab; label: string }> = [
  { value: "create", label: "Crea viaggio" },
  { value: "join", label: "Unisciti" },
];

const subtitles: Record<NewTravelTab, string> = {
  create: "Crea un gruppo per organizzare il viaggio",
  join: "Unisciti a un gruppo esistente",
};

/* Schermata "Nuovo viaggio": crea un viaggio oppure entra con un codice */
export default function NewTravel({ navigation, route }: NewTravelProps) {
  const { initialTab = "create", updateTravels } = route.params ?? {};
  const [tab, setTab] = useState<NewTravelTab>(initialTab);

  const onDone = useCallback(
    (username: string, userid: string) => {
      updateTravels?.(username, userid);
      navigation.goBack();
    },
    [updateTravels, navigation]
  );

  const createForm = useCreateTravelForm({ onCreated: onDone });
  const joinForm = useJoinTravel({ onJoined: onDone });

  const isCreate = tab === "create";
  const canSubmit = isCreate ? createForm.canSubmit : joinForm.canSubmit;
  const isSubmitting = isCreate ? createForm.isSubmitting : joinForm.isSubmitting;
  const submit = isCreate ? createForm.submit : joinForm.submit;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Intestazione */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={navigation.goBack}>
          <View style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={17} color={ds.colors.text} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Nuovo viaggio</Text>
          <Text style={styles.subtitle}>{subtitles[tab]}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={isCreate ? styles.bodyCreate : styles.bodyJoin}
        keyboardShouldPersistTaps="handled"
      >
        {isCreate ? (
          <CreateTravelForm form={createForm} />
        ) : (
          <JoinTravelForm form={joinForm} />
        )}
      </ScrollView>

      {/* Azione principale */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={submit}
          disabled={!canSubmit || isSubmitting}
        >
          <View style={[styles.submit, !canSubmit && styles.submitDisabled]}>
            {isSubmitting ? (
              <ActivityIndicator color={ds.colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={isCreate ? "check-circle-outline" : "login"}
                  size={16}
                  color={ds.colors.white}
                />
                <Text style={styles.submitText}>
                  {isCreate ? "Crea viaggio" : "Entra nel viaggio"}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ds.colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 64,
    paddingHorizontal: ds.layout.screenPadding,
    paddingBottom: ds.space[4] + 2,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[3],
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    marginLeft: ds.space[4],
  },
  title: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 16,
    color: ds.colors.text,
  },
  subtitle: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  tabs: {
    paddingTop: ds.layout.screenPadding,
    paddingHorizontal: ds.layout.screenPadding,
  },
  body: {
    flex: 1,
  },
  bodyCreate: {
    paddingHorizontal: ds.layout.screenPadding,
    paddingTop: ds.space[5],
    paddingBottom: ds.space[6],
  },
  bodyJoin: {
    paddingHorizontal: ds.layout.screenPadding,
    paddingTop: ds.space[7],
    paddingBottom: ds.space[6],
  },
  footer: {
    paddingTop: ds.space[4],
    paddingHorizontal: ds.layout.screenPadding,
    // Stesso motivo di NewPost.tsx: la pillola flottante resta visibile
    // sopra questo modale e coprirebbe il pulsante senza questo margine.
    paddingBottom: ds.layout.contentBottomPadding,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },
  submit: {
    flexDirection: "row",
    height: ds.control.lg,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    alignItems: "center",
    justifyContent: "center",
    ...ds.shadow.md,
  },
  submitDisabled: {
    backgroundColor: ds.colors.disabledBg,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.white,
    marginLeft: ds.space[3] - 1,
  },
});
