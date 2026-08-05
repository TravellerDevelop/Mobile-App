import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { serverLink } from "../global/globalVariable";
import { ds } from "../global/designSystem";
import { InitialsAvatar, OverscrollBackdrop, SectionLabel, StatusBadge } from "../components/ui";
import { getData } from "../shared/data/localdata";
import { apiSend } from "../shared/data/apiClient";
import { cacheKeys, readCache, writeCache } from "../shared/data/offlineCache";
import { isNetworkError, markOffline, markOnline } from "../shared/data/netStatus";
import { money } from "../components/money/format";
import { notifyDebt } from "../components/money/api";
import { ApiPaymentPost, ApiPostCreatorData, ApiPostDestinator, ApiUser } from "../shared/types/api";

/** Destinatario di un pagamento, arricchito lato client con il nome da mostrare. */
interface PaymentDestinatorWithName extends ApiPostDestinator {
    nameShow?: string;
}

/** Post di tipo pagamento così come arriva via route.params, eventualmente con i dati del creatore già uniti. */
interface PaymentItem extends Omit<ApiPaymentPost, "destinator"> {
    destinator: PaymentDestinatorWithName[];
    creatorData?: ApiPostCreatorData[];
}

/** Esito dell'ultima notifica inviata, mostrato al posto della vecchia Alert "in arrivo". */
type NotifyState = "idle" | "sending" | "sent" | "error";

export default function PaymentInfo({ navigation, route }: { navigation: any; route: any }) {
    let [items, setItems] = useState<PaymentItem>(route.params.item);
    let [myData, setMyData] = useState<any>({});
    let [savingId, setSavingId] = useState<string | null>(null);
    let [settlingAll, setSettlingAll] = useState(false);
    let [notifyState, setNotifyState] = useState<NotifyState>("idle");

    async function getUserData() {
        const data = await getData("user");
        setMyData(data);

        const ids = items.destinator.map((d) => d.userid);

        /* I nomi dei destinatari sono l'unica cosa che manca al post per
           essere leggibile: senza, offline si vedrebbero degli ObjectId.
           L'endpoint è una POST (la lista di id sta nel body) e quindi non
           passa da apiGet: la cache la gestiamo qui a mano. */
        const cacheKey = cacheKeys.usernames(items._id);
        let users: ApiUser[] | null = null;

        try {
            const response = await axios.post<ApiUser[]>(
                serverLink + "api/user/fromIdToUsernames",
                { id: ids }
            );
            users = response.data;
            markOnline();
            await writeCache(cacheKey, users);
        } catch (error) {
            if (isNetworkError(error)) markOffline();
            else console.log(error);
            users = (await readCache<ApiUser[]>(cacheKey))?.data ?? null;
        }

        if (!users) return;

        // Copia nuova invece di mutare `items.destinator` in place: la
        // versione precedente mutava l'oggetto e si affidava a uno state
        // fittizio ("extraData") per forzare il re-render.
        const resolved = users;
        setItems((prev) => ({
            ...prev,
            destinator: prev.destinator.map((dest) => {
                const user = resolved.find((u) => u._id == dest.userid);
                return user ? { ...dest, nameShow: `${user.name} ${user.surname}` } : dest;
            }),
        }));
    }

    useEffect(() => {
        getUserData();
    }, []);

    /* `creator` sul post è l'ObjectId dell'utente, non lo username: il
       confronto precedente (`myData.username == items.creator`) non era mai
       vero, quindi nemmeno chi aveva creato il pagamento riusciva a segnare
       una quota come saldata. Si confrontano gli id, con fallback sullo
       username per i post storici salvati prima della conversione. */
    const myId = String(myData?._id || "");
    const creatorId = String(items.creatorData?.[0]?._id || items.creator || "");
    const isCreator =
        (myId !== "" && myId === creatorId) || myData?.username === items.creator;

    /** Salva l'elenco destinatari sul server e allinea lo stato locale. */
    const persist = (nextDestinator: PaymentDestinatorWithName[]) =>
        apiSend(
            serverLink + "api/post/updatePayment",
            {
                id: items._id,
                // Il travel id serve al server per invalidare la cache del feed:
                // senza, il viaggio continuava a mostrare lo stato di pagamento vecchio.
                travelid: items.travel,
                destinator: nextDestinator.map(({ userid, payed }) => ({ userid, payed })),
            },
            {
                /* Offline va in coda e lo stato locale viene comunque
                   aggiornato: chi ha creato il pagamento sta spuntando
                   "ha pagato" al tavolo, spesso senza campo. */
                queue: {
                    label: "Quote pagate",
                    invalidates: [
                        cacheKeys.travelPosts(items.travel),
                        ...(myData?._id ? [cacheKeys.moneyOverview(myData._id)] : []),
                    ],
                },
            }
        ).then(() => {
            setItems((prev) => ({ ...prev, destinator: nextDestinator }));
        });

    /* Tocca la riga di un destinatario per segnarlo pagato/non pagato
       (solo il creatore del pagamento può farlo). Sostituisce la vecchia
       modale di modifica con un'interazione diretta sulla riga. */
    const togglePaid = (dest: PaymentDestinatorWithName) => {
        if (!isCreator || savingId || settlingAll) return;

        const nextDestinator = items.destinator.map((d) =>
            d.userid === dest.userid ? { ...d, payed: !d.payed } : d
        );

        setSavingId(dest.userid);
        persist(nextDestinator)
            .catch((error) => console.log(error))
            .finally(() => setSavingId(null));
    };

    /** Segna saldati in un colpo solo tutti i destinatari mancanti. */
    const settleAll = () => {
        if (!isCreator || savingId || settlingAll) return;

        setSettlingAll(true);
        persist(items.destinator.map((d) => ({ ...d, payed: true })))
            .catch((error) => console.log(error))
            .finally(() => setSettlingAll(false));
    };

    /**
     * Sollecito (se ho creato io il pagamento) verso chi non ha ancora
     * saldato, oppure avviso "ho pagato" verso il creatore.
     * Prima era un placeholder che apriva una Alert "disponibile presto".
     */
    const sendNotification = async () => {
        if (notifyState === "sending" || !myData._id) return;

        setNotifyState("sending");
        try {
            const targets = isCreator
                ? items.destinator.filter((d) => !d.payed).map((d) => d.userid)
                : [items.creatorData?.[0]?._id].filter(Boolean) as string[];

            await Promise.all(
                targets.map((userid) =>
                    notifyDebt({
                        fromUserId: myData._id,
                        toUserId: userid,
                        kind: isCreator ? "reminder" : "paid",
                        amount: Number(items.amount) || undefined,
                        travelName: route.params?.travelName,
                    })
                )
            );

            setNotifyState(targets.length ? "sent" : "idle");
        } catch (error) {
            console.log(error);
            setNotifyState("error");
        }
    };

    const destinator = items.destinator || [];
    const totalPeople = destinator.length;
    const paidCount = destinator.filter((d) => d.payed).length;
    const unitAmount = Number(items.amount) || 0;
    const totalAmount = unitAmount * totalPeople;
    const collectedAmount = unitAmount * paidCount;
    const pendingAmount = unitAmount * (totalPeople - paidCount);

    const creatorName = items.creatorData?.[0]?.username || items.creator || "?";
    const creatorInitial = creatorName.charAt(0).toUpperCase();
    const createdLabel = items.dateTime
        ? String(items.dateTime).substring(0, String(items.dateTime).length - 3)
        : "";

    return (
        <View style={styles.root}>
            <OverscrollBackdrop topColor={ds.colors.brand} bottomColor={ds.colors.surface} />
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={[ds.colors.brand, ds.colors.action]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <MaterialCommunityIcons
                        name="wallet"
                        size={130}
                        color="rgba(255,255,255,0.07)"
                        style={styles.headerDecor}
                    />

                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <View style={styles.backChip}>
                                <MaterialCommunityIcons name="arrow-left" size={17} color={ds.colors.white} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Dettagli pagamento</Text>
                    </View>

                    {items.description ? (
                        <View style={styles.descriptionPill}>
                            <MaterialCommunityIcons
                                name="receipt-text-outline"
                                size={12}
                                color={ds.colors.white}
                            />
                            <Text style={styles.descriptionText}>{items.description}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.amount}>{money(items.amount)}</Text>

                    <View style={styles.creatorRow}>
                        <View style={styles.creatorAvatar}>
                            <Text style={styles.creatorInitial}>{creatorInitial}</Text>
                        </View>
                        <Text style={styles.creatorText} numberOfLines={1}>
                            Creato da {creatorName}{createdLabel ? ` · ${createdLabel}` : ""}
                        </Text>
                    </View>
                </LinearGradient>

                <View style={styles.sheet}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Totale</Text>
                            <Text style={styles.statValue}>{money(totalAmount)}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Incassato</Text>
                            <Text style={[styles.statValue, { color: ds.colors.successText }]}>
                                {money(collectedAmount)}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Da incassare</Text>
                            <Text style={[styles.statValue, { color: ds.colors.errorText }]}>
                                {money(pendingAmount)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <SectionLabel style={styles.sectionLabel}>Destinatari</SectionLabel>
                        {isCreator && paidCount < totalPeople ? (
                            <TouchableOpacity activeOpacity={0.7} onPress={settleAll} disabled={settlingAll}>
                                <Text style={styles.settleAll}>
                                    {settlingAll ? "Salvataggio…" : "Segna tutti pagati"}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.countText}>
                                {totalPeople} {totalPeople === 1 ? "persona" : "persone"}
                            </Text>
                        )}
                    </View>

                    <View style={styles.recipientsCard}>
                        {destinator.map((dest, index) => (
                            <TouchableOpacity
                                key={dest.userid || index}
                                activeOpacity={isCreator ? 0.7 : 1}
                                disabled={!isCreator}
                                onPress={() => togglePaid(dest)}
                            >
                                <View
                                    style={[
                                        styles.recipientRow,
                                        index < destinator.length - 1 && styles.recipientRowBorder,
                                    ]}
                                >
                                    <InitialsAvatar name={dest.nameShow} size={36} />
                                    <View style={styles.recipientText}>
                                        <Text style={styles.recipientName} numberOfLines={1}>
                                            {dest.nameShow || "…"}
                                        </Text>
                                        <Text style={styles.recipientShare}>Quota {money(items.amount)}</Text>
                                    </View>
                                    {savingId === dest.userid ? (
                                        <ActivityIndicator size="small" color={ds.colors.action} />
                                    ) : (
                                        <StatusBadge
                                            label={dest.payed ? "Pagato" : "Non pagato"}
                                            intent={dest.payed ? "success" : "error"}
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {notifyState === "sent" ? null : (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={sendNotification}
                            disabled={notifyState === "sending"}
                        >
                            <View style={styles.reminderButton}>
                                {notifyState === "sending" ? (
                                    <ActivityIndicator size="small" color={ds.colors.white} />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons
                                            name={isCreator ? "bell-outline" : "send-outline"}
                                            size={15}
                                            color={ds.colors.white}
                                        />
                                        <Text style={styles.reminderButtonText}>
                                            {isCreator ? "Invia promemoria" : "Avvisa che hai pagato"}
                                        </Text>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}

                    {notifyState === "sent" ? (
                        <View style={styles.notifyResult}>
                            <MaterialCommunityIcons
                                name="check-circle-outline"
                                size={15}
                                color={ds.colors.successText}
                            />
                            <Text style={styles.notifySent}>Notifica inviata</Text>
                        </View>
                    ) : null}

                    {notifyState === "error" ? (
                        <Text style={styles.notifyError}>
                            Non siamo riusciti a inviare la notifica. Riprova più tardi.
                        </Text>
                    ) : null}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: ds.colors.bgApp,
    },
    scroll: {
        flex: 1,
    },

    /* ---- Header ---- */
    header: {
        paddingTop: 64,
        paddingHorizontal: ds.layout.headerPaddingH,
        paddingBottom: ds.space[9],
        position: "relative",
        overflow: "hidden",
    },
    headerDecor: {
        position: "absolute",
        right: -16,
        top: 8,
        transform: [{ rotate: "10deg" }],
    },
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: ds.space[7],
    },
    backChip: {
        width: 32,
        height: 32,
        borderRadius: ds.radius.full,
        backgroundColor: "rgba(255,255,255,0.16)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: ds.space[4] - 2,
    },
    headerTitle: {
        fontFamily: ds.fontFamily.bold,
        fontSize: 16,
        color: ds.colors.white,
    },
    descriptionPill: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: ds.space[2] + 2,
        backgroundColor: "rgba(255,255,255,0.16)",
        borderRadius: ds.radius.full,
        paddingHorizontal: ds.space[4] - 1,
        paddingVertical: ds.space[2] + 1,
        marginBottom: ds.space[4] + 2,
    },
    descriptionText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 11,
        color: ds.colors.white,
    },
    amount: {
        fontFamily: ds.fontFamily.metaBold,
        fontSize: 44,
        letterSpacing: -0.4,
        color: ds.colors.white,
        marginBottom: ds.space[3] + 2,
    },
    creatorRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    creatorAvatar: {
        width: 24,
        height: 24,
        borderRadius: ds.radius.full,
        backgroundColor: "rgba(255,255,255,0.22)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: ds.space[3],
        flexShrink: 0,
    },
    creatorInitial: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 10,
        color: ds.colors.white,
    },
    creatorText: {
        flex: 1,
        fontFamily: ds.fontFamily.regular,
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
    },

    /* ---- Contenuto ---- */
    sheet: {
        backgroundColor: ds.colors.surface,
        borderTopLeftRadius: ds.layout.sheetRadius,
        borderTopRightRadius: ds.layout.sheetRadius,
        marginTop: ds.layout.sheetOverlap,
        padding: ds.layout.screenPadding,
        paddingTop: ds.space[6] + 2,
        paddingBottom: ds.layout.contentBottomPadding,
        minHeight: 460,
    },
    statsGrid: {
        flexDirection: "row",
        gap: ds.space[3] - 2,
        marginBottom: ds.space[6] + 2,
    },
    statCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: ds.colors.borderSubtle,
        borderRadius: ds.radius.l,
        paddingVertical: ds.space[4],
        paddingHorizontal: ds.space[3],
        alignItems: "center",
    },
    statLabel: {
        fontFamily: ds.fontFamily.medium,
        fontSize: 10,
        color: ds.colors.textSecondary,
        marginBottom: ds.space[2] + 2,
        textAlign: "center",
    },
    statValue: {
        fontFamily: ds.fontFamily.metaBold,
        fontSize: 15,
        color: ds.colors.text,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: ds.space[4] - 2,
    },
    sectionLabel: {
        marginBottom: 0,
    },
    countText: {
        fontFamily: ds.fontFamily.medium,
        fontSize: 11,
        color: ds.colors.textSecondary,
    },
    settleAll: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 11,
        color: ds.colors.action,
    },
    recipientsCard: {
        borderWidth: 1,
        borderColor: ds.colors.borderSubtle,
        borderRadius: ds.radius.l,
        overflow: "hidden",
        marginBottom: ds.space[7],
    },
    recipientRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: ds.space[3] + 2,
        paddingVertical: ds.space[4] - 1,
        paddingHorizontal: ds.space[4] + 2,
    },
    recipientRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: ds.colors.borderSubtle,
    },
    recipientText: {
        flex: 1,
    },
    recipientName: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.text,
    },
    recipientShare: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 11,
        color: ds.colors.textSecondary,
        marginTop: 2,
    },
    reminderButton: {
        height: ds.control.lg,
        borderRadius: ds.radius.m,
        backgroundColor: ds.colors.action,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: ds.space[3],
        ...ds.shadow.md,
    },
    reminderButtonText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 14,
        color: ds.colors.white,
    },
    notifyResult: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: ds.space[2] + 2,
        height: ds.control.lg,
        borderRadius: ds.radius.m,
        backgroundColor: ds.colors.successSoft,
    },
    notifySent: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.successText,
    },
    notifyError: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 11,
        color: ds.colors.errorText,
        textAlign: "center",
        marginTop: ds.space[3],
    },
});
