/**
 * Preferenze notifiche.
 *
 * L'elenco dei tipi non è scritto qui: arriva dal catalogo del server
 * insieme alle preferenze (api/notifications/preferences), così aggiungere
 * un tipo di notifica lato server lo fa comparire in questa schermata
 * senza toccare il client.
 *
 * I tipi con `configurable: false` (richieste di follow, solleciti di
 * pagamento) vengono mostrati ma non si possono spegnere: sono l'unico modo
 * in cui l'utente scopre qualcosa che richiede una sua azione.
 */

import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";
import { useNotifications } from "../../components/notifications/NotificationsProvider";
import { visualFor } from "../../components/notifications/catalog";
import { NotificationCatalogEntry } from "../../components/notifications/types";

export default function NotificationSettings({ navigation }: { navigation: any }) {
  const notifications = useNotifications();
  const preferences = notifications.preferences;

  useEffect(() => {
    notifications.loadPreferences();
  }, []);

  /** Il catalogo raggruppato per categoria, nell'ordine dichiarato dal server. */
  const sections = useMemo(() => {
    if (!preferences) return [];
    return preferences.categories
      .map((category) => ({
        ...category,
        entries: preferences.catalog.filter((entry) => entry.category === category.key),
      }))
      .filter((section) => section.entries.length > 0);
  }, [preferences]);

  const renderEntry = (entry: NotificationCatalogEntry) => {
    const visual = visualFor(entry.type);
    const enabled = preferences?.types?.[entry.type] ?? true;

    // Spegnere le push globali non nasconde le notifiche dal centro: qui si
    // mostra il canale effettivo di ogni tipo per rendere la cosa evidente.
    const channels = [entry.push ? "push" : null, entry.center ? "centro notifiche" : null]
      .filter(Boolean)
      .join(" · ");

    return (
      <View key={entry.type} style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: visual.color + "14" }]}>
          <MaterialCommunityIcons name={visual.icon as any} size={17} color={visual.color} />
        </View>

        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{entry.label}</Text>
          <Text style={styles.rowDescription}>{entry.description}</Text>
          <Text style={styles.rowChannels}>{channels}</Text>
        </View>

        {entry.configurable ? (
          <Switch
            value={enabled}
            onValueChange={(value) => notifications.setTypeEnabled(entry.type, value)}
            trackColor={{ false: ds.colors.border, true: ds.colors.action }}
            thumbColor={ds.colors.white}
          />
        ) : (
          <View style={styles.always}>
            <Text style={styles.alwaysText}>Sempre</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={ds.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferenze notifiche</Text>
      </View>

      {!preferences ? (
        <ActivityIndicator style={{ marginTop: ds.space[8] }} color={ds.colors.brand} />
      ) : (
        <>
          <View style={styles.masterCard}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Notifiche push</Text>
              <Text style={styles.rowDescription}>
                Disattivandole non riceverai avvisi sul telefono, ma le notifiche
                continueranno a comparire nel centro notifiche.
              </Text>
            </View>
            <Switch
              value={preferences.pushEnabled}
              onValueChange={(value) => notifications.setPushEnabled(value)}
              trackColor={{ false: ds.colors.border, true: ds.colors.action }}
              thumbColor={ds.colors.white}
            />
          </View>

          {sections.map((section) => (
            <View key={section.key}>
              <Text style={styles.section}>{section.label}</Text>
              <View style={styles.card}>{section.entries.map(renderEntry)}</View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.surface,
  },
  content: {
    paddingHorizontal: ds.layout.screenPadding,
    paddingTop: 70,
    paddingBottom: ds.layout.contentBottomPadding,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ds.space[5],
  },
  headerTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 18,
    color: ds.colors.text,
    marginLeft: ds.space[4],
  },
  section: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: ds.colors.textPlaceholder,
    marginTop: ds.space[6],
    marginBottom: ds.space[3],
  },
  masterCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: ds.space[4],
  },
  card: {
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    paddingHorizontal: ds.space[4],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: ds.space[4],
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: ds.space[3] + 2,
  },
  rowBody: {
    flex: 1,
    paddingRight: ds.space[3],
  },
  rowTitle: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  rowDescription: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
    color: ds.colors.textSecondary,
    marginTop: 2,
  },
  rowChannels: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 10,
    color: ds.colors.textPlaceholder,
    marginTop: 3,
  },
  always: {
    paddingHorizontal: ds.space[3],
    paddingVertical: 4,
    borderRadius: ds.radius.s,
    backgroundColor: ds.colors.surfaceSunken,
  },
  alwaysText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 10,
    color: ds.colors.textSecondary,
  },
});
