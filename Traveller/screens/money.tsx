import React, { useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serverLink } from "../global/globalVariable";
import { ds } from "../global/designSystem";
import { EmptyState, OverscrollBackdrop, Sheet } from "../components/ui";
import { getData } from "../shared/data/localdata";
import MoneyHeader from "../shared/Headers/moneyHeaders";
import axios from "axios";
import SkeletonScreen from "../components/SkeletonScreen";
import { ApiPayedGroupByTravel } from "../shared/types/api";

/* Altezza massima delle colonne del grafico (come da design) */
const MAX_BAR_HEIGHT = 130;

export default function Money() {
    let [lastYear, setLastYear] = React.useState("-- ");
    let [totalToPay, setTotalToPay] = React.useState("-- ");
    let [totalToGet, setTotalToGet] = React.useState("-- ");
    let [payedGroupByTravel, setPayedGroupByTravel] = React.useState<ApiPayedGroupByTravel[]>([]);
    let [isLoading, setIsLoading] = React.useState(true);

    useEffect(() => {
        takeUserData();
    }, [])

    async function takeUserData() {
        setIsLoading(true)
        let aus = await getData("user");

        // Le prime tre chiamate restituiscono un totale come stringa
        // (es. "123.45"), l'ultima l'elenco delle spese raggruppate per viaggio.
        // NOTA: axios.all/axios.spread richiedono che tutte le response abbiano lo
        // stesso tipo, quindi qui si usa Promise.all (che axios.all comunque avvolge)
        // per mantenere le 4 response tipizzate singolarmente.
        Promise.all([
            axios.get<string>(serverLink + "api/post/takeTotalExpenses?userid=" + aus._id),
            axios.get<string>(serverLink + "api/post/takeTotalToPay?userid=" + aus._id),
            axios.get<string>(serverLink + "api/post/takeTotalToReceive?username=" + aus.username + "&userid=" + aus._id),
            axios.get<ApiPayedGroupByTravel[]>(serverLink + "api/post/takePayedGroupByTravel?userid=" + aus._id),
        ]).then(
            ([takeTotalExpenses, takeTotalToPay, takeTotalToReceive, takePayedGroupByTravel]) => {
                setLastYear(takeTotalExpenses.data);
                setTotalToPay(takeTotalToPay.data);
                setTotalToGet(takeTotalToReceive.data);
                setPayedGroupByTravel(takePayedGroupByTravel.data || []);
                setIsLoading(false);
            })
    }

    let [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        takeUserData();
        setRefreshing(false);
    }

    const money = (value: string) =>
        !isNaN(Number(value)) ? "€ " + Number(value).toFixed(2) : "€ --";

    /* Card statistica del riquadro 2x2 */
    const StatCard = ({
        label,
        value,
        color,
        icon,
        iconBg,
        iconColor,
    }: {
        label: string;
        value: string;
        color?: string;
        icon: string;
        iconBg: string;
        iconColor: string;
    }) => (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
                <MaterialCommunityIcons name={icon as any} size={14} color={iconColor} />
            </View>
            <Text style={styles.statLabel}>{label}</Text>
            {isLoading ? (
                <SkeletonScreen width={"80%"} height={22} borderRadius={4} />
            ) : (
                <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
            )}
        </View>
    );

    const maxTotal = payedGroupByTravel.reduce(
        (max, item) => (item.total > max ? item.total : max),
        0
    );

    return (
        <View style={styles.flex}>
            <OverscrollBackdrop topColor={ds.colors.brand} />
            <ScrollView
                style={styles.screen}
                contentContainerStyle={{ backgroundColor: ds.colors.brand, flexGrow: 1 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
            <View style={styles.container}>
                <MoneyHeader />

                <Sheet style={styles.sheet}>
                    <View style={styles.grid}>
                        <StatCard
                            label="Spese ultimi 12 mesi"
                            value={money(lastYear)}
                            icon="chart-timeline-variant"
                            iconBg={ds.colors.actionSubtle}
                            iconColor={ds.colors.action}
                        />
                        <StatCard
                            label="Spese ultimo mese"
                            value={money(lastYear)}
                            icon="calendar-month-outline"
                            iconBg={ds.colors.scale.primary[3]}
                            iconColor={ds.colors.scale.primary[11]}
                        />
                        <StatCard
                            label="Da pagare"
                            value={money(totalToPay)}
                            color={ds.colors.errorText}
                            icon="arrow-up-circle-outline"
                            iconBg={ds.colors.errorSoft}
                            iconColor={ds.colors.errorText}
                        />
                        <StatCard
                            label="Da ricevere"
                            value={money(totalToGet)}
                            color={ds.colors.successText}
                            icon="arrow-down-circle-outline"
                            iconBg={ds.colors.successSoft}
                            iconColor={ds.colors.successText}
                        />
                    </View>

                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Spese per viaggio</Text>

                        {isLoading ? (
                            <SkeletonScreen height={MAX_BAR_HEIGHT} width={"100%"} borderRadius={4} />
                        ) : payedGroupByTravel.length > 0 ? (
                            <View style={styles.chart}>
                                {payedGroupByTravel.map((item, index) => (
                                    <View key={index} style={styles.barGroup}>
                                        <Text style={styles.barAmount}>
                                            €{Math.round(item.total)}
                                        </Text>
                                        <LinearGradient
                                            colors={[ds.colors.action, ds.colors.brand]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 0, y: 1 }}
                                            style={[
                                                styles.bar,
                                                {
                                                    height: maxTotal
                                                        ? Math.max(6, (item.total / maxTotal) * MAX_BAR_HEIGHT)
                                                        : 6,
                                                },
                                            ]}
                                        />
                                        <Text style={styles.barLabel} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <EmptyState
                                icon="chart-bar"
                                title="Nessuna spesa registrata"
                            />
                        )}
                    </View>
                </Sheet>
            </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    screen: {
        backgroundColor: "transparent",
    },
    container: {
        flex: 1,
        backgroundColor: ds.colors.brand,
    },
    sheet: {
        paddingBottom: ds.layout.contentBottomPadding,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: ds.space[6],
    },
    statCard: {
        width: "48.5%",
        borderWidth: 1,
        borderColor: ds.colors.borderSubtle,
        borderRadius: ds.radius.l,
        padding: ds.space[5] - 2,
        marginBottom: ds.space[3] + 2,
    },
    statIcon: {
        width: 30,
        height: 30,
        borderRadius: ds.radius.m,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: ds.space[3] + 2,
    },
    statLabel: {
        fontFamily: ds.fontFamily.medium,
        fontSize: 11,
        color: ds.colors.textSecondary,
        marginBottom: ds.space[3] + 2,
    },
    statValue: {
        fontFamily: ds.fontFamily.metaBold,
        fontSize: 19,
        color: ds.colors.text,
    },
    chartCard: {
        borderWidth: 1,
        borderColor: ds.colors.borderSubtle,
        borderRadius: ds.radius.l,
        padding: ds.space[5],
    },
    chartTitle: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 14,
        color: ds.colors.text,
        marginBottom: ds.space[5],
    },
    chart: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        minHeight: MAX_BAR_HEIGHT + 40,
    },
    barGroup: {
        alignItems: "center",
        marginHorizontal: ds.space[3],
    },
    barAmount: {
        fontFamily: ds.fontFamily.metaSemibold,
        fontSize: 11,
        color: ds.colors.textSecondary,
        marginBottom: ds.space[3],
    },
    bar: {
        width: 34,
        borderTopLeftRadius: ds.radius.s,
        borderTopRightRadius: ds.radius.s,
        overflow: "hidden",
    },
    barLabel: {
        maxWidth: 60,
        fontFamily: ds.fontFamily.medium,
        fontSize: 10,
        color: ds.colors.textSecondary,
        marginTop: ds.space[3],
        textAlign: "center",
    },
});
