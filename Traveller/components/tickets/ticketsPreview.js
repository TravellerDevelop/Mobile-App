import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";

/* Colori ufficiali delle compagnie (fallback: blu azione) */
const companies = {
    "Ryanair": "#2B4779",
    "EasyJet": "#FF561F",
    "Alitalia": "#009FE3",
    "Ita": "#009FE3",
    "ITA Airways": "#009FE3",
    "Vueling": "#F5B912",
    "KLM": "#00A1DE",
};

/**
 * @param {{ item: any, takeInfo?: any, navigation?: any }} props
 */
export default function TicketsPreview({ item, takeInfo, navigation }) {
    const color = companies[item.company?.name] || ds.colors.action;

    return (
        <TouchableOpacity
            activeOpacity={navigation ? 0.9 : 1}
            onPress={() => {
                // In modalità offline (App.js) il componente è mostrato senza navigation
                if (navigation)
                    navigation.navigate("TicketsModal", { data: item, takeInfo: takeInfo });
            }}
        >
            <View style={[styles.container, { backgroundColor: color }]}>
                {/* Icona filigranata sullo sfondo, come da design */}
                <MaterialCommunityIcons
                    name="airplane-takeoff"
                    size={80}
                    color="rgba(255,255,255,0.08)"
                    style={styles.watermark}
                />

                <View style={styles.topRow}>
                    <Text style={styles.name} numberOfLines={1}>
                        {item.surname} {item.name}
                    </Text>
                    {item.company?.name ? (
                        <View style={styles.airlineBadge}>
                            <Text style={styles.airline}>{item.company.name}</Text>
                        </View>
                    ) : null}
                </View>

                <Text style={styles.flight}>Volo {item.flightNumber}</Text>
                {item.sharedBy ? (
                    <Text style={styles.sharedBy}>Condiviso da {item.sharedBy}</Text>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.bottomRow}>
                    <View style={styles.route}>
                        <Text style={styles.iata}>{item.from?.iata}</Text>
                        <MaterialCommunityIcons
                            name="arrow-right"
                            size={13}
                            color={ds.colors.onCoverMuted}
                            style={styles.routeIcon}
                        />
                        <Text style={styles.iata}>{item.to?.iata}</Text>
                    </View>
                    <Text style={styles.date}>
                        {new Date(item.date).toLocaleDateString("it-IT", { timeZone: "Europe/Andorra" })}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "relative",
        borderRadius: ds.radius.l,
        padding: ds.space[6] - 2,
        marginBottom: ds.space[5],
        overflow: "hidden",
        ...ds.shadow.lg,
    },
    watermark: {
        position: "absolute",
        right: -10,
        bottom: -14,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    name: {
        flex: 1,
        fontFamily: ds.fontFamily.semibold,
        fontSize: 14,
        color: ds.colors.white,
        marginRight: ds.space[3],
    },
    airlineBadge: {
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: ds.radius.full,
        paddingHorizontal: ds.space[3],
        paddingVertical: ds.space[1] + 1,
    },
    airline: {
        fontFamily: ds.fontFamily.metaSemibold,
        fontSize: 10,
        letterSpacing: 0.3,
        color: ds.colors.onCoverMuted,
    },
    flight: {
        fontFamily: ds.fontFamily.metaRegular,
        fontSize: 11,
        color: "rgba(255,255,255,0.72)",
        marginTop: ds.space[2] + 1,
    },
    sharedBy: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 11,
        color: "rgba(255,255,255,0.72)",
        marginTop: ds.space[1],
    },
    divider: {
        borderTopWidth: 2,
        borderStyle: "dashed",
        borderColor: "rgba(255,255,255,0.3)",
        marginTop: ds.space[5],
        marginBottom: ds.space[4] + 2,
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    route: {
        flexDirection: "row",
        alignItems: "center",
    },
    routeIcon: {
        marginHorizontal: ds.space[3],
    },
    iata: {
        fontFamily: ds.fontFamily.metaBold,
        fontSize: 18,
        color: ds.colors.white,
    },
    date: {
        fontFamily: ds.fontFamily.metaMedium,
        fontSize: 11,
        color: ds.colors.onCoverMuted,
    },
});
