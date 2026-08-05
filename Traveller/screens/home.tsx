import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Swiper from "react-native-swiper";
import InteractiveCard from "../components/interactiveCard";
import MainHeader from "../components/mainHeader";
// color/font legacy: usati solo dalla modale "novità versione", fuori dal redesign
import { appVersion, color, font, serverLink } from "../global/globalVariable";
import { ds } from "../global/designSystem";
import {
  EmptyState,
  FeedGroup,
  InitialsAvatar,
  OverscrollBackdrop,
  SearchField,
  SectionLabel,
  Sheet,
} from "../components/ui";
import Card from "../shared/card";
import {
  getData,
  getStringData,
  storeStringData,
} from "../shared/data/localdata";
import { apiGet, isOfflineError } from "../shared/data/apiClient";
import { cacheKeys } from "../shared/data/offlineCache";
import { shapeFeed } from "../shared/data/postShape";
import { useOnReconnect } from "../global/networkContext";
import { useTravelRealtime, useTravelsListRealtime } from "../components/realtime";
import { fetchUserById } from "../components/auth/api";
import LoadingCard from "../shared/loadingCard";

// Componenti
import ImagesComponent from "../components/Travel-Componets/ImagesComponent";
import PaymentComponent from "../components/Travel-Componets/payments";
import TextComponent from "../components/Travel-Componets/textcomponent";
import Vote from "../components/Travel-Componets/vote";
import PostLoading from "../components/loading/PostLoading";
import ToDo from "../components/Travel-Componets/ToDo";
import ItineraryEvent from "../components/Travel-Componets/ItineraryEvent";
import {
  ApiAppVersionDoc,
  ApiJoinedTravel,
  ApiUser,
} from "../shared/types/api";

export default function Home({ navigation }: { navigation: any }) {
  let [joinedTravelsLoading, setJoinedTravelsLoading] = useState(true);
  let [lastPostsLoading, setLastPostsLoading] = useState(true);
  // NOTA: i post arrivano tipizzati dal server, ma qui vengono rimodellati per la UI
  // (dateTime formattata, source immagini trasformato in {id, source}[]): per questo
  // la tupla viene tenuta "any[]" piuttosto che forzare un tipo che poi verrebbe
  // immediatamente violato dalla trasformazione.
  let [lastPosts, setLastPosts] = useState<[any[], Record<string, string>] | false>(false);
  let [userData, setUserData] = useState<Partial<ApiUser> | false>(false);
  let [joinedTravels, setJoinedTravels] = useState<ApiJoinedTravel[] | false>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [serchData, setSerchData] = useState<ApiUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const lastQueryRef = useRef("");
  const [showNew, setShowNew] = useState(false);

  /* Le notifiche push non vivono più qui: registrazione del token, handler e
     listener stanno in components/notifications (pushClient + provider), che
     li monta una volta sola a livello di app invece che a ogni rimontaggio
     della Home — e li rimuove quando serve. */

  async function verifyUserData() {
    // App.tsx (AuthProvider) garantisce che questa schermata monti solo con
    // una sessione valida: non serve più gestire qui il caso "non loggato"
    // (prima mostrava un modale di login sopra una View vuota).
    let data = await getData("user");
    setUserData(data);
    if (!data || !data._id) return;

    storeStringData("username", data.username);

    // fetchUserById ripulisce sempre il campo "password" dalla risposta del
    // server, a differenza di una chiamata axios diretta allo stesso
    // endpoint: evitiamo così di tenerlo anche solo in memoria qui.
    // Offline restituisce null: in quel caso si prosegue con l'utente in
    // cache, altrimenti la home resterebbe vuota per un dettaglio (il
    // refresh del profilo) che non serve a disegnarla.
    const freshUser = await fetchUserById(data._id);
    const user = freshUser ?? data;
    if (freshUser) setUserData(freshUser);

    await loadJoinedTravels(user.username, user._id);
    await takePost(user._id, user.username);
  }

  /* Rete tornata: ricarichiamo, così i dati in cache mostrati finora
     vengono sostituiti da quelli veri senza che l'utente debba fare
     pull-to-refresh. */
  useOnReconnect(() => {
    verifyUserData();
  });

  useEffect(() => {
    verifyUserData();

    axios
      .get<ApiAppVersionDoc[]>(serverLink + "api/takeVersion")
      .then(async (response) => {
        if (response.status == 200) {
          if (response.data[0].AppVersion.toString() != appVersion.toString()) {
            Alert.alert(
              "Aggiornamento disponibile",
              "È disponibile un aggiornamento per l'applicazione (" +
                response.data[0].AppVersion +
                ") , vuoi aggiornare?",
              [
                {
                  text: "No",
                  onPress: () => console.log("Cancel Pressed"),
                  style: "cancel",
                },
                {
                  text: "Si",
                  onPress: () => {
                    Linking.openURL("https://traveller-ttze.onrender.com/");
                  },
                },
              ],
              { cancelable: false }
            );
          } else {
            let data = await getStringData(response.data[0].AppVersion);

            if (data != "true") {
              setShowNew(true);
            }
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  // Ricerca account: con debounce (evita una chiamata per ogni carattere) e
  // guardia anti-race (una risposta lenta a una query precedente non deve
  // sovrascrivere risultati più recenti).
  useEffect(() => {
    const trimmed = query.trim();
    lastQueryRef.current = trimmed;

    if (trimmed.length < 3) {
      setSerchData([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timeout = setTimeout(() => {
      axios
        .get<ApiUser[]>(serverLink + "api/user/search?username=" + trimmed)
        .then((response) => {
          if (response.status == 200 && lastQueryRef.current === trimmed) {
            setSerchData(response.data);
          }
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {
          if (lastQueryRef.current === trimmed) setSearchLoading(false);
        });
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  const visibleSearchResults = serchData.filter(
    (item) => !userData || userData._id != item._id
  );

  /* ---------------------------------------------------------------
     Realtime

     La home aggrega i post di TUTTI i viaggi dell'utente, quindi si
     iscrive alla stanza di ciascuno: gli id arrivano da joinedTravels,
     cioè dalla stessa lista che alimenta il feed.

     Qui si ricarica sempre invece di applicare il post in locale
     (come fa travelDetail): il feed è una risposta composita
     [post, mappa id→nome viaggio] limitata ai 10 più recenti lato
     server, e inserire una riga a mano significherebbe replicare qui
     quel troncamento. Meglio una richiesta accorpata.
     --------------------------------------------------------------- */
  const travelIds = Array.isArray(joinedTravels)
    ? joinedTravels.map((travel: any) => String(travel._id))
    : [];

  const feedReloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleFeedReload = () => {
    if (feedReloadTimer.current) clearTimeout(feedReloadTimer.current);
    feedReloadTimer.current = setTimeout(() => {
      feedReloadTimer.current = null;
      if (userData && userData._id && userData.username) {
        takePost(userData._id, userData.username);
        // Stessa attività che aggiorna il feed cambia anche il badge "non
        // letti" delle card in alto (vedi unseenCount in api/travel/takeJoined):
        // le si ricarica insieme, sotto lo stesso debounce.
        loadJoinedTravels(userData.username, userData._id);
      }
    }, 400);
  };

  useEffect(
    () => () => {
      if (feedReloadTimer.current) clearTimeout(feedReloadTimer.current);
    },
    []
  );

  useTravelRealtime(
    travelIds,
    {
      onPostNew: scheduleFeedReload,
      onPostUpdated: scheduleFeedReload,
      onPostDeleted: scheduleFeedReload,
      onItineraryChanged: scheduleFeedReload,
      onTravelUpdated: () => {
        if (userData && userData._id && userData.username) {
          loadJoinedTravels(userData.username, userData._id);
        }
      },
    },
    { currentUserId: userData ? userData._id : null }
  );

  // Viaggio creato, eliminato, o qualcuno che entra/esce: cambia la lista
  // in alto, non il feed. Arriva sulla stanza personale perché riguarda
  // anche i viaggi da cui si è appena usciti (dalla cui stanza si è fuori).
  useTravelsListRealtime(() => {
    if (userData && userData._id && userData.username) {
      loadJoinedTravels(userData.username, userData._id);
    }
  }, Boolean(userData && userData._id));

  const onRefresh = async () => {
    setRefreshing(true);
    let data = await getData("user");
    loadJoinedTravels(data.username, data._id);
    takePost(data._id, data.username);
    setRefreshing(false);
  };

  /* Entrambe le letture passano da apiGet: se il server non risponde
     mostrano l'ultima copia salvata invece di lasciare la home sugli
     scheletri di caricamento all'infinito. */
  async function loadJoinedTravels(username: string, userid: string) {
    try {
      const { data } = await apiGet<ApiJoinedTravel[]>(
        serverLink +
          "api/travel/takeJoined?username=" +
          username +
          "&userid=" +
          userid,
        { cacheKey: cacheKeys.joinedTravels(userid) }
      );
      setJoinedTravels(data);
    } catch (error) {
      if (!isOfflineError(error)) console.log(error);
      // Offline e senza cache: la EmptyState "Nessun viaggio" è già il
      // messaggio giusto, il banner in alto spiega il perché.
      setJoinedTravels(false);
    } finally {
      setJoinedTravelsLoading(false);
    }
  }

  async function takePost(userid: string, username: string) {
    try {
      const { data } = await apiGet<[any[], Record<string, string>]>(
        serverLink +
          "api/post/takeLastsByUsername?userid=" +
          userid +
          "&username=" +
          username,
        { cacheKey: cacheKeys.homeFeed(userid), transform: shapeFeed }
      );
      setLastPosts(data);
    } catch (error) {
      if (!isOfflineError(error)) console.log("Last Post", error);
      setLastPosts(false);
    } finally {
      setLastPostsLoading(false);
    }
  }

  // App.tsx monta questa schermata solo quando l'utente è autenticato
  // (vedi AuthProvider in global/authContext.tsx): niente più modale di
  // login né schermata bianca da gestire qui.
  return (
    <View style={styles.flex}>
      <OverscrollBackdrop topColor={ds.colors.brand} />
        <ScrollView
        style={styles.screen}
        contentContainerStyle={{ backgroundColor: ds.colors.brand, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          {showNew && (
            <Modal transparent={true} animationType="slide">
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Swiper
                  loop={false}
                  showsPagination={true}
                  showsButtons={true}
                  index={0}
                  style={{
                    backgroundColor: "white",
                    borderRadius: 10,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "white",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      borderRadius: 10,
                      margin: 20,
                      paddingTop: 20,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.montserrat,
                        fontSize: 23,
                        textAlign: "center",
                        color: color.secondary,
                      }}
                    >
                      Novità versione {appVersion}
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.montserratBold,
                        fontSize: 23,
                        textAlign: "center",
                        marginTop: 50,
                      }}
                    >
                      Personalizza il tuo viaggio!
                    </Text>
                    <Image
                      source={require("../assets/image/News/Copertina.jpg")}
                      style={{
                        width: 300,
                        height: 300,
                      }}
                      resizeMode="contain"
                    />
                    <Text
                      style={{
                        fontFamily: font.montserrat,
                        fontSize: 20,
                        textAlign: "center",
                      }}
                    >
                      Aggiungi un immagine di copertina al tuo viaggio, e
                      rendilo ancora più unico!
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "white",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      borderRadius: 10,
                      margin: 20,
                      paddingTop: 20,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.text,
                        fontSize: 23,
                        textAlign: "center",
                        color: color.secondary,
                      }}
                    >
                      Novità versione {appVersion}
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.text_bold,
                        fontSize: 23,
                        textAlign: "center",
                        marginTop: 50,
                        marginBottom: 20,
                      }}
                    >
                      Condividi le tue esperienze!
                    </Text>
                    <Image
                      source={require("../assets/image/News/Card.jpg")}
                      style={{
                        width: 300,
                        height: 300,
                      }}
                      resizeMode="contain"
                    />
                    <Text
                      style={{
                        fontFamily: font.montserrat,
                        fontSize: 20,
                        marginTop: 20,
                        textAlign: "center",
                      }}
                    >
                      Invia le immagini ai partecipanti di un viaggio, e
                      permetti a loro di scaricarle, anche più insieme!
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-evenly",
                        alignItems: "center",
                        marginTop: 20,
                      }}
                    >
                      <TouchableOpacity
                        onPress={async () => {
                          await storeStringData(appVersion, "true");
                          setShowNew(false);
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: font.montserrat,
                            fontSize: 20,
                            color: color.primary,
                            textDecorationLine: "underline",
                          }}
                        >
                          Chiudi
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Swiper>
              </View>
            </Modal>
          )}

          <MainHeader
            navigation={navigation}
            updateJoinTravels={loadJoinedTravels}
            refresh={refreshing}
          />
          <Sheet style={styles.sheet}>
            <View style={styles.content}>
              <View style={styles.searchWrap}>
                <SearchField
                  placeholder="Cerca un account"
                  style={styles.search}
                  value={query}
                  onChangeText={setQuery}
                  onClear={() => setQuery("")}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  autoCorrect={false}
                />

                {searchFocused && query.trim().length > 0 && (
                  <View style={styles.searchDropdown}>
                    {query.trim().length < 3 ? (
                      <Text style={styles.searchHint}>
                        Scrivi almeno 3 caratteri per cercare
                      </Text>
                    ) : searchLoading ? (
                      <View style={styles.searchLoadingRow}>
                        <ActivityIndicator color={ds.colors.action} />
                      </View>
                    ) : visibleSearchResults.length > 0 ? (
                      // ScrollView (non FlatList) di proposito: è già annidato
                      // dentro lo ScrollView verticale della home, e una
                      // VirtualizedList nella stessa orientazione romperebbe il
                      // windowing (warning RN). I risultati sono comunque pochi.
                      <ScrollView
                        style={styles.searchList}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                      >
                        {visibleSearchResults.map((item, index) => (
                          <TouchableOpacity
                            key={item._id}
                            activeOpacity={0.6}
                            style={[
                              styles.usercard,
                              index === visibleSearchResults.length - 1 &&
                                styles.usercardLast,
                            ]}
                            onPress={() => {
                              Keyboard.dismiss();
                              setQuery("");
                              setSearchFocused(false);
                              navigation.navigate("OtherProfile", {
                                userid: item._id,
                              });
                            }}
                          >
                            <InitialsAvatar
                              name={item.name + " " + item.surname}
                              size={38}
                            />
                            <View style={styles.usercardText}>
                              <Text style={styles.usercardName}>
                                {item.name} {item.surname}
                              </Text>
                              <Text style={styles.usercardUsername}>
                                @{item.username}
                              </Text>
                            </View>
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={18}
                              color={ds.colors.textPlaceholder}
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : (
                      <EmptyState
                        icon="account-search-outline"
                        title="Nessun utente trovato"
                        style={styles.searchEmpty}
                      />
                    )}
                  </View>
                )}
              </View>

              <SectionLabel>I tuoi prossimi viaggi</SectionLabel>
              {joinedTravelsLoading && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                </ScrollView>
              )}
              {joinedTravels != null &&
                joinedTravels &&
                joinedTravels.length > 0 &&
                !joinedTravelsLoading && userData && userData.username && (
                  <FlatList
                    data={joinedTravels}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.travelsList}
                    contentContainerStyle={styles.travelsListContent}
                    renderItem={({ item }) => (
                      <Card
                        isLoading={joinedTravelsLoading}
                        data={item}
                        navigation={navigation}
                        username={(userData && userData.username) || ""}
                      />
                    )}
                  />
                )}
              {(joinedTravels == null || joinedTravels == false || joinedTravels.length == 0) &&
                !joinedTravelsLoading && (
                  <EmptyState
                    icon="airplane-off"
                    title="Nessun viaggio trovato"
                    description="Crea un viaggio o unisciti con un codice invito."
                  />
                )}

              <InteractiveCard
                navigation={navigation}
                updatecards={loadJoinedTravels}
              />

              <SectionLabel>Ultimi post dai tuoi viaggi</SectionLabel>
              {lastPostsLoading && <PostLoading />}
              {lastPosts != null &&
                lastPosts &&
                lastPosts[0].length > 0 &&
                !lastPostsLoading && (
                  <FeedGroup>
                    <FlatList
                      scrollEnabled={false}
                      data={lastPosts[0]}
                      renderItem={({ item }) => (
                        <>
                          {item.type == "text" ? (
                            <TextComponent
                              home={true}
                              item={item}
                              travel={lastPosts && lastPosts[1][item.travel]}
                              username={(userData && userData.username) || ""}
                            />
                          ) : item.type == "vote" ? (
                            <Vote
                              item={item}
                              home={true}
                              travel={lastPosts && lastPosts[1][item.travel]}
                              username={(userData && userData.username) || ""}
                            />
                          ) : item.type == "payments" ? (
                            <PaymentComponent
                              item={item}
                              home={true}
                              travel={lastPosts && lastPosts[1][item.travel]}
                              username={(userData && userData.username) || ""}
                            />
                          ) : item.type == "images" ? (
                            <ImagesComponent
                              item={item}
                              home={true}
                              travel={lastPosts && lastPosts[1][item.travel]}
                              username={(userData && userData.username) || ""}
                            />
                          ) : item.type === "todo" ? (
                            <ToDo
                              data={item}
                              home={true}
                              travel={lastPosts && lastPosts[1][item.travel]}
                              username={(userData && userData.username) || ""}
                            />
                          ) : (
                            item.type === "itinerary" && (
                              <ItineraryEvent
                                item={item}
                                home={true}
                                travel={lastPosts && lastPosts[1][item.travel]}
                                username={(userData && userData.username) || ""}
                              />
                            )
                          )}
                        </>
                      )}
                    />
                  </FeedGroup>
                )}
              {(lastPosts == null || lastPosts == false || lastPosts[0].length == 0) && (
                <EmptyState
                  icon="post-outline"
                  title="Nessun post trovato"
                  description="I post dei tuoi viaggi compariranno qui."
                />
              )}
            </View>
          </Sheet>
        </View>
        </ScrollView>
      </View>
    );
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
  content: {
    backgroundColor: ds.colors.surface,
  },
  searchWrap: {
    position: "relative",
    zIndex: 30,
    elevation: 30,
  },
  search: {
    marginBottom: ds.space[7] - 2,
  },
  searchDropdown: {
    position: "absolute",
    top: ds.control.md + ds.space[3],
    left: 0,
    right: 0,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    overflow: "hidden",
    zIndex: 30,
    elevation: 12,
    ...ds.shadow.lg,
  },
  searchList: {
    maxHeight: 320,
  },
  searchHint: {
    ...ds.type.caption,
    textAlign: "center",
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[4],
  },
  searchLoadingRow: {
    paddingVertical: ds.space[6],
    alignItems: "center",
  },
  searchEmpty: {
    paddingVertical: ds.space[6],
  },
  usercard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: ds.space[3] + 2,
    paddingHorizontal: ds.space[4],
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  usercardLast: {
    borderBottomWidth: 0,
  },
  usercardText: {
    flex: 1,
    marginLeft: ds.space[3] + 2,
  },
  usercardName: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  usercardUsername: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  travelsList: {
    marginHorizontal: -ds.layout.screenPadding,
    marginBottom: ds.space[7] - 2,
  },
  travelsListContent: {
    paddingHorizontal: ds.layout.screenPadding,
    paddingBottom: ds.space[2],
  },
});
