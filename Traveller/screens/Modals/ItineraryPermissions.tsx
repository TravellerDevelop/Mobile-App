import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";
import { PERMISSION_MODE_OPTIONS } from "../../components/itinerary/categories";
import { updateMode } from "../../components/itinerary/api";
import { getData } from "../../shared/data/localdata";
import type { ItineraryPermissionMode } from "../../components/itinerary/types";

/* ============================================================
   Permessi dell'itinerario: come il gruppo lavora sul piano.
   Solo il creatore del viaggio arriva qui (il server rifiuta
   comunque la scrittura da chiunque altro).
   ============================================================ */

export default function ItineraryPermissions({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const travel = route.params?.travel ?? {};
  const onSaved: (() => void) | undefined = route.params?.onSaved;

  const [mode, setMode] = useState<ItineraryPermissionMode>(route.params?.mode ?? "open");
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const user = await getData("user");
      await updateMode(travel._id, user._id, mode);
      onSaved?.();
      navigation.goBack();
    } catch (err: any) {
      const message = err?.response?.data;
      Alert.alert(
        "Permessi",
        typeof message === "string" ? message : "Non sono riuscito a salvare la modalità"
      );
    } finally {
      setSaving(false);
    }
  }, [travel._id, mode, onSaved, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={hitSlop}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={ds.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Permessi itinerario</Text>
          <Text style={styles.headerSubtitle}>Scegli come il gruppo lavora sul piano</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {PERMISSION_MODE_OPTIONS.map((option) => {
          const active = option.value === mode;

          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.85}
              onPress={() => setMode(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.card, active && styles.cardActive]}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons
                    name={option.icon as never}
                    size={17}
                    color={ds.colors.action}
                  />
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  <Text style={styles.cardDescription}>{option.description}</Text>
                </View>

                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.notice}>
          <MaterialCommunityIcons
            name="information-outline"
            size={14}
            color={ds.colors.infoText}
            style={styles.noticeIcon}
          />
          <Text style={styles.noticeText}>
            Se cambi modalità a itinerario avviato, le proposte in sospeso restano visibili
            come bozze finché non le chiudi tu.
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity activeOpacity={0.85} onPress={save} disabled={saving} style={styles.saveButton}>
        <View style={styles.saveInner}>
          {saving ? (
            <ActivityIndicator size="small" color={ds.colors.white} />
          ) : (
            <Text style={styles.saveText}>Salva modalità</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[4],
    paddingHorizontal: ds.layout.screenPadding,
    paddingTop: 64,
    paddingBottom: ds.space[5] - 2,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 16,
    color: ds.colors.text,
  },
  headerSubtitle: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginTop: 1,
  },
  content: {
    padding: ds.layout.screenPadding,
    paddingTop: ds.space[6],
    paddingBottom: ds.layout.actionBarContentPadding,
  },
  card: {
    flexDirection: "row",
    gap: ds.space[4],
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: ds.space[5] - 2,
    marginBottom: ds.space[3] + 2,
    backgroundColor: ds.colors.surface,
  },
  cardActive: {
    borderWidth: 1.5,
    borderColor: ds.colors.action,
    backgroundColor: ds.colors.actionSubtle,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.scale.neutral[3],
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.text,
    marginBottom: 3,
  },
  cardDescription: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    color: ds.colors.textSecondary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: ds.radius.full,
    borderWidth: 2,
    borderColor: ds.colors.border,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: ds.colors.action,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.action,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: ds.colors.infoSoft,
    borderRadius: ds.radius.m,
    padding: ds.space[4],
    marginTop: ds.space[5],
  },
  noticeIcon: {
    marginRight: ds.space[3],
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontFamily: ds.fontFamily.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: ds.colors.infoText,
  },
  saveButton: {
    position: "absolute",
    left: ds.layout.screenPadding,
    right: ds.layout.screenPadding,
    bottom: ds.layout.actionBarBottom,
  },
  saveInner: {
    height: 50,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    alignItems: "center",
    justifyContent: "center",
    ...ds.shadow.lg,
  },
  saveText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.white,
  },
});
