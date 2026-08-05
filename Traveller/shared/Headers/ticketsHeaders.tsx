import React, { useEffect, useRef, useState } from "react";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StyleSheet, Text, TouchableOpacity, Modal, View, Dimensions, Pressable, TextInput, Platform, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { File as ExpoFile } from "expo-file-system";
import { serverLink } from "../../global/globalVariable.js";
import { ds } from "../../global/designSystem";
import { HeaderChip } from "../../components/ui";
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from "axios";
import { getData } from "../data/localdata.js";
import { apiSend } from "../data/apiClient";
import { cacheKeys, readCache, writeCache } from "../data/offlineCache";
import { ApiUser, ApiTicket } from "../types/api";
import { buildTicketFromScan, suggestTitle, ScannedTicketDraft } from "../../components/tickets/enrich";
import { BcbpParseError, looksLikeBcbp } from "../../components/tickets/bcbp";
import { decodeBarcodeFromJpegBytes } from "../../components/tickets/decodeImage";

// Sopra questa larghezza l'immagine scelta dalla galleria viene ridotta prima
// della decodifica: mantiene la pipeline JS (jpeg-js + @zxing/library, vedi
// decodeImage.ts) veloce e leggera in memoria anche su una foto ad alta
// risoluzione, senza perdere dettaglio utile per leggere il barcode.
const GALLERY_IMPORT_MAX_WIDTH = 1600;

/**
 * Aggiunge un biglietto creato offline alla cache dei biglietti, così la
 * lista lo mostra prima ancora che la richiesta parta. Il server, quando
 * la coda verrà svuotata, invaliderà la chiave e la lista si riallineerà
 * con l'_id vero.
 */
async function appendTicketToCache(userId: string, ticket: Partial<ApiTicket>) {
    const key = cacheKeys.tickets(userId);
    const cached = await readCache<ApiTicket[]>(key);
    const current = Array.isArray(cached?.data) ? cached!.data : [];
    await writeCache(key, [...current, { ...ticket, _id: `local-${Date.now()}` } as ApiTicket]);
}

// Quanti frame "non validi" tollerare in silenzio prima di arrendersi e
// mostrare l'errore all'utente. Aztec/PDF417 (usati per i boarding pass da
// Ryanair e altre compagnie, non solo QR) sono più delicati da leggere del
// QR quando si fotografa lo schermo di un altro telefono: capita che un
// singolo frame decodifichi un payload corrotto/parziale (es. i primi
// caratteri "M1" persi) pur restituendo "successo" alla fotocamera. Qualche
// secondo di ritentativi silenziosi evita falsi "codice non riconosciuto"
// su un boarding pass in realtà perfettamente valido.
const MAX_SILENT_SCAN_RETRIES = 40;

interface TicketsHeaderProps {
    update: any;
}

export default function TicketsHeader({ update }: TicketsHeaderProps) {

    const [type, setType] = useState<'back' | 'front'>('back');
    const [permission, requestPermission] = useCameraPermissions();

    const [modalVisible, setModalVisible] = useState(false);
    const [qrVisible, setQrVisible] = useState(false);

    const [scanned, setScaned] = useState(false);
    // Coppia [type, data] restituita da onBarcodeScanned del QR.
    const [data, setData] = useState<[string, string] | null>(null);

    // Bozza costruita dal barcode (+ arricchimento via api/tickets/lookupFlight),
    // vedi components/tickets/enrich.ts. `enriching` copre solo la finestra della
    // chiamata di rete: il parsing del barcode è sincrono e istantaneo.
    const [draft, setDraft] = useState<ScannedTicketDraft | null>(null);
    const [enriching, setEnriching] = useState(false);
    const [importingImage, setImportingImage] = useState(false);

    // Ref (non state) per il lock anti-doppia-scansione e il conteggio dei
    // frame scartati: onBarcodeScanned può sparare più volte prima che React
    // riporti lo stato aggiornato, quindi un guard basato su useState("scanned")
    // leggerebbe un valore ancora "stale" nelle chiamate ravvicinate.
    const scanLockRef = useRef(false);
    const scanRetryCountRef = useRef(0);

    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    let [dateOfTicket, setDateOfTicket] = useState("");

    const [ticketTitle, setTicketTitle] = useState("");

    const [userInfo, setUserInfo] = useState<Partial<ApiUser>>({});

    const toggleDatePicker = () => {
        setShowPicker(!showPicker);
    }

    const onChangeDate = ({ type }: { type: string }, selectedDate?: Date) => {
        if (type == "set") {
            const currentDate = selectedDate as Date;
            setDate(currentDate);

            if (Platform.OS == "android") {
                toggleDatePicker()
                setDateOfTicket(currentDate.toLocaleDateString("it-IT", { timeZone: "Europe/Andorra" }));
            }
        }
        else {
            toggleDatePicker();
        }
    };

    const confirmIOSDate = () => {
        setDateOfTicket(date.toLocaleDateString("it-IT", { timeZone: "Europe/Andorra" }));
        toggleDatePicker();
    }

    if (!permission)
        requestPermission();

    async function getUserData() {
        let aus = await getData("user");
        setUserInfo(aus);
    }

    useEffect(() => {
        getUserData();
    }, [])

    return (
        <>
            {
                qrVisible ?
                    <Modal visible={qrVisible} animationType='slide'>
                        <View style={scanStyles.container}>
                            {
                                scanned ?
                                    /* Form di completamento dati dopo la scansione */
                                    <View style={scanStyles.formArea}>
                                        <Text style={scanStyles.title}>Nuovo biglietto</Text>

                                        {enriching && !draft ? (
                                            <View style={scanStyles.enrichingRow}>
                                                <ActivityIndicator color={ds.colors.white} />
                                                <Text style={scanStyles.enrichingText}>Lettura del biglietto…</Text>
                                            </View>
                                        ) : null}

                                        {draft ? (
                                            <View style={scanStyles.summaryCard}>
                                                <Text style={scanStyles.summaryLine}>
                                                    {draft.ticket.company?.name || draft.pass.leg.carrier} · Volo {draft.ticket.flightNumber}
                                                </Text>
                                                <Text style={scanStyles.summaryLine}>
                                                    {draft.pass.leg.fromIata} → {draft.pass.leg.toIata}
                                                    {draft.ticket.seat ? ` · Posto ${draft.ticket.seat}` : ""}
                                                    {draft.ticket.classLabel ? ` · ${draft.ticket.classLabel}` : ""}
                                                </Text>
                                                {enriching ? (
                                                    <Text style={scanStyles.summaryMuted}>Sto recuperando altri dettagli del volo…</Text>
                                                ) : draft.enrichmentFailed ? (
                                                    <Text style={scanStyles.summaryMuted}>
                                                        Dettagli aggiuntivi (gate, terminal, aeromobile) non disponibili al momento: il biglietto verrà comunque salvato con i dati letti dal codice.
                                                    </Text>
                                                ) : null}
                                            </View>
                                        ) : null}

                                        {showPicker && (
                                            <DateTimePicker
                                                mode="date"
                                                value={date}
                                                display="default"
                                                onChange={onChangeDate as any}
                                                style={scanStyles.datePicker}
                                            />
                                        )}

                                        {showPicker && Platform.OS == "ios" && (
                                            <View style={scanStyles.pickerActions}>
                                                <TouchableOpacity onPress={() => toggleDatePicker()}>
                                                    <Text style={scanStyles.pickerAction}>Annulla</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => confirmIOSDate()}>
                                                    <Text style={scanStyles.pickerAction}>Conferma</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        <TextInput
                                            style={scanStyles.input}
                                            placeholder="Titolo biglietto"
                                            placeholderTextColor="rgba(255,255,255,0.5)"
                                            value={ticketTitle}
                                            onChangeText={(text) => { setTicketTitle(text) }}
                                        />

                                        <Pressable onPress={() => toggleDatePicker()}>
                                            <TextInput
                                                style={scanStyles.input}
                                                placeholder="Data del biglietto"
                                                placeholderTextColor="rgba(255,255,255,0.5)"
                                                value={dateOfTicket}
                                                onChangeText={setDateOfTicket}
                                                onPressIn={toggleDatePicker}
                                                editable={false}
                                            />
                                        </Pressable>

                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            disabled={!draft}
                                            onPress={() => { submitTicket(); }}
                                        >
                                            <View style={[scanStyles.primaryButton, !draft && scanStyles.primaryButtonDisabled]}>
                                                <Text style={scanStyles.primaryButtonText}>Carica biglietto</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    :
                                    /* Inquadratura QR con mirino ad angoli */
                                    <View style={scanStyles.scanArea}>
                                        <Text style={scanStyles.title}>Scansiona il codice QR</Text>
                                        <Text style={scanStyles.subtitle}>
                                            Inquadra il codice QR presente sul biglietto per importarlo automaticamente
                                        </Text>

                                        <View style={scanStyles.frame}>
                                            <CameraView
                                                style={scanStyles.camera}
                                                facing={type}
                                                // Ryanair (e diverse altre compagnie) non usa QR per i boarding pass ma
                                                // Aztec Code; PDF417/Data Matrix sono altri formati IATA-BCBP comuni.
                                                // Limitarsi a 'qr' faceva sì che la fotocamera non rilevasse affatto
                                                // il codice per quelle compagnie (nessun errore: semplicemente nessuna
                                                // scansione), il barcode contiene comunque lo stesso testo IATA-BCBP
                                                // letto da components/tickets/bcbp.ts indipendentemente dal formato.
                                                barcodeScannerSettings={{ barcodeTypes: ['qr', 'aztec', 'pdf417', 'datamatrix'] }}
                                                onBarcodeScanned={({ type, data }: { type: string; data: string }) => {
                                                    if (scanLockRef.current) return;
                                                    if (!looksLikeBcbp(data)) {
                                                        // Frame corrotto/parziale: si scarta in silenzio e si lascia
                                                        // la fotocamera libera di ritentare, invece di bloccare la UI
                                                        // su un errore per un boarding pass in realtà valido.
                                                        scanRetryCountRef.current += 1;
                                                        if (scanRetryCountRef.current <= MAX_SILENT_SCAN_RETRIES) return;
                                                    }

                                                    scanLockRef.current = true;
                                                    setData([type, data]);
                                                    setScaned(true);
                                                    handleScanned(type, data);
                                                }}
                                            />
                                            <View style={[scanStyles.corner, scanStyles.cornerTopLeft]} />
                                            <View style={[scanStyles.corner, scanStyles.cornerTopRight]} />
                                            <View style={[scanStyles.corner, scanStyles.cornerBottomLeft]} />
                                            <View style={[scanStyles.corner, scanStyles.cornerBottomRight]} />
                                        </View>

                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            disabled={importingImage}
                                            onPress={() => { importFromGallery(); }}
                                        >
                                            <View style={scanStyles.galleryRow}>
                                                {importingImage ? (
                                                    <ActivityIndicator color={ds.colors.scale.accent[8]} />
                                                ) : (
                                                    <MaterialCommunityIcons
                                                        name="image-outline"
                                                        size={16}
                                                        color={ds.colors.scale.accent[8]}
                                                    />
                                                )}
                                                <Text style={scanStyles.galleryText}>
                                                    {importingImage ? "Lettura immagine…" : "Importa dalla galleria"}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                            }

                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    setScaned(false)
                                    setData(null)
                                    setDraft(null)
                                    setEnriching(false)
                                    setImportingImage(false)
                                    setTicketTitle("")
                                    setDateOfTicket("")
                                    setQrVisible(false)
                                    scanLockRef.current = false;
                                    scanRetryCountRef.current = 0;
                                }}
                            >
                                <View style={scanStyles.backRow}>
                                    <MaterialCommunityIcons
                                        name="arrow-left"
                                        size={14}
                                        color={ds.colors.scale.accent[8]}
                                    />
                                    <Text style={scanStyles.backText}>Torna indietro</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </Modal>
                    : null
            }

            <LinearGradient
                colors={[ds.colors.brand, ds.colors.action]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <MaterialCommunityIcons
                    name="ticket-confirmation"
                    size={130}
                    color="rgba(255,255,255,0.07)"
                    style={styles.headerDecor}
                />
                <Text style={styles.title}>Biglietti</Text>
                <Text style={styles.paragraph}>
                    Aggiungi i tuoi biglietti per averli sempre con te, anche offline.
                </Text>
                <HeaderChip
                    icon="plus"
                    label="Aggiungi biglietto"
                    variant="solid"
                    onPress={() => setModalVisible(true)}
                />

                <Modal visible={modalVisible} animationType='slide'>
                    <View style={modalstyles.container}>
                        <Text style={modalstyles.title}>Nuovo biglietto</Text>

                        <TouchableOpacity activeOpacity={0.85} onPress={() => setQrVisible(true)}>
                            <View style={modalstyles.card}>
                                <View style={modalstyles.row}>
                                    <MaterialCommunityIcons
                                        name="qrcode-scan"
                                        size={18}
                                        color={ds.colors.action}
                                        style={modalstyles.icon}
                                    />
                                    <Text style={modalstyles.subtitle}>Scansiona il codice QR</Text>
                                </View>
                                <Text style={modalstyles.paragraph}>
                                    Scansiona il codice QR presente sul biglietto, oppure importalo dalla galleria.
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.85}>
                            <View style={modalstyles.card}>
                                <View style={modalstyles.row}>
                                    <MaterialCommunityIcons
                                        name="pencil-outline"
                                        size={18}
                                        color={ds.colors.action}
                                        style={modalstyles.icon}
                                    />
                                    <Text style={modalstyles.subtitle}>Inserisci manualmente</Text>
                                </View>
                                <Text style={modalstyles.paragraph}>
                                    Inserisci a mano i dati del biglietto: numero di volo, compagnia, data e ora.
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.85} onPress={() => setModalVisible(false)}>
                            <View style={modalstyles.button}>
                                <Text style={modalstyles.buttonText}>Torna indietro</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </LinearGradient>
        </>
    )

    // Legge il barcode IATA-BCBP (qualunque compagnia, non più solo FR/VY/KL/AZ)
    // e prova ad arricchirlo via api/tickets/lookupFlight. Non blocca mai
    // l'utente: un barcode illeggibile riporta alla schermata di scansione con
    // un Alert (prima falliva in silenzio, il pulsante "Carica biglietto" non
    // faceva nulla); un arricchimento fallito lascia comunque la bozza usabile.
    async function handleScanned(type: string, qrData: string) {
        setEnriching(true);
        try {
            const built = await buildTicketFromScan(type, qrData);
            setDraft(built);
            setTicketTitle(suggestTitle(built));
            if (built.flightDate) {
                setDate(built.flightDate);
                setDateOfTicket(built.flightDate.toLocaleDateString("it-IT", { timeZone: "Europe/Andorra" }));
            }
        } catch (error) {
            const baseMessage = error instanceof BcbpParseError
                ? error.message
                : "Non è stato possibile leggere questo codice.";
            // Alcuni boarding pass (es. Aztec Code di Ryanair) risultano a volte
            // illeggibili dal vivo per un limite del decoder nativo della
            // fotocamera, non del formato del codice in sé: la galleria usa una
            // pipeline di decodifica indipendente che se ne libera.
            Alert.alert(
                "Codice non valido",
                baseMessage + "\n\nSe il biglietto è comunque valido, prova a importare uno screenshot dalla galleria invece di inquadrarlo dal vivo."
            );
            setScaned(false);
            setData(null);
            scanLockRef.current = false;
            scanRetryCountRef.current = 0;
        } finally {
            setEnriching(false);
        }
    }

    // Percorso alternativo alla scansione dal vivo, promesso dal testo della
    // card ("...oppure importalo dalla galleria") ma finora mai implementato.
    // Decodifica l'immagine con una pipeline JS indipendente dal decoder
    // nativo della fotocamera (components/tickets/decodeImage.ts): utile sia
    // per comodità, sia come bypass per i boarding pass che quel decoder
    // legge in modo scorretto dal vivo (vedi Alert in handleScanned).
    async function importFromGallery() {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permesso negato", "Serve l'accesso alla galleria per importare un biglietto da una foto.");
            return;
        }

        const picked = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (picked.canceled || !picked.assets?.[0]) return;

        const asset = picked.assets[0];
        setImportingImage(true);
        try {
            // Ridimensiona solo se necessario: non ha senso ingrandire un'immagine
            // già piccola (peggiorerebbe la leggibilità del barcode, non la migliorerebbe).
            const actions = asset.width && asset.width > GALLERY_IMPORT_MAX_WIDTH
                ? [{ resize: { width: GALLERY_IMPORT_MAX_WIDTH } }]
                : [];
            const manipulated = await ImageManipulator.manipulateAsync(asset.uri, actions, {
                compress: 0.9,
                format: ImageManipulator.SaveFormat.JPEG,
            });

            const buffer = await new ExpoFile(manipulated.uri).arrayBuffer();
            const found = decodeBarcodeFromJpegBytes(new Uint8Array(buffer));

            if (!found) {
                Alert.alert(
                    "Nessun codice trovato",
                    "Non ho trovato un codice leggibile in questa immagine. Prova con uno screenshot più nitido del biglietto."
                );
                return;
            }

            scanLockRef.current = true;
            setData([found.type, found.data]);
            setScaned(true);
            await handleScanned(found.type, found.data);
        } catch (error) {
            console.log(error);
            Alert.alert("Errore", "Non è stato possibile leggere l'immagine selezionata.");
        } finally {
            setImportingImage(false);
        }
    }

    async function submitTicket() {
        if (!draft) return;

        // Serve per la chiave di cache dei biglietti: senza id non c'è nulla
        // da salvare in locale (né, lato server, a chi intestare il biglietto).
        const ownerId = userInfo?._id;
        if (!ownerId) return;

        const out: Partial<ApiTicket> = {
            ...draft.ticket,
            title: ticketTitle,
            date: date as unknown as string,
            creator: userInfo._id,
        };

        try {
            /* Offline la creazione finisce in coda e parte al ritorno della
               rete; nel frattempo il biglietto viene aggiunto alla cache
               locale, così compare subito nella lista — è il caso d'uso
               tipico: si aggiunge un biglietto in aeroporto, senza rete. */
            const { queued } = await apiSend(
                serverLink + "api/tickets/create",
                { data: out },
                {
                    queue: {
                        label: "Nuovo biglietto",
                        invalidates: [cacheKeys.tickets(ownerId)],
                    },
                }
            );

            if (queued) await appendTicketToCache(ownerId, out);

            update();
            setScaned(false);
            setData(null);
            setDraft(null);
            setQrVisible(false);
            setModalVisible(false);
            scanLockRef.current = false;
            scanRetryCountRef.current = 0;

            if (queued) {
                Alert.alert(
                    "Biglietto salvato in locale",
                    "Sei offline: il biglietto è già consultabile qui e verrà sincronizzato appena torna la connessione."
                );
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Errore", "Non è stato possibile salvare il biglietto. Riprova.");
        }
    }
}

const styles = StyleSheet.create({
    header: {
        paddingTop: ds.layout.headerPaddingTop,
        paddingHorizontal: ds.layout.headerPaddingH,
        paddingBottom: ds.space[7],
        position: "relative",
        overflow: "hidden",
    },
    headerDecor: {
        position: "absolute",
        right: -16,
        top: 8,
        transform: [{ rotate: "-12deg" }],
    },
    title: {
        fontFamily: ds.fontFamily.bold,
        fontSize: 22,
        color: ds.colors.white,
        marginBottom: ds.space[2],
    },
    paragraph: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 12,
        lineHeight: 17,
        color: ds.colors.onBrandMuted,
        maxWidth: 280,
        marginBottom: ds.space[5],
    },
});

/* Schermata di scansione: sfondo navy quasi nero */
const scanStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ds.colors.black,
        justifyContent: "space-between",
        paddingTop: 60,
        paddingBottom: 60,
    },
    scanArea: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 30,
    },
    formArea: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: ds.space[6],
    },
    title: {
        fontFamily: ds.fontFamily.bold,
        fontSize: 18,
        color: ds.colors.white,
        textAlign: "center",
        marginBottom: ds.space[2] + 2,
    },
    subtitle: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 12,
        lineHeight: 18,
        color: "rgba(255,255,255,0.6)",
        textAlign: "center",
        maxWidth: 260,
        marginBottom: ds.space[8] - 2,
    },
    frame: {
        width: 220,
        height: 220,
        position: "relative",
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: ds.radius.l,
    },
    corner: {
        position: "absolute",
        width: 36,
        height: 36,
        borderColor: ds.colors.scale.accent[9],
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderTopLeftRadius: 12,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderTopRightRadius: 12,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderBottomLeftRadius: 12,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderBottomRightRadius: 12,
    },
    input: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 13,
        color: ds.colors.white,
        height: ds.control.md,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        borderRadius: ds.radius.m,
        paddingHorizontal: ds.space[4],
        marginBottom: ds.space[4],
    },
    enrichingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: ds.space[5],
        gap: 8,
    },
    enrichingText: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 12,
        color: "rgba(255,255,255,0.75)",
    },
    summaryCard: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        borderRadius: ds.radius.m,
        padding: ds.space[4],
        marginBottom: ds.space[5],
    },
    summaryLine: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.white,
        marginBottom: 4,
    },
    summaryMuted: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 11,
        lineHeight: 16,
        color: "rgba(255,255,255,0.6)",
        marginTop: 4,
    },
    datePicker: {
        width: Dimensions.get("window").width - 40,
        height: 40,
        marginBottom: ds.space[5],
    },
    pickerActions: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: ds.space[4],
    },
    pickerAction: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.scale.accent[8],
    },
    primaryButton: {
        height: ds.control.lg,
        borderRadius: ds.radius.m,
        backgroundColor: ds.colors.action,
        alignItems: "center",
        justifyContent: "center",
        marginTop: ds.space[3],
    },
    primaryButtonDisabled: {
        opacity: 0.5,
    },
    primaryButtonText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.white,
    },
    backRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    backText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.scale.accent[8],
        marginLeft: ds.space[2] + 2,
    },
    galleryRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: ds.space[6],
        gap: 8,
    },
    galleryText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.scale.accent[8],
    },
});

const modalstyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ds.colors.surface,
        justifyContent: "center",
        paddingHorizontal: ds.layout.screenPadding,
    },
    title: {
        fontFamily: ds.fontFamily.bold,
        fontSize: 18,
        color: ds.colors.text,
        marginBottom: ds.space[6],
    },
    subtitle: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 14,
        color: ds.colors.text,
        flex: 1,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: ds.space[3],
    },
    icon: {
        marginRight: ds.space[3],
    },
    card: {
        borderWidth: 1,
        borderColor: ds.colors.borderSubtle,
        borderRadius: ds.radius.l,
        backgroundColor: ds.colors.surface,
        padding: ds.space[5] - 2,
        marginBottom: ds.space[4],
    },
    paragraph: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 12,
        lineHeight: 18,
        color: ds.colors.textSecondary,
    },
    button: {
        height: ds.control.lg,
        borderRadius: ds.radius.m,
        backgroundColor: ds.colors.action,
        alignItems: "center",
        justifyContent: "center",
        marginTop: ds.space[5],
    },
    buttonText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.white,
    },
});
