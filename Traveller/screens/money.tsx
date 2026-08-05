/* ============================================================
   Tab "Money" — riepilogo economico di tutti i viaggi.

   Tre viste sulla stessa risposta di api/post/takeMoneyOverview:
   - Panoramica: quanto ho speso e dove;
   - Saldi: con chi sono in credito o in debito, con azione di saldo;
   - Movimenti: l'elenco filtrabile dei singoli pagamenti.

   Tutta la logica sta in components/money/useMoney; qui c'è solo
   composizione di UI.
   ============================================================ */

import React, { useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ds } from "../global/designSystem";
import { EmptyState, OverscrollBackdrop, SearchField, SectionLabel, Sheet } from "../components/ui";
import MoneyHeader from "../shared/Headers/moneyHeaders";
import SkeletonScreen from "../components/SkeletonScreen";
import { useMoney } from "../components/money/useMoney";
import { money, percentChange } from "../components/money/format";
import {
    BalanceRow,
    ErrorNotice,
    FilterBar,
    MovementDetail,
    MovementRow,
    MoneyHero,
    SegmentedTabs,
    StatCard,
    TrendChart,
    TravelBreakdown,
} from "../components/money/parts";
import { MoneyMovement, MoneyTab } from "../components/money/types";
import { formatSavedAt } from "../shared/data/offlineCache";

/** Quante righe di movimenti mostrare prima del "carica altri". */
const PAGE_SIZE = 25;

export default function Money() {
    const {
        overview,
        loading,
        refreshing,
        error,
        stale,
        refresh,
        reload,
        filter,
        setFilter,
        travelFilter,
        setTravelFilter,
        query,
        setQuery,
        hasFilters,
        clearFilters,
        movements,
        credits,
        debts,
        settleUp,
        settlingId,
        nudge,
    } = useMoney();

    const [tab, setTab] = useState<MoneyTab>("overview");
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [selected, setSelected] = useState<MoneyMovement | null>(null);

    const totals = overview?.totals;
    const byMonth = overview?.byMonth ?? [];

    /* Variazione del mese corrente rispetto al precedente: dà un contesto
       che il valore assoluto da solo non ha. */
    const monthDelta = useMemo(() => {
        if (byMonth.length < 2) return null;
        const current = byMonth[byMonth.length - 1];
        const previous = byMonth[byMonth.length - 2];
        const change = percentChange(current.total, previous.total);
        if (change === null || change === 0) return null;
        return {
            text: `${change > 0 ? "+" : ""}${change}% sul mese scorso`,
            tone: (change > 0 ? "up" : "down") as "up" | "down",
        };
    }, [byMonth]);

    const currentMonth = byMonth.length ? byMonth[byMonth.length - 1].total : 0;
    const openBalances = credits.length + debts.length;

    /* Se cambio filtro, la paginazione riparte: altrimenti restando a
       pagina 3 di un elenco che ora ha 4 righe si vedrebbe un "carica
       altri" che non carica nulla. */
    const resetPaging = () => setVisibleCount(PAGE_SIZE);

    return (
        <View style={styles.flex}>
            <OverscrollBackdrop topColor={ds.colors.brand} />

            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            >
                <View style={styles.container}>
                    <MoneyHeader>
                        <MoneyHero
                            net={totals?.net ?? 0}
                            toReceive={totals?.toReceive ?? 0}
                            toPay={totals?.toPay ?? 0}
                            loading={loading}
                        />
                    </MoneyHeader>

                    <Sheet style={styles.sheet}>
                        {error ? <ErrorNotice message={error} onRetry={() => reload()} /> : null}

                        {/* Saldi e movimenti sono numeri su cui si prendono
                            decisioni ("chi deve cosa a chi"): se arrivano dalla
                            cache va detto quando sono stati scaricati. */}
                        {!error && stale ? (
                            <Text style={styles.staleNotice}>
                                Dati offline, aggiornati alle {formatSavedAt(stale)}
                            </Text>
                        ) : null}

                        <SegmentedTabs
                            value={tab}
                            onChange={(next) => {
                                setTab(next);
                                resetPaging();
                            }}
                            badges={{
                                balances: openBalances,
                                // Il conteggio è quello delle righe effettivamente
                                // scaricate (il server ne restituisce al massimo 200).
                                movements: overview?.movements.length,
                            }}
                        />

                        {/* ---- Panoramica ---------------------------------- */}
                        {tab === "overview" ? (
                            <>
                                <View style={styles.grid}>
                                    <StatCard
                                        label="Spese ultimi 12 mesi"
                                        value={money(totals?.last12Months)}
                                        icon="chart-timeline-variant"
                                        iconBg={ds.colors.actionSubtle}
                                        iconColor={ds.colors.action}
                                        loading={loading}
                                    />
                                    <StatCard
                                        label="Questo mese"
                                        value={money(currentMonth)}
                                        icon="calendar-month-outline"
                                        iconBg={ds.colors.scale.primary[3]}
                                        iconColor={ds.colors.scale.primary[11]}
                                        hint={monthDelta?.text}
                                        hintTone={monthDelta?.tone}
                                        loading={loading}
                                    />
                                    <StatCard
                                        label="Ultimi 30 giorni"
                                        value={money(totals?.last30Days)}
                                        icon="clock-outline"
                                        iconBg={ds.colors.warningSoft}
                                        iconColor={ds.colors.warningText}
                                        loading={loading}
                                    />
                                    <StatCard
                                        label="Spese personali"
                                        value={money(totals?.personal)}
                                        icon="account-outline"
                                        iconBg={ds.colors.infoSoft}
                                        iconColor={ds.colors.infoText}
                                        loading={loading}
                                    />
                                </View>

                                <TrendChart data={byMonth} loading={loading} />

                                <TravelBreakdown
                                    data={overview?.byTravel ?? []}
                                    loading={loading}
                                    onSelect={(travel) => {
                                        // Dal viaggio si salta ai suoi movimenti già filtrati.
                                        setTravelFilter(travel.travelId);
                                        setFilter("all");
                                        setTab("movements");
                                        resetPaging();
                                    }}
                                />
                            </>
                        ) : null}

                        {/* ---- Saldi --------------------------------------- */}
                        {tab === "balances" ? (
                            loading ? (
                                <SkeletonScreen width={"100%"} height={220} borderRadius={ds.radius.l} />
                            ) : openBalances === 0 ? (
                                <EmptyState
                                    icon="handshake-outline"
                                    title="Sei in pari"
                                    description="Nessun debito o credito aperto con i tuoi compagni di viaggio."
                                />
                            ) : (
                                <>
                                    {credits.length > 0 ? (
                                        <View style={styles.section}>
                                            <SectionLabel>Ti devono</SectionLabel>
                                            <View style={styles.listCard}>
                                                {credits.map((balance, index) => (
                                                    <BalanceRow
                                                        key={balance.userid}
                                                        balance={balance}
                                                        incoming
                                                        busy={settlingId === balance.userid}
                                                        onSettle={() => settleUp(balance)}
                                                        onNudge={() => nudge(balance)}
                                                        last={index === credits.length - 1}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                    ) : null}

                                    {debts.length > 0 ? (
                                        <View style={styles.section}>
                                            <SectionLabel>Devi</SectionLabel>
                                            <View style={styles.listCard}>
                                                {debts.map((balance, index) => (
                                                    <BalanceRow
                                                        key={balance.userid}
                                                        balance={balance}
                                                        incoming={false}
                                                        onNudge={() => nudge(balance)}
                                                        last={index === debts.length - 1}
                                                    />
                                                ))}
                                            </View>
                                            <Text style={styles.note}>
                                                Un debito lo può chiudere solo chi ha anticipato la spesa:
                                                da qui puoi avvisarlo che hai pagato.
                                            </Text>
                                        </View>
                                    ) : null}
                                </>
                            )
                        ) : null}

                        {/* ---- Movimenti ----------------------------------- */}
                        {tab === "movements" ? (
                            <>
                                <SearchField
                                    placeholder="Cerca per descrizione o viaggio"
                                    value={query}
                                    onChangeText={(text) => {
                                        setQuery(text);
                                        resetPaging();
                                    }}
                                    style={styles.search}
                                />

                                <FilterBar
                                    value={filter}
                                    onChange={(next) => {
                                        setFilter(next);
                                        resetPaging();
                                    }}
                                    travels={overview?.byTravel ?? []}
                                    travelFilter={travelFilter}
                                    onTravelChange={(next) => {
                                        setTravelFilter(next);
                                        resetPaging();
                                    }}
                                />

                                {loading ? (
                                    <SkeletonScreen width={"100%"} height={260} borderRadius={ds.radius.l} />
                                ) : movements.length === 0 ? (
                                    <EmptyState
                                        icon="receipt"
                                        title={hasFilters ? "Nessun risultato" : "Nessun movimento"}
                                        description={
                                            hasFilters
                                                ? "Prova a togliere qualche filtro."
                                                : "Le spese divise con i tuoi compagni di viaggio compariranno qui."
                                        }
                                    />
                                ) : (
                                    <>
                                        <View style={styles.listCard}>
                                            {movements.slice(0, visibleCount).map((movement, index, list) => (
                                                <MovementRow
                                                    key={movement._id}
                                                    movement={movement}
                                                    onPress={() => setSelected(movement)}
                                                    last={index === list.length - 1}
                                                />
                                            ))}
                                        </View>

                                        {movements.length > visibleCount ? (
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => setVisibleCount((v) => v + PAGE_SIZE)}
                                            >
                                                <View style={styles.loadMore}>
                                                    <Text style={styles.loadMoreText}>
                                                        Mostra altri {Math.min(PAGE_SIZE, movements.length - visibleCount)}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ) : null}
                                    </>
                                )}

                                {hasFilters ? (
                                    <TouchableOpacity activeOpacity={0.7} onPress={clearFilters}>
                                        <Text style={styles.clearFilters}>Azzera i filtri</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </>
                        ) : null}
                    </Sheet>
                </View>
            </ScrollView>

            {/* Dettaglio di un movimento: pannello locale, perché la schermata
                "Dettagli pagamento" vive in un altro NavigationContainer. */}
            <Modal
                visible={selected !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setSelected(null)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)} />
                <View style={styles.modalBody}>
                    {selected ? (
                        <MovementDetail movement={selected} onClose={() => setSelected(null)} />
                    ) : null}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    staleNotice: {
        ...ds.type.meta,
        color: ds.colors.warningText,
        marginBottom: ds.space[3],
    },
    screen: {
        backgroundColor: "transparent",
    },
    scrollContent: {
        backgroundColor: ds.colors.brand,
        flexGrow: 1,
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
    },
    section: {
        marginBottom: ds.space[6],
    },
    listCard: {
        borderWidth: 1,
        borderColor: ds.colors.borderSubtle,
        borderRadius: ds.radius.l,
        backgroundColor: ds.colors.surface,
        overflow: "hidden",
    },
    note: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 11,
        lineHeight: 16,
        color: ds.colors.textSecondary,
        marginTop: ds.space[3],
    },
    search: {
        marginBottom: ds.space[4],
    },
    loadMore: {
        height: ds.control.md,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: ds.radius.m,
        borderWidth: 1,
        borderColor: ds.colors.border,
        marginTop: ds.space[4],
    },
    loadMoreText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 12,
        color: ds.colors.action,
    },
    clearFilters: {
        fontFamily: ds.fontFamily.medium,
        fontSize: 12,
        color: ds.colors.textSecondary,
        textAlign: "center",
        marginTop: ds.space[5],
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: ds.colors.scrim,
    },
    modalBody: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
    },
});
