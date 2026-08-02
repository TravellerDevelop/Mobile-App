import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  View,
  TouchableWithoutFeedback,
  FlatList,
  LogBox,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import axios from "axios";
import { serverLink } from "../../global/globalVariable";
import { ds } from "../../global/designSystem";
import { InitialsAvatar, OverscrollBackdrop, SectionLabel, SearchField, StatusBadge } from "../../components/ui";
import { getData } from "../../shared/data/localdata";
import QrCodeModal from "./qrCodeModal";
import { ApiTicket, ApiTicketAirport, ApiUser } from "../../shared/types/api";

const PLACEHOLDER = "--";

/* Amico della lista di condivisione, con il flag locale "sent" (non persistito). */
interface FriendWithSent extends ApiUser {
  sent?: boolean;
}

/* Es. "12 ago" — usato nella riga compagnia/volo dell'header */
function shortDate(date: any) {
  if (!date) return PLACEHOLDER;
  try {
    return new Date(date).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  } catch {
    return PLACEHOLDER;
  }
}

/* Es. "12/08" — usato nella didascalia sotto il QR */
function slashDate(date: any) {
  if (!date) return PLACEHOLDER;
  try {
    return new Date(date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
  } catch {
    return PLACEHOLDER;
  }
}

/* Il nome scalo può arrivare come "Milano, Bergamo Airport": prendiamo la città */
function cityName(place?: ApiTicketAirport) {
  if (!place?.name) return null;
  const parts = String(place.name).split(",");
  return (parts[1] || parts[0]).trim();
}

/* Es. "09:35" da un orario locale ISO restituito dall'arricchimento volo (departureTimeLocal/arrivalTimeLocal) */
function hm(isoLocal?: string) {
  if (!isoLocal) return null;
  try {
    const d = new Date(isoLocal);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

/* Es. "1h 25m" tra due orari locali ISO */
function flightDuration(departureIso?: string, arrivalIso?: string) {
  if (!departureIso || !arrivalIso) return null;
  const dep = new Date(departureIso).getTime();
  const arr = new Date(arrivalIso).getTime();
  if (isNaN(dep) || isNaN(arr) || arr <= dep) return null;
  const totalMinutes = Math.round((arr - dep) / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TicketModal({ navigation, route }: { navigation: any; route: any }) {
  let [data, setData] = useState<Partial<ApiTicket>>({});
  let [takeInfo, setTakeInfo] = useState<(() => void) | null>(null);

  let [qrVisibility, setQrVisibility] = useState(false);
  let [showMenu, setShowMenu] = useState(false);
  let [showShare, setShowShare] = useState(false);

  LogBox.ignoreLogs([
    "Non-serializable values were found in the navigation state",
    "Cannot update a component",
  ]);

  let [searchFriend, setSearchFriend] = useState<FriendWithSent[]>([]);
  let [extraData, setExtraData] = useState(false);

  const toggleExtraData = () => {
    setExtraData(!extraData);
  };

  let [friends, setFriends] = useState<FriendWithSent[]>([]);

  // La schermata è una tab nascosta del Tab.Navigator principale: React
  // Navigation non la smonta mai tra un biglietto e l'altro, si limita ad
  // aggiornare route.params. Questo effetto deve quindi ri-eseguirsi ad ogni
  // cambio di parametri, altrimenti resterebbero sempre i dati del primo
  // biglietto aperto nella sessione.
  useEffect(() => {
    setData(route.params.data);
    setTakeInfo(() => route.params.takeInfo);
  }, [route.params]);

  // La lista amici per la condivisione invece va presa una sola volta.
  useEffect(() => {
    async function uData() {
      let aus = await getData("user");

      axios
        .get<FriendWithSent[]>(serverLink + "api/follow/takeFollowingsWithInfo?from=" + aus._id)
        .then((response) => {
          if (response.status == 200) {
            for (let item of response.data) {
              item.sent = false;
            }

            setFriends(response.data);
            setSearchFriend(response.data);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }

    uData();
  }, []);

  function deleteTicket() {
    axios
      .post(serverLink + "api/tickets/delete", { id: data._id })
      .then(() => {
        if (takeInfo) takeInfo();
        setShowMenu(false);
        navigation.goBack();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  if (!data) return <></>;

  const passenger = data.name || data.surname
    ? `${data.name || ""} ${data.surname || ""}`.trim()
    : PLACEHOLDER;

  const fromCity = cityName(data.from) || PLACEHOLDER;
  const toCity = cityName(data.to) || PLACEHOLDER;

  return (
    <View style={styles.root}>
      <QrCodeModal
        data={data.qrdata}
        visibility={qrVisibility}
        setVisibility={setQrVisibility}
      />

      <OverscrollBackdrop topColor={ds.colors.brand} bottomColor={ds.colors.surface} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[ds.colors.brand, ds.colors.action]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <MaterialCommunityIcons
            name="airplane-takeoff"
            size={140}
            color="rgba(255,255,255,0.07)"
            style={styles.headerDecor}
          />

          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <View style={styles.headerIconChip}>
                <MaterialCommunityIcons name="arrow-left" size={18} color={ds.colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {data.title || "Carta d'imbarco"}
            </Text>
            <TouchableOpacity onPress={() => setShowMenu(true)}>
              <View style={styles.headerIconChip}>
                <MaterialCommunityIcons
                  name="share-variant-outline"
                  size={15}
                  color={ds.colors.white}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.airlineRow}>
            <View style={styles.airlineIconChip}>
              <MaterialCommunityIcons name="airplane" size={13} color={ds.colors.white} />
            </View>
            <Text style={styles.airlineName}>{data.company?.name || PLACEHOLDER}</Text>
            <Text style={styles.airlineMeta}>
              {" "}&middot; {data.flightNumber || PLACEHOLDER} &middot; {shortDate(data.date)}
            </Text>
          </View>

          <View style={styles.routeRow}>
            <View style={styles.routeSide}>
              <Text style={styles.iata} numberOfLines={1}>
                {data.from?.iata || PLACEHOLDER}
              </Text>
              <Text style={styles.cityTime} numberOfLines={1} ellipsizeMode="tail">
                {fromCity} &middot; {hm(data.departureTimeLocal) || PLACEHOLDER}
              </Text>
            </View>

            <View style={styles.routeMiddle}>
              <Text style={styles.duration} numberOfLines={1}>
                {flightDuration(data.departureTimeLocal, data.arrivalTimeLocal) || PLACEHOLDER}
              </Text>
              <View style={styles.dashedLine}>
                <View style={styles.dashedBadge}>
                  <MaterialCommunityIcons
                    name="airplane-takeoff"
                    size={10}
                    color={ds.colors.action}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.routeSide, styles.routeSideRight]}>
              <Text style={[styles.iata, styles.textRight]} numberOfLines={1}>
                {data.to?.iata || PLACEHOLDER}
              </Text>
              <Text
                style={[styles.cityTime, styles.textRight]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {toCity} &middot; {hm(data.arrivalTimeLocal) || PLACEHOLDER}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.stubWrap}>
          <View style={styles.perforationRow}>
            <View style={styles.notchLeft} />
            <View style={styles.dashedDivider} />
            <View style={styles.notchRight} />
          </View>

          <View style={styles.sheet}>
            <View style={styles.checkinPill}>
              <MaterialCommunityIcons
                name="information-outline"
                size={12}
                color={ds.colors.textSecondary}
              />
              <Text style={styles.checkinText}>Check-in: {data.departureCheckInDesk || PLACEHOLDER}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoCol, styles.infoColBorder]}>
                <Text style={styles.infoLabel}>GATE</Text>
                <Text style={styles.infoValue}>{data.departureGate || PLACEHOLDER}</Text>
              </View>
              <View style={[styles.infoCol, styles.infoColBorder]}>
                <Text style={styles.infoLabel}>IMBARCO</Text>
                <Text style={styles.infoValue}>{PLACEHOLDER}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>TERMINAL</Text>
                <Text style={styles.infoValue}>{data.departureTerminal || PLACEHOLDER}</Text>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={styles.cell}>
                <View style={styles.cellIconChip}>
                  <MaterialCommunityIcons name="account-outline" size={15} color={ds.colors.action} />
                </View>
                <View style={styles.cellText}>
                  <Text style={styles.cellLabel}>Passeggero</Text>
                  <Text style={styles.cellValue} numberOfLines={1}>{passenger}</Text>
                </View>
              </View>
              <View style={styles.cell}>
                <View style={styles.cellIconChip}>
                  <MaterialCommunityIcons name="seat-outline" size={15} color={ds.colors.action} />
                </View>
                <View style={styles.cellText}>
                  <Text style={styles.cellLabel}>Posto</Text>
                  <Text style={styles.cellValue}>{data.seat || PLACEHOLDER}</Text>
                </View>
              </View>
              <View style={styles.cell}>
                <View style={styles.cellIconChip}>
                  <MaterialCommunityIcons name="bag-suitcase-outline" size={15} color={ds.colors.action} />
                </View>
                <View style={styles.cellText}>
                  <Text style={styles.cellLabel}>Bagaglio</Text>
                  <Text style={styles.cellValue}>{data.arrivalBaggageBelt ? `Nastro ${data.arrivalBaggageBelt}` : PLACEHOLDER}</Text>
                </View>
              </View>
              <View style={styles.cell}>
                <View style={styles.cellIconChip}>
                  <MaterialCommunityIcons name="crown-outline" size={15} color={ds.colors.action} />
                </View>
                <View style={styles.cellText}>
                  <Text style={styles.cellLabel}>Classe</Text>
                  <Text style={styles.cellValue}>{data.classLabel || PLACEHOLDER}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={() => setQrVisibility(true)}>
              <View style={styles.codeCard}>
                {data.qrdata ? (
                  <QRCode value={data.qrdata} size={140} />
                ) : (
                  <View style={styles.codePlaceholder}>
                    <Text style={styles.codePlaceholderText}>{PLACEHOLDER}</Text>
                  </View>
                )}
                <Text style={styles.codeCaption}>
                  {data.flightNumber || PLACEHOLDER} &middot; {data.from?.iata || PLACEHOLDER}
                  &ndash;{data.to?.iata || PLACEHOLDER} &middot; {slashDate(data.date)}
                </Text>
                <Text style={styles.codeHint}>Mostra questo codice al gate</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert("In arrivo", "L'aggiunta a Wallet sarà disponibile presto.")
              }
            >
              <View style={styles.walletButton}>
                <MaterialCommunityIcons name="apple" size={16} color={ds.colors.white} />
                <Text style={styles.walletButtonText}>Aggiungi a Wallet</Text>
              </View>
            </TouchableOpacity>

            <SectionLabel>Condiviso con il gruppo</SectionLabel>
            <View style={styles.sharedRow}>
              {data.sharedBy ? (
                <InitialsAvatar name={data.sharedBy} size={34} style={styles.sharedAvatar} />
              ) : null}
              <TouchableOpacity activeOpacity={0.8} onPress={() => setShowShare(true)}>
                <View style={[styles.addAvatar, data.sharedBy ? styles.avatarOverlap : null]}>
                  <MaterialCommunityIcons name="plus" size={14} color={ds.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Azioni: condividi / elimina */}
      <Modal transparent visible={showMenu} animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.sheetOverlay}>
            <View style={styles.actionSheet}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowMenu(false);
                  setShowShare(true);
                }}
              >
                <View style={styles.actionRow}>
                  <MaterialCommunityIcons
                    name="share-variant-outline"
                    size={19}
                    color={ds.colors.text}
                    style={styles.actionIcon}
                  />
                  <Text style={styles.actionText}>Condividi il biglietto</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} onPress={deleteTicket}>
                <View style={[styles.actionRow, { borderBottomWidth: 0 }]}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={19}
                    color={ds.colors.errorText}
                    style={styles.actionIcon}
                  />
                  <Text style={[styles.actionText, { color: ds.colors.errorText }]}>
                    Elimina biglietto
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Condividi con un amico */}
      <Modal transparent visible={showShare} animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowShare(false)}>
          <View style={styles.sheetOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.shareSheet}>
          <Text style={styles.shareTitle}>Condividi biglietto</Text>
          <SearchField
            placeholder="Cerca un amico"
            style={styles.shareSearch}
            onChangeText={(value: string) => {
              let aus = friends.filter((item) => {
                return (
                  item.name.toLowerCase().includes(value.toLowerCase()) ||
                  item.surname.toLowerCase().includes(value.toLowerCase())
                );
              });

              setSearchFriend(value == "" ? friends : aus);
              toggleExtraData();
            }}
          />
          <FlatList
            data={searchFriend}
            extraData={extraData}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.friendRow}>
                <InitialsAvatar name={item.name + " " + item.surname} size={38} />
                <Text style={styles.friendName} numberOfLines={1}>
                  {item.name} {item.surname}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={async () => {
                    let aus = await getData("user");

                    axios
                      .post(serverLink + "api/tickets/share", {
                        userid: item._id,
                        content: data,
                        createBy: aus.username,
                      })
                      .then(() => {
                        item.sent = true;
                        toggleExtraData();
                      })
                      .catch((error) => {
                        console.log(error);
                      });
                  }}
                >
                  <StatusBadge
                    label={item.sent ? "Inviato" : "Invia"}
                    intent={item.sent ? "success" : "info"}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingBottom: 46,
    position: "relative",
    overflow: "hidden",
  },
  headerDecor: {
    position: "absolute",
    right: -18,
    top: 6,
    transform: [{ rotate: "15deg" }],
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerIconChip: {
    width: 34,
    height: 34,
    borderRadius: ds.radius.full,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 8,
    textAlign: "center",
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.white,
  },
  airlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  airlineIconChip: {
    width: 26,
    height: 26,
    borderRadius: ds.radius.s,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  airlineName: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 14,
    color: ds.colors.white,
  },
  airlineMeta: {
    fontFamily: ds.fontFamily.metaMedium,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  routeSide: {
    flexShrink: 1,
    flexGrow: 0,
    maxWidth: "38%",
  },
  routeSideRight: {
    alignItems: "flex-end",
  },
  textRight: {
    textAlign: "right",
  },
  iata: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 34,
    letterSpacing: -0.4,
    lineHeight: 38,
    color: ds.colors.white,
  },
  cityTime: {
    fontFamily: ds.fontFamily.metaMedium,
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },
  routeMiddle: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 40,
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  duration: {
    fontFamily: ds.fontFamily.metaSemibold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: "rgba(255,255,255,0.7)",
  },
  dashedLine: {
    width: "100%",
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.45)",
    position: "relative",
  },
  dashedBadge: {
    position: "absolute",
    top: -9,
    left: "50%",
    marginLeft: -9,
    width: 18,
    height: 18,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ---- Cucitura biglietto ---- */
  stubWrap: {
    position: "relative",
  },
  perforationRow: {
    position: "absolute",
    top: -1,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
  },
  notchLeft: {
    width: 22,
    height: 22,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.bgApp,
    marginLeft: -11,
    flexShrink: 0,
  },
  notchRight: {
    width: 22,
    height: 22,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.bgApp,
    marginRight: -11,
    flexShrink: 0,
  },
  dashedDivider: {
    flex: 1,
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderColor: ds.colors.border,
  },

  /* ---- Contenuto ---- */
  sheet: {
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.radius.xl,
    borderTopRightRadius: ds.radius.xl,
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: ds.layout.contentBottomPadding,
  },
  checkinPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ds.colors.scale.neutral[3],
    borderRadius: ds.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
  },
  checkinText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  infoRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    marginBottom: 16,
    overflow: "hidden",
  },
  infoCol: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  infoColBorder: {
    borderRightWidth: 1,
    borderRightColor: ds.colors.borderSubtle,
  },
  infoLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.3,
    color: ds.colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 17,
    color: ds.colors.text,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cell: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  cellIconChip: {
    width: 32,
    height: 32,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.actionSubtle,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginRight: 10,
  },
  cellText: {
    flex: 1,
  },
  cellLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 10,
    color: ds.colors.textSecondary,
  },
  cellValue: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  codeCard: {
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  codePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: ds.radius.s,
    backgroundColor: ds.colors.scale.neutral[3],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  codePlaceholderText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 20,
    color: ds.colors.textSecondary,
  },
  codeCaption: {
    fontFamily: ds.fontFamily.metaMedium,
    fontSize: 11,
    letterSpacing: 0.4,
    color: ds.colors.textSecondary,
    marginTop: 10,
    marginBottom: 2,
  },
  codeHint: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  walletButton: {
    height: ds.control.lg,
    backgroundColor: "#000000",
    borderRadius: ds.radius.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 22,
  },
  walletButtonText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.white,
  },
  sharedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  sharedAvatar: {
    borderWidth: 2,
    borderColor: ds.colors.surface,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  addAvatar: {
    width: 34,
    height: 34,
    borderRadius: ds.radius.full,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: ds.colors.border,
    backgroundColor: ds.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ---- Bottom sheet azioni ---- */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(1,13,55,0.4)",
  },
  actionSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.radius["2xl"],
    borderTopRightRadius: ds.radius["2xl"],
    paddingHorizontal: ds.space[6],
    paddingTop: ds.space[6],
    paddingBottom: ds.space[9],
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: ds.space[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  actionIcon: {
    marginRight: ds.space[4],
  },
  actionText: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 15,
    color: ds.colors.text,
  },

  /* ---- Bottom sheet condivisione ---- */
  shareSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "70%",
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.radius["2xl"],
    borderTopRightRadius: ds.radius["2xl"],
    paddingHorizontal: ds.space[6],
    paddingTop: ds.space[6],
    paddingBottom: ds.space[8],
  },
  shareTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 16,
    color: ds.colors.text,
    marginBottom: ds.space[5],
  },
  shareSearch: {
    marginBottom: ds.space[4],
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: ds.space[3] + 2,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  friendName: {
    flex: 1,
    marginLeft: ds.space[3] + 2,
    marginRight: ds.space[3],
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
});
