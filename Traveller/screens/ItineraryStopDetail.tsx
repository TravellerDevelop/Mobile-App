import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../global/designSystem";
import { InitialsAvatar, OverscrollBackdrop, SectionLabel, Sheet } from "../components/ui";
import { StopEditorSheet, type EditorParticipant } from "../components/itinerary/StopEditorSheet";
import { ItineraryMap } from "../components/itinerary/ItineraryMap";
import { useItinerary } from "../components/itinerary/useItinerary";
import { categoryOption, statusOption } from "../components/itinerary/categories";
import { createStopPayment, fetchTickets, shareStopInFeed } from "../components/itinerary/api";
import { openInMaps } from "../components/itinerary/openInMaps";
import {
  formatCurrency,
  formatDuration,
  formatStopRange,
} from "../components/itinerary/schedule";
import type { Stop, StopChecklistItem } from "../components/itinerary/types";

/* ============================================================
   Dettaglio di una tappa: luogo sulla mappa, orari e costo,
   agganci a Money, biglietti e feed, checklist e partecipanti.
   ============================================================ */

export default function ItineraryStopDetail({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const travel = route.params?.travel ?? {};
  const stopId: string = route.params?.stopId;
  const onChanged: (() => void) | undefined = route.params?.onChanged;

  const itinerary = useItinerary({ travelId: travel._id });
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linking, setLinking] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketPickerOpen, setTicketPickerOpen] = useState(false);
  const [attachedTicket, setAttachedTicket] = useState<any | null>(null);

  const stop: Stop | null = useMemo(() => {
    const all = [...(itinerary.data?.stops ?? []), ...(itinerary.data?.ideas ?? [])];
    return all.find((item) => item._id === stopId) ?? null;
  }, [itinerary.data, stopId]);

  /* Il biglietto allegato si risolve dalla lista dell'utente: i ticket
     sono già scaricati per l'uso offline, quindi non serve un endpoint
     dedicato per leggerne uno solo. */
  useEffect(() => {
    if (!stop?.ticket || !itinerary.userId) {
      setAttachedTicket(null);
      return;
    }

    let active = true;
    fetchTickets(itinerary.userId)
      .then((list) => {
        if (!active) return;
        setTickets(list);
        setAttachedTicket(list.find((ticket: any) => ticket._id === stop.ticket) ?? null);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [stop?.ticket, itinerary.userId]);

  /* La schermata che ha aperto il dettaglio ricarica quando si torna
     indietro, così l'elenco riflette check-in e modifiche. */
  useEffect(() => {
    return navigation.addListener("beforeRemove", () => onChanged?.());
  }, [navigation, onChanged]);

  const participants: EditorParticipant[] = useMemo(
    () =>
      (travel.participants ?? []).map((participant: any) => ({
        userid: String(participant.userid),
        username: participant.username ?? "",
      })),
    [travel.participants]
  );

  /* ---- Agganci a Money, Biglietti e feed ------------------- */

  /**
   * La spesa della tappa è un normale post "payments": nasce nel feed e
   * nei conteggi di Money, e la tappa ne tiene solo il riferimento.
   */
  const handlePayment = useCallback(async () => {
    if (!stop || !itinerary.userId) return;

    if (stop.paymentPost) {
      navigation.navigate("TravelDetail", { data: travel, username: travel.username });
      return;
    }

    if (!stop.cost) {
      Alert.alert(
        "Spesa",
        "Aggiungi prima un costo previsto alla tappa: sarà l'importo della spesa."
      );
      return;
    }

    const destinators =
      stop.participants.length > 0
        ? stop.participants
        : participants.map((participant) => participant.userid);

    Alert.alert(
      "Crea la spesa",
      `${formatCurrency(stop.cost)} per "${stop.title}", divisa tra ${destinators.length} ${
        destinators.length === 1 ? "persona" : "persone"
      }.`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Crea",
          onPress: async () => {
            setLinking(true);
            try {
              const postId = await createStopPayment({
                travel: travel._id,
                creator: itinerary.userId as string,
                amount: stop.cost as number,
                description: stop.title,
                destinators,
              });
              if (postId) await itinerary.editStop(stop._id, { paymentPost: postId });
            } catch (err: any) {
              Alert.alert("Spesa", err?.message || "Non sono riuscito a creare la spesa");
            } finally {
              setLinking(false);
            }
          },
        },
      ]
    );
  }, [stop, itinerary, travel, participants, navigation]);

  /** Biglietto: se già allegato apre il QR, altrimenti apre il selettore. */
  const handleTicket = useCallback(async () => {
    if (!stop) return;

    if (attachedTicket) {
      navigation.navigate("TicketsModal", { data: attachedTicket, takeInfo: () => undefined });
      return;
    }

    if (!itinerary.userId) return;
    try {
      const list = await fetchTickets(itinerary.userId);
      setTickets(list);
      setTicketPickerOpen(true);
    } catch (err) {
      Alert.alert("Biglietti", "Non riesco a caricare i tuoi biglietti");
    }
  }, [stop, attachedTicket, itinerary.userId, navigation]);

  const shareInFeed = useCallback(async () => {
    if (!stop || !itinerary.userId) return;
    setSharing(true);
    try {
      const when = stop.day !== null ? `Giorno ${stop.day + 1}` : "Idea";
      const time = stop.startTime ? ` alle ${stop.startTime}` : "";
      const place = stop.place?.name ? ` — ${stop.place.name}` : "";

      await shareStopInFeed({
        travel: travel._id,
        creator: itinerary.userId,
        content: `📍 ${stop.title}${place}\n${when}${time}`,
      });
      Alert.alert("Fatto", "La tappa è stata annunciata nel feed del viaggio.");
    } catch (err) {
      Alert.alert("Feed", "Non sono riuscito a pubblicare nel feed");
    } finally {
      setSharing(false);
    }
  }, [stop, itinerary.userId, travel._id]);

  const toggleChecklistItem = useCallback(
    async (item: StopChecklistItem) => {
      if (!stop) return;
      const next = stop.checklist.map((entry) =>
        entry.key === item.key ? { ...entry, checked: !entry.checked } : entry
      );
      await itinerary.setChecklist(stop._id, next).catch(() => undefined);
    },
    [stop, itinerary]
  );

  const changeStatus = useCallback(
    async (status: "done" | "skipped" | "confirmed") => {
      if (!stop) return;
      setBusy(true);
      try {
        await itinerary.setStatus(stop._id, status);
      } catch (err: any) {
        Alert.alert("Itinerario", err?.message || "Operazione non riuscita");
      } finally {
        setBusy(false);
      }
    },
    [stop, itinerary]
  );

  const confirmDelete = useCallback(() => {
    if (!stop) return;
    Alert.alert(
      "Elimina tappa",
      `"${stop.title}" verrà rimossa dall'itinerario. L'azione non si può annullare.`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            try {
              await itinerary.removeStop(stop._id);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert("Itinerario", err?.message || "Operazione non riuscita");
            }
          },
        },
      ]
    );
  }, [stop, itinerary, navigation]);

  if (itinerary.loading || !stop) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator color={ds.colors.action} />
      </View>
    );
  }

  const category = categoryOption(stop.category);
  const status = statusOption(stop.status);
  const canEdit = Boolean(itinerary.data?.canEdit) || stop.creator === itinerary.userId;
  const range = formatStopRange(stop);

  return (
    <View style={styles.container}>
      <OverscrollBackdrop topColor={ds.colors.brand} bottomColor={ds.colors.surface} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={hitSlop}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={ds.colors.white} />
            </TouchableOpacity>

            {canEdit ? (
              <TouchableOpacity onPress={confirmDelete} hitSlop={hitSlop} accessibilityLabel="Elimina tappa">
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={ds.colors.white} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.headerMeta}>
            <MaterialCommunityIcons
              name={category.icon as never}
              size={14}
              color={ds.colors.onBrandMuted}
            />
            <Text style={styles.headerMetaText}>
              {category.label} · {status.label}
            </Text>
          </View>

          <Text style={styles.headerTitle}>{stop.title}</Text>
        </View>

        <View style={styles.sheetBackground}>
          <Sheet style={styles.sheet} overlap={-14}>
            {stop.place?.lat != null && stop.place?.lon != null ? (
              <View style={styles.mapCard}>
                <ItineraryMap stops={[stop]} />
              </View>
            ) : null}

            {stop.place ? (
              <TouchableOpacity activeOpacity={0.85} onPress={() => openInMaps(stop.place)}>
                <View style={styles.placeCard}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={18}
                    color={ds.colors.action}
                  />
                  <View style={styles.placeBody}>
                    <Text style={styles.placeName}>{stop.place.name}</Text>
                    {stop.place.address ? (
                      <Text style={styles.placeAddress} numberOfLines={2}>
                        {stop.place.address}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.navButton}>
                    <MaterialCommunityIcons
                      name="navigation-variant-outline"
                      size={14}
                      color={ds.colors.action}
                    />
                    <Text style={styles.navButtonText}>Naviga</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : null}

            <View style={styles.factsRow}>
              <View style={styles.factCard}>
                <Text style={styles.factLabel}>Giorno · orario</Text>
                <Text style={styles.factValue}>
                  {stop.day === null ? "Idea" : `G${stop.day + 1}`}
                  {range ? ` · ${range}` : stop.day === null ? "" : " · in giornata"}
                </Text>
              </View>

              <View style={[styles.factCard, styles.factCardLast]}>
                <Text style={styles.factLabel}>Costo previsto</Text>
                <Text style={styles.factValue}>
                  {stop.cost != null ? formatCurrency(stop.cost) : "—"}
                </Text>
              </View>
            </View>

            <View style={styles.factsRow}>
              <View style={styles.factCard}>
                <Text style={styles.factLabel}>Durata</Text>
                <Text style={styles.factValue}>{formatDuration(stop.duration)}</Text>
              </View>
              <View style={[styles.factCard, styles.factCardLast]}>
                <Text style={styles.factLabel}>Voti</Text>
                <Text style={styles.factValue}>{stop.votes.length}</Text>
              </View>
            </View>

            {/* Agganci alle altre feature del viaggio */}
            <TouchableOpacity activeOpacity={0.85} onPress={handlePayment} disabled={linking}>
              <View style={styles.linkRow}>
                <MaterialCommunityIcons name="wallet-outline" size={16} color={ds.colors.action} />
                <Text style={styles.linkText}>
                  {stop.paymentPost
                    ? "Spesa registrata in Money · apri il feed"
                    : stop.cost
                      ? `Crea la spesa in Money (${formatCurrency(stop.cost)})`
                      : "Aggiungi un costo per creare la spesa"}
                </Text>
                {linking ? (
                  <ActivityIndicator size="small" color={ds.colors.action} />
                ) : (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={17}
                    color={ds.colors.scale.neutral[8]}
                  />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={handleTicket}>
              <View style={styles.linkRow}>
                <MaterialCommunityIcons name="qrcode" size={16} color={ds.colors.action} />
                <Text style={styles.linkText}>
                  {attachedTicket
                    ? `${attachedTicket.title || attachedTicket.company?.name || "Biglietto"} · apri il QR`
                    : stop.ticket
                      ? "Biglietto allegato"
                      : "Collega un biglietto"}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={17}
                  color={ds.colors.scale.neutral[8]}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={shareInFeed} disabled={sharing}>
              <View style={styles.linkRow}>
                <MaterialCommunityIcons
                  name="bullhorn-outline"
                  size={16}
                  color={ds.colors.action}
                />
                <Text style={styles.linkText}>Annuncia questa tappa nel feed</Text>
                {sharing ? (
                  <ActivityIndicator size="small" color={ds.colors.action} />
                ) : (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={17}
                    color={ds.colors.scale.neutral[8]}
                  />
                )}
              </View>
            </TouchableOpacity>

            {stop.notes ? (
              <>
                <SectionLabel>Note</SectionLabel>
                <Text style={styles.notes}>{stop.notes}</Text>
              </>
            ) : null}

            {stop.checklist.length > 0 ? (
              <>
                <SectionLabel>Checklist</SectionLabel>
                {stop.checklist.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.85}
                    onPress={() => toggleChecklistItem(item)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.checked }}
                  >
                    <View style={styles.checklistRow}>
                      <MaterialCommunityIcons
                        name={item.checked ? "check-circle" : "checkbox-blank-circle-outline"}
                        size={16}
                        color={item.checked ? ds.colors.success : ds.colors.scale.neutral[8]}
                      />
                      <Text style={[styles.checklistLabel, item.checked && styles.checklistDone]}>
                        {item.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}

            <SectionLabel>
              {stop.participants.length === 0
                ? "Partecipa tutto il gruppo"
                : `Partecipano (${stop.participants.length} di ${itinerary.data?.participantsCount ?? 0})`}
            </SectionLabel>
            <View style={styles.avatars}>
              {(stop.participants.length === 0
                ? participants
                : participants.filter((p) => stop.participants.includes(p.userid))
              ).map((participant, index) => (
                <InitialsAvatar
                  key={participant.userid}
                  name={participant.username}
                  size={32}
                  style={[styles.avatar, index === 0 ? styles.avatarFirst : null]}
                />
              ))}
            </View>
          </Sheet>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        {canEdit ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.actionSlot}
            onPress={() => setEditorOpen(true)}
          >
            <View style={styles.secondaryAction}>
              <MaterialCommunityIcons name="pencil-outline" size={14} color={ds.colors.text} />
              <Text style={styles.secondaryActionText}>Modifica</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionSlot}
          onPress={() => changeStatus(stop.status === "skipped" ? "confirmed" : "skipped")}
          disabled={busy}
        >
          <View style={styles.secondaryAction}>
            <MaterialCommunityIcons
              name={stop.status === "skipped" ? "undo-variant" : "skip-forward"}
              size={14}
              color={ds.colors.errorText}
            />
            <Text style={[styles.secondaryActionText, { color: ds.colors.errorText }]}>
              {stop.status === "skipped" ? "Ripristina" : "Salta"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionSlot}
          onPress={() => changeStatus(stop.status === "done" ? "confirmed" : "done")}
          disabled={busy}
        >
          <View style={styles.primaryAction}>
            <MaterialCommunityIcons
              name={stop.status === "done" ? "check-circle" : "check-circle-outline"}
              size={14}
              color={ds.colors.white}
            />
            <Text style={styles.primaryActionText}>
              {stop.status === "done" ? "Fatta" : "Check-in"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <StopEditorSheet
        visible={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSubmit={(param) => itinerary.editStop(stop._id, param).then(() => undefined)}
        days={itinerary.data?.days ?? []}
        participants={participants}
        stop={stop}
        canChooseDay={Boolean(itinerary.data?.canEdit)}
      />

      {/* Selettore biglietto: mostra i biglietti dell'utente, quello
          collegato resta raggiungibile offline come tutti gli altri. */}
      <Modal
        visible={ticketPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTicketPickerOpen(false)}
      >
        <Pressable style={styles.scrim} onPress={() => setTicketPickerOpen(false)} />
        <View style={styles.pickerSheet}>
          <View style={styles.grabber} />
          <Text style={styles.pickerTitle}>Collega un biglietto</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {tickets.length === 0 ? (
              <Text style={styles.pickerEmpty}>
                Non hai biglietti salvati: aggiungili dalla sezione Biglietti.
              </Text>
            ) : (
              tickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket._id}
                  activeOpacity={0.85}
                  onPress={async () => {
                    setTicketPickerOpen(false);
                    try {
                      await itinerary.editStop(stop._id, { ticket: ticket._id });
                      setAttachedTicket(ticket);
                    } catch (err: any) {
                      Alert.alert("Biglietti", err?.message || "Operazione non riuscita");
                    }
                  }}
                >
                  <View style={styles.pickerRow}>
                    <MaterialCommunityIcons
                      name="ticket-confirmation-outline"
                      size={16}
                      color={ds.colors.action}
                    />
                    <View style={styles.pickerBody}>
                      <Text style={styles.pickerLabel} numberOfLines={1}>
                        {ticket.title || ticket.company?.name || "Biglietto"}
                      </Text>
                      <Text style={styles.pickerMeta} numberOfLines={1}>
                        {[ticket.from?.iata, ticket.to?.iata].filter(Boolean).join(" → ") ||
                          (ticket.date
                            ? new Date(ticket.date).toLocaleDateString("it-IT")
                            : "")}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {stop.ticket ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={async () => {
                  setTicketPickerOpen(false);
                  await itinerary.editStop(stop._id, { ticket: null }).catch(() => undefined);
                  setAttachedTicket(null);
                }}
              >
                <View style={styles.pickerRow}>
                  <Text style={[styles.pickerLabel, { color: ds.colors.errorText }]}>
                    Togli il biglietto dalla tappa
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.bgApp,
  },
  loaderScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ds.colors.surface,
  },
  header: {
    backgroundColor: ds.colors.brand,
    paddingHorizontal: ds.layout.headerPaddingH,
    paddingTop: 64,
    paddingBottom: ds.space[7] + 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ds.space[5] - 2,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3],
    marginBottom: ds.space[2] + 2,
  },
  headerMetaText: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.onBrandMuted,
  },
  headerTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 22,
    color: ds.colors.white,
  },
  sheetBackground: {
    backgroundColor: ds.colors.surface,
  },
  sheet: {
    paddingBottom: ds.layout.actionBarContentPadding,
  },
  mapCard: {
    height: 130,
    borderRadius: ds.radius.l,
    overflow: "hidden",
    marginBottom: ds.space[4],
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ds.colors.scrim,
  },
  pickerSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "62%",
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.radius.xl,
    borderTopRightRadius: ds.radius.xl,
    paddingHorizontal: ds.space[6],
    paddingTop: ds.space[4],
    paddingBottom: ds.space[9],
    ...ds.shadow.lg,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[6],
    alignSelf: "center",
    marginBottom: ds.space[5],
  },
  pickerTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 18,
    color: ds.colors.text,
    marginBottom: ds.space[4],
  },
  pickerEmpty: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3] + 2,
    paddingVertical: ds.space[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  pickerBody: {
    flex: 1,
    minWidth: 0,
  },
  pickerLabel: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13.5,
    color: ds.colors.text,
  },
  pickerMeta: {
    fontFamily: ds.fontFamily.metaRegular,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  placeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[4],
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: ds.space[4],
    marginBottom: ds.space[5],
  },
  placeBody: {
    flex: 1,
    minWidth: 0,
  },
  placeName: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  placeAddress: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginTop: 1,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[2],
    borderWidth: 1,
    borderColor: ds.colors.action,
    borderRadius: ds.radius.m,
    paddingVertical: ds.space[2] + 1,
    paddingHorizontal: ds.space[3] + 2,
  },
  navButtonText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.action,
  },
  factsRow: {
    flexDirection: "row",
    marginBottom: ds.space[4],
  },
  factCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: ds.space[4],
    marginRight: ds.space[3] + 2,
  },
  factCardLast: {
    marginRight: 0,
  },
  factLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 10,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[2] + 2,
  },
  factValue: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 14,
    color: ds.colors.text,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3] + 2,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: ds.space[4],
    marginBottom: ds.space[4] - 1,
  },
  linkText: {
    flex: 1,
    fontFamily: ds.fontFamily.medium,
    fontSize: 12.5,
    color: ds.colors.text,
  },
  notes: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: ds.colors.textBody,
    marginBottom: ds.space[5],
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3],
    paddingVertical: ds.space[3] - 1,
  },
  checklistLabel: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    color: ds.colors.text,
  },
  checklistDone: {
    color: ds.colors.textSecondary,
    textDecorationLine: "line-through",
  },
  avatars: {
    flexDirection: "row",
    marginBottom: ds.space[5],
  },
  avatar: {
    borderWidth: 2,
    borderColor: ds.colors.surface,
    marginLeft: -8,
  },
  avatarFirst: {
    marginLeft: 0,
  },
  actionBar: {
    position: "absolute",
    left: ds.layout.screenPadding,
    right: ds.layout.screenPadding,
    // Sopra la tab bar flottante, non sotto.
    bottom: ds.layout.actionBarBottom,
    flexDirection: "row",
    gap: ds.space[3],
  },
  actionSlot: {
    flex: 1,
  },
  secondaryAction: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ds.space[3],
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.surface,
  },
  secondaryActionText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12.5,
    color: ds.colors.text,
  },
  primaryAction: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ds.space[3],
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    ...ds.shadow.lg,
  },
  primaryActionText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12.5,
    color: ds.colors.white,
  },
});
