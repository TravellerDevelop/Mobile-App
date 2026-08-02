import React, { useState, useRef } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { ds } from "../../global/designSystem";
import { ProgressTrack } from "../ui";

interface BudgetIndicatorProps {
    budget: number,
    spent: number,
    creator: boolean,
    personalbudget: number,
    setPersonalBudget: any
}

export default function BudgetIndicator({ budget, spent, creator, personalbudget, setPersonalBudget }: BudgetIndicatorProps) {
    let budgetInput: any = useRef<TextInput>(null);
    let [modalVisibility, setModalVisibility] = useState(false);
    const [selectedBudget, setselectedBudget] = useState("personal");
    const [translateY] = useState(new Animated.Value(-Dimensions.get("screen").height));

    let [percent, setPercent] = useState(0);
    let [personalPercent, setPersonalPercent] = useState(0);

    React.useEffect(() => {
        if (spent < budget) setPercent(spent / budget);
        else setPercent(1);

        if (spent < personalbudget) setPersonalPercent(spent / personalbudget);
        else setPersonalPercent(1);
    }, [spent, budget, personalbudget]);

    const closeModal = () => {
        setModalVisibility(false);
        Animated.timing(translateY, {
            toValue: -Dimensions.get("screen").height,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const openModal = () => {
        setModalVisibility(true);
        Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const panResponder: any = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (event, gestureState) => {
            if (gestureState.dy > 0) {
                translateY.setValue(gestureState.dy);
            }
        },
        onPanResponderRelease: (event, gestureState) => {
            if (gestureState.dy > Dimensions.get("screen").height / 20) {
                closeModal();
            } else {
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }).start();
            }
        },
    });

    /* Riga "speso / totale" + barra di avanzamento */
    const renderBar = (total: number, progress: number) => (
        <>
            <View style={styles.amountRow}>
                <Text style={styles.label}>
                    {selectedBudget === "travel" ? "Budget viaggio" : "Budget personale"}
                </Text>
                <Text style={styles.amount}>
                    € {Number(spent).toFixed(2)}
                    <Text style={styles.amountTotal}> / € {Number(total).toFixed(2)}</Text>
                </Text>
            </View>

            <ProgressTrack
                progress={progress}
                color={spent < total ? ds.colors.action : ds.colors.error}
            />

            <Text style={styles.hint}>
                {spent < total
                    ? "Hai ancora € " + (total - spent).toFixed(2) + " a disposizione"
                    : "Hai sforato il budget di € " + (spent - total).toFixed(2)}
            </Text>
        </>
    );

    return (
        <View style={styles.card}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisibility}
                onRequestClose={() => setModalVisibility(false)}
            >
                <TouchableWithoutFeedback onPress={closeModal}>
                    <View style={styles.modalBackground} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[styles.main, panResponder.panHandlers, { transform: [{ translateY }] }]}
                >
                    <View style={styles.main}>
                        {/* Contenuto della modale impostazione budget personale */}
                        <Text style={styles.modalTitle}>Imposta budget personale</Text>
                        <Text style={styles.modalSubtitle}>Imposta un budget unico per te</Text>
                        <TextInput
                            style={styles.input}
                            ref={budgetInput}
                            placeholder="Scrivi il budget"
                            placeholderTextColor={ds.colors.textPlaceholder}
                            inputMode="decimal"
                        />
                        <View style={styles.rowRight}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    budgetInput.current.value = '';
                                    setModalVisibility(false);
                                }}
                            >
                                <View style={[styles.btn, styles.btnGhost]}>
                                    <Text style={[styles.btnText, { color: ds.colors.text }]}>Annulla</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    setPersonalBudget(parseInt(budgetInput.current._lastNativeText));
                                    setModalVisibility(false);
                                }}
                            >
                                <View style={styles.btn}>
                                    <Text style={styles.btnText}>Conferma</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </Modal>

            {/* Selettore budget personale / del viaggio */}
            <View style={styles.tabs}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setselectedBudget("personal")}>
                    <View style={[styles.tab, selectedBudget === "personal" && styles.tabActive]}>
                        <Text style={[styles.tabText, selectedBudget === "personal" && styles.tabTextActive]}>
                            Personale
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setselectedBudget("travel")}>
                    <View style={[styles.tab, selectedBudget === "travel" && styles.tabActive]}>
                        <Text style={[styles.tabText, selectedBudget === "travel" && styles.tabTextActive]}>
                            Del viaggio
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {selectedBudget === "travel" && (
                budget && !isNaN(budget)
                    ? renderBar(budget, percent)
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
                personalbudget && !isNaN(personalbudget)
                    ? renderBar(personalbudget, personalPercent)
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
    modalBackground: {
        flex: 1,
        backgroundColor: ds.colors.scrim,
    },
    main: {
        backgroundColor: ds.colors.surface,
        borderTopLeftRadius: ds.radius["2xl"],
        borderTopRightRadius: ds.radius["2xl"],
        width: "100%",
        position: "absolute",
        bottom: 0,
        paddingTop: ds.space[5],
        paddingBottom: ds.space[6],
        paddingHorizontal: ds.space[5],
    },
    modalTitle: {
        fontFamily: ds.fontFamily.bold,
        fontSize: 16,
        color: ds.colors.text,
        marginBottom: ds.space[1],
    },
    modalSubtitle: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 12,
        color: ds.colors.textSecondary,
        marginBottom: ds.space[4],
    },
    input: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 13,
        color: ds.colors.text,
        height: ds.control.md,
        backgroundColor: ds.colors.surfaceSunken,
        borderWidth: 1,
        borderColor: ds.colors.border,
        borderRadius: ds.radius.m,
        paddingHorizontal: ds.space[4],
        marginBottom: ds.space[5],
    },
    rowRight: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    btn: {
        backgroundColor: ds.colors.action,
        height: ds.control.sm,
        minWidth: 100,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: ds.radius.m,
        marginLeft: ds.space[3],
    },
    btnGhost: {
        backgroundColor: ds.colors.surface,
        borderWidth: 1,
        borderColor: ds.colors.border,
    },
    btnText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 12,
        color: ds.colors.white,
        textAlign: "center",
    },
});
