import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ds } from "../../global/designSystem";
import { ProgressTrack } from "../ui";
import { money } from "../money/format";
import { setPersonalBudget as savePersonalBudget } from "../money/api";

interface BudgetIndicatorProps {
    /** Budget condiviso deciso dal creatore del viaggio. */
    budget: number;
    /** Quanto ho già speso in questo viaggio (somma delle mie quote). */
    spent: number;
    /** true se l'utente è il creatore del viaggio: cambia solo il testo di aiuto. */
    creator: boolean;
    /** Budget personale corrente; null/0 se non impostato. */
    personalbudget: number;
    setPersonalBudget: (value: number) => void;
    /**
     * Id del viaggio e dell'utente: se presenti il budget personale viene
     * salvato sul server (api/travel/setPersonalBudget) e sopravvive alla
     * chiusura della schermata. Senza, resta solo in memoria come prima.
     */
    travelId?: string;
    userId?: string;
}

type Tab = "personal" | "travel";

export default function BudgetIndicator({
    budget,
    spent,
    creator,
    personalbudget,
    setPersonalBudget,
    travelId,
    userId,
}: BudgetIndicatorProps) {
    const [modalVisibility, setModalVisibility] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<Tab>("personal");
    const [draft, setDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    const hasTravelBudget = Number.isFinite(budget) && budget > 0;
    const hasPersonalBudget = Number.isFinite(personalbudget) && personalbudget > 0;

    /* Le percentuali sono derivate, non stato: tenerle in useState come
       prima significava un render in più a ogni cambio di spesa e il
       rischio di mostrare un valore vecchio per un frame. */
    const percent = useMemo(
        () => (hasTravelBudget ? Math.min(1, spent / budget) : 0),
        [spent, budget, hasTravelBudget]
    );
    const personalPercent = useMemo(
        () => (hasPersonalBudget ? Math.min(1, spent / personalbudget) : 0),
        [spent, personalbudget, hasPersonalBudget]
    );

    useEffect(() => {
        if (modalVisibility) {
            setDraft(hasPersonalBudget ? String(personalbudget) : "");
            setSaveError(null);
        }
    }, [modalVisibility, personalbudget, hasPersonalBudget]);

    const closeModal = () => {
        if (saving) return;
        setModalVisibility(false);
    };

    const openModal = () => setModalVisibility(true);

    /**
     * Salva il budget personale. Il valore viene letto dallo state del
     * TextInput: la versione precedente leggeva `ref.current._lastNativeText`
     * (API privata di React Native) e faceva `parseInt`, perdendo i decimali.
     */
    const confirmBudget = async () => {
        const value = parseFloat(draft.replace(",", "."));

        if (!Number.isFinite(value) || value <= 0) {
            setSaveError("Inserisci un importo maggiore di zero.");
            return;
        }

        setSaving(true);
        setSaveError(null);

        try {
            if (travelId && userId) await savePersonalBudget(travelId, userId, value);
            setPersonalBudget(value);
            setModalVisibility(false);
        } catch (error) {
            console.log("Budget personale", error);
            setSaveError("Non siamo riusciti a salvare il budget. Riprova.");
        } finally {
            setSaving(false);
        }
    };

    const onDraftChange = (text: string) => {
        setDraft(text);
        if (saveError) setSaveError(null);
    };

    /* Riga "speso / totale" + barra di avanzamento */
    const renderBar = (total: number, progress: number, editable: boolean) => {
        const over = spent > total;

        return (
            <>
                <View style={styles.amountRow}>
                    <Text style={styles.label}>
                        {selectedBudget === "travel" ? "Budget viaggio" : "Budget personale"}
                    </Text>
                    <View style={styles.amountRight}>
                        <Text style={styles.amount}>
                            {money(spent)}
                            <Text style={styles.amountTotal}> / {money(total)}</Text>
                        </Text>
                        {editable ? (
                            <TouchableOpacity onPress={openModal} hitSlop={8}>
                                <MaterialCommunityIcons
                                    name="pencil-outline"
                                    size={14}
                                    color={ds.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                <ProgressTrack progress={progress} color={over ? ds.colors.error : ds.colors.action} />

                <Text style={[styles.hint, over && { color: ds.colors.errorText }]}>
                    {over
                        ? "Hai sforato il budget di " + money(spent - total)
                        : "Hai ancora " + money(total - spent) + " a disposizione"}
                </Text>
            </>
        );
    };

    return (
        <View style={styles.card}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisibility}
                onRequestClose={closeModal}
            >
                <Pressable style={styles.modalBackdrop} onPress={closeModal} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.modalBody}
                >
                    <View style={[styles.sheet, { paddingBottom: ds.space[6] + insets.bottom }]}>
                        <View style={styles.sheetHandle} />

                        <View style={styles.sheetHead}>
                            <View style={styles.sheetIcon}>
                                <MaterialCommunityIcons
                                    name="wallet-outline"
                                    size={18}
                                    color={ds.colors.action}
                                />
                            </View>
                            <View style={styles.sheetHeadText}>
                                <Text style={styles.modalTitle}>
                                    {hasPersonalBudget ? "Modifica budget personale" : "Imposta budget personale"}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    Un tetto di spesa solo tuo, indipendente da quello del gruppo.
                                </Text>
                            </View>
                            <TouchableOpacity onPress={closeModal} hitSlop={10} disabled={saving}>
                                <MaterialCommunityIcons
                                    name="close"
                                    size={20}
                                    color={ds.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.inputRow, saveError && styles.inputRowError]}>
                            <Text style={styles.inputPrefix}>€</Text>
                            <TextInput
                                style={styles.input}
                                value={draft}
                                onChangeText={onDraftChange}
                                placeholder="0"
                                placeholderTextColor={ds.colors.textPlaceholder}
                                inputMode="decimal"
                                autoFocus
                            />
                        </View>

                        {saveError ? (
                            <View style={styles.errorRow}>
                                <MaterialCommunityIcons
                                    name="alert-circle-outline"
                                    size={14}
                                    color={ds.colors.errorText}
                                />
                                <Text style={styles.error}>{saveError}</Text>
                            </View>
                        ) : (
                            <Text style={styles.hintSmall}>
                                Speso finora in questo viaggio: {money(spent)}
                            </Text>
                        )}

                        <View style={styles.actions}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={closeModal}
                                disabled={saving}
                                style={{ flex: 1 }}
                            >
                                <View style={[styles.btn, styles.btnGhost]}>
                                    <Text style={[styles.btnText, { color: ds.colors.text }]}>Annulla</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={confirmBudget}
                                disabled={saving}
                                style={{ flex: 1 }}
                            >
                                <View style={[styles.btn, saving && styles.btnDisabled]}>
                                    {saving ? (
                                        <ActivityIndicator size="small" color={ds.colors.white} />
                                    ) : (
                                        <Text style={styles.btnText}>Conferma</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Selettore budget personale / del viaggio */}
            <View style={styles.tabs}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedBudget("personal")}>
                    <View style={[styles.tab, selectedBudget === "personal" && styles.tabActive]}>
                        <Text style={[styles.tabText, selectedBudget === "personal" && styles.tabTextActive]}>
                            Personale
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedBudget("travel")}>
                    <View style={[styles.tab, selectedBudget === "travel" && styles.tabActive]}>
                        <Text style={[styles.tabText, selectedBudget === "travel" && styles.tabTextActive]}>
                            Del viaggio
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {selectedBudget === "travel" && (
                hasTravelBudget
                    ? renderBar(budget, percent, false)
                    : (
                        <>
                            <Text style={styles.emptyTitle}>Nessun budget impostato</Text>
                            <Text style={styles.emptyHint}>
                                {creator
                                    ? "Accedi alle impostazioni del viaggio per impostarne uno"
                                    : "Chiedi all'admin di impostarne uno"}
                            </Text>
                        </>
                    )
            )}

            {selectedBudget === "personal" && (
                hasPersonalBudget
                    ? renderBar(personalbudget, personalPercent, true)
                    : (
                        <TouchableOpacity activeOpacity={0.7} onPress={openModal}>
                            <View>
                                <Text style={styles.emptyTitle}>Nessun budget impostato</Text>
                                <Text style={styles.emptyHint}>Tocca qui per impostarne uno</Text>
                            </View>
                        </TouchableOpacity>
                    )
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderColor: ds.colors.borderSubtle,
        borderRadius: ds.radius.l,
        backgroundColor: ds.colors.surface,
        padding: ds.space[5] - 2,
        marginBottom: ds.space[6],
    },
    tabs: {
        flexDirection: "row",
        marginBottom: ds.space[5],
    },
    tab: {
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabActive: {
        borderBottomColor: ds.colors.action,
    },
    tabText: {
        fontFamily: ds.fontFamily.medium,
        fontSize: 12,
        color: ds.colors.textSecondary,
    },
    tabTextActive: {
        fontFamily: ds.fontFamily.semibold,
        color: ds.colors.text,
    },
    amountRow: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginBottom: ds.space[3],
    },
    amountRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: ds.space[3],
    },
    label: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 12,
        color: ds.colors.textSecondary,
    },
    amount: {
        fontFamily: ds.fontFamily.metaBold,
        fontSize: 15,
        color: ds.colors.text,
    },
    amountTotal: {
        fontFamily: ds.fontFamily.metaRegular,
        fontSize: 12,
        color: ds.colors.textSecondary,
    },
    hint: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 11,
        color: ds.colors.textSecondary,
        marginTop: ds.space[3],
    },
    emptyTitle: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.text,
        marginBottom: ds.space[1],
    },
    emptyHint: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 11,
        color: ds.colors.textSecondary,
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
    sheet: {
        backgroundColor: ds.colors.surface,
        borderTopLeftRadius: ds.radius["2xl"],
        borderTopRightRadius: ds.radius["2xl"],
        paddingTop: ds.space[4],
        paddingBottom: ds.space[8],
        paddingHorizontal: ds.space[5],
    },
    sheetHandle: {
        alignSelf: "center",
        width: 38,
        height: 4,
        borderRadius: ds.radius.full,
        backgroundColor: ds.colors.scale.neutral[5],
        marginBottom: ds.space[5],
    },
    sheetHead: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: ds.space[4] - 1,
        marginBottom: ds.space[6],
    },
    sheetIcon: {
        width: 36,
        height: 36,
        borderRadius: ds.radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: ds.colors.actionSubtle,
    },
    sheetHeadText: {
        flex: 1,
    },
    modalTitle: {
        fontFamily: ds.fontFamily.bold,
        fontSize: 15,
        color: ds.colors.text,
        marginBottom: ds.space[1],
    },
    modalSubtitle: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 12,
        lineHeight: 16,
        color: ds.colors.textSecondary,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        height: ds.control.lg,
        backgroundColor: ds.colors.surfaceSunken,
        borderWidth: 1,
        borderColor: ds.colors.border,
        borderRadius: ds.radius.m,
        paddingHorizontal: ds.space[4],
        marginBottom: ds.space[3],
    },
    inputRowError: {
        borderColor: ds.colors.error,
    },
    inputPrefix: {
        fontFamily: ds.fontFamily.metaBold,
        fontSize: 18,
        color: ds.colors.textSecondary,
        marginRight: ds.space[2] + 2,
    },
    input: {
        flex: 1,
        padding: 0,
        fontFamily: ds.fontFamily.metaBold,
        fontSize: 18,
        color: ds.colors.text,
    },
    errorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: ds.space[2],
        marginBottom: ds.space[5],
    },
    error: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 11,
        color: ds.colors.errorText,
    },
    hintSmall: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 11,
        color: ds.colors.textSecondary,
        marginBottom: ds.space[5],
    },
    actions: {
        flexDirection: "row",
        gap: ds.space[3],
    },
    btn: {
        flex: 1,
        backgroundColor: ds.colors.action,
        height: ds.control.md,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: ds.radius.m,
    },
    btnGhost: {
        backgroundColor: ds.colors.surface,
        borderWidth: 1,
        borderColor: ds.colors.border,
    },
    btnDisabled: {
        backgroundColor: ds.colors.disabledBg,
    },
    btnText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 12,
        color: ds.colors.white,
        textAlign: "center",
    },
});
