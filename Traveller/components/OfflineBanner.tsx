/* ============================================================
   Traveller — Banner offline

   Sostituisce la vecchia schermata "Errore di connessione al server",
   che impediva di usare l'app senza rete. Ora l'app parte sempre con i
   dati salvati in locale e la mancanza di rete è un'informazione
   secondaria: una pillola sottile in cima.

   È un overlay in posizione assoluta, non un elemento di flusso: così
   non sposta di qualche pixel il contenuto di ogni schermata quando
   compare e scompare (gli header viola sono tarati sull'altezza dello
   status bar). Il margine dall'alto arriva dagli insets, per non
   finire sotto il notch.

   Tre stati:
   - offline: pillola ambra, tap per riprovare;
   - online con operazioni in coda: pillola blu, "invio in corso";
   - operazioni scartate dal server: pillola rossa, tap per chiudere.
   ============================================================ */

import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../global/designSystem";
import { useNetwork } from "../global/networkContext";

export default function OfflineBanner() {
  const { online, pending, dropped, dismissDropped, retry, syncing } = useNetwork();
  const insets = useSafeAreaInsets();

  if (online && pending === 0 && dropped.length === 0) return null;

  const position = [styles.floating, { top: insets.top + ds.space[2] }];

  if (!online) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => void retry()}
        style={[styles.bar, styles.offlineBar, ...position]}
      >
        <MaterialCommunityIcons name="cloud-off-outline" size={15} color={ds.colors.warningText} />
        <Text style={[styles.text, { color: ds.colors.warningText }]} numberOfLines={1}>
          {pending > 0
            ? `Sei offline — ${pending} ${pending === 1 ? "azione" : "azioni"} in attesa`
            : "Sei offline — stai vedendo i dati salvati"}
        </Text>
        {syncing ? (
          <ActivityIndicator size="small" color={ds.colors.warningText} />
        ) : (
          <Text style={[styles.action, { color: ds.colors.warningText }]}>Riprova</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (pending > 0) {
    return (
      <View style={[styles.bar, styles.syncBar, ...position]}>
        <ActivityIndicator size="small" color={ds.colors.action} />
        <Text style={[styles.text, { color: ds.colors.action }]} numberOfLines={1}>
          Invio di {pending} {pending === 1 ? "azione" : "azioni"} in corso…
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => void dismissDropped()}
      style={[styles.bar, styles.errorBar, ...position]}
    >
      <MaterialCommunityIcons name="alert-circle-outline" size={15} color={ds.colors.errorText} />
      <Text style={[styles.text, { color: ds.colors.errorText }]} numberOfLines={1}>
        {dropped.length === 1
          ? `"${dropped[0].label}" non è stato inviato`
          : `${dropped.length} operazioni non sono state inviate`}
      </Text>
      <Text style={[styles.action, { color: ds.colors.errorText }]}>Chiudi</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: "absolute",
    left: ds.space[3],
    right: ds.space[3],
    zIndex: 999,
    elevation: 20,
    borderRadius: ds.radius.full,
    ...ds.shadow.lg,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[2],
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[2] + 2,
  },
  offlineBar: {
    backgroundColor: ds.colors.warningSoft,
  },
  syncBar: {
    backgroundColor: ds.colors.actionSubtle,
  },
  errorBar: {
    backgroundColor: ds.colors.errorSoft,
  },
  text: {
    ...ds.type.caption,
    flex: 1,
  },
  action: {
    ...ds.type.caption,
    fontFamily: ds.fontFamily.semibold,
    textDecorationLine: "underline",
  },
});
