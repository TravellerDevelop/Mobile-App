/**
 * Tipi delle response del backend (server.ts / func/*.ts).
 *
 * Sul filo HTTP/JSON, ObjectId e Date del server arrivano sempre come
 * stringhe: qui vengono quindi tipizzati come `string`, a differenza delle
 * interfacce equivalenti lato server (che usano ObjectId/Date).
 */

// ======================================================================
// User (collection "user")
// ======================================================================

export interface ApiUser {
    _id: string;
    name: string;
    surname: string;
    username: string;
    email: string;
    /**
     * Presente solo nelle richieste inviate al server: le response non lo
     * contengono più (vedi `forClient()` in Server/func/user.ts).
     * @deprecated non leggerlo da una response.
     */
    password: string;
    /**
     * Credenziale firmata dal server per l'handshake Socket.io, restituita
     * da login/registrazione/takeUserById. Va trattata come una password:
     * vive solo in SecureStore (vedi global/authContext.tsx) e non finisce
     * nella copia in chiaro su AsyncStorage.
     */
    socketToken?: string;
    notifToken?: (string | null)[];
    /**
     * Nome file dell'immagine profilo. Il client la legge e prova a
     * impostarla via api/user/uploadImage + api/user/setImage, ma queste
     * due route non sono (ancora) implementate lato server.
     */
    image?: string;
}

export interface ApiCountResponse {
    count: number;
}

export interface ApiSetNotifTokenResponse {
    updated: boolean;
    token: (string | null)[];
}

export interface ApiVerifyTokenResponse {
    is: boolean;
    updated?: boolean;
}

/**
 * Documento della collection "test" (api/takeVersion): non ha uno schema
 * dedicato lato server (vedi util/tests.ts, tipizzata genericamente come
 * Document), quindi qui viene rappresentato in modo altrettanto permissivo.
 */
export interface ApiAppVersionDoc {
    _id: string;
    AppVersion: string;
    [key: string]: unknown;
}

// ======================================================================
// Travel (collection "travels")
// ======================================================================

export interface ApiTravelParticipant {
    userid: string;
    creator?: boolean;
    /** Presente solo nelle risposte arricchite via lookup (es. api/travel/takeJoined). */
    username?: string;
    /**
     * Tetto di spesa personale del partecipante su quel viaggio, salvato via
     * api/travel/setPersonalBudget. Assente finché non viene impostato.
     */
    personalBudget?: number | null;
}

export interface ApiTravel {
    _id: string;
    name: string;
    description: string;
    budget: number | string | null;
    participants: ApiTravelParticipant[];
    visibility: string | number;
    creation_date: string;
    new_members_allowed: string | number;
    code: string;
    closed?: boolean;
    image?: string;
    /** @deprecated campo legacy, non più scritto dal client. */
    date?: string;
}

/** Viaggio con lo username di ogni partecipante già risolto (api/travel/takeJoined). */
export interface ApiJoinedTravel extends Omit<ApiTravel, "participants"> {
    participants: (ApiTravelParticipant & { username: string })[];
    /** Quante cose non ha ancora visto l'utente su questo viaggio (badge in home). */
    unseenCount: number;
}

/** Riga restituita da api/travel/takeParticipants. */
export interface ApiTravelParticipantInfo {
    _id: string;
    username: string;
    name: string;
    surname: string;
}

// ======================================================================
// Post (collection "posts")
// ======================================================================

export interface ApiPostDestinator {
    userid: string;
    payed: boolean;
}

interface ApiPostBase {
    _id: string;
    creator: string;
    travel: string;
    pinned: boolean;
    dateTime: string;
}

export interface ApiPaymentPost extends ApiPostBase {
    type: "payments";
    amount: number;
    destinator: ApiPostDestinator[];
    paymentType: "normal" | "personal";
    description: string;
}

export interface ApiTextPost extends ApiPostBase {
    type: "text";
    content: string;
}

export interface ApiVotePost extends ApiPostBase {
    type: "vote";
    question: string;
    /** Opzioni disponibili per il voto. */
    content: string[];
    /** Per ogni opzione (stesso indice di "content"), gli username che l'hanno votata. */
    votes: string[][];
}

export interface ApiImagesPost extends ApiPostBase {
    type: "images";
    source: string[];
    description: string;
}

export interface ApiTodoItem {
    key: number;
    label: string;
    checked: boolean;
}

export interface ApiTodoPost extends ApiPostBase {
    type: "todo";
    description: string;
    items: ApiTodoItem[];
}

/** Azione sull'itinerario finita nel feed (post generato dal server). */
export type ApiItineraryAction =
    | "proposed"
    | "added"
    | "updated"
    | "moved"
    | "removed"
    | "done"
    | "skipped";

/**
 * Post di sistema creato dagli endpoint dell'itinerario quando qualcuno
 * tocca il piano: non è creabile dal compositore dei post.
 */
export interface ApiItineraryPost extends ApiPostBase {
    type: "itinerary";
    action: ApiItineraryAction;
    /** Tappa collegata; null se è stata eliminata o se l'evento riguarda l'intera giornata. */
    stop: string | null;
    stopTitle: string;
    day: number | null;
    detail: string;
}

/** Post della collection "posts": union discriminata sul campo "type". */
export type ApiPost =
    | ApiPaymentPost
    | ApiTextPost
    | ApiVotePost
    | ApiImagesPost
    | ApiTodoPost
    | ApiItineraryPost;

/** Dati (non sensibili) del creatore, uniti via lookup su api/post/take e api/post/takeLastsByUsername. */
export interface ApiPostCreatorData {
    _id: string;
    name: string;
    surname: string;
    username: string;
}

export type ApiPostWithCreatorData = ApiPost & { creatorData: ApiPostCreatorData[] };

/** Riga di riepilogo pagamenti raggruppati per viaggio (api/post/takePayedGroupByTravel). */
export interface ApiPayedGroupByTravel {
    name: string;
    total: number;
}

// ======================================================================
// Follow (collection "follow")
// ======================================================================

export interface ApiFollow {
    _id: string;
    from: string;
    to: string;
    accepted: boolean;
}

// ======================================================================
// Ticket (collection "tickets")
// ======================================================================

export interface ApiTicketAirport {
    iata: string;
    name: string;
}

export interface ApiTicketCompany {
    name: string;
    iata: string;
    icao: string;
}

export interface ApiTicket {
    _id: string;
    name: string;
    surname: string;
    from: ApiTicketAirport;
    to: ApiTicketAirport;
    company: ApiTicketCompany;
    flightNumber: string;
    aircraft: string;
    qrdata: string;
    qrtype: number;
    title: string;
    date: string;
    creator: string;
    seat: string;
    /** Risolto in username (stringa) da api/tickets/take; assente se non condiviso. */
    sharedBy?: string;

    // --- Campi aggiuntivi letti dal barcode IATA-BCBP e/o dall'arricchimento
    // via api/tickets/lookupFlight (vedi components/tickets/bcbp.ts e api.ts).
    // Tutti opzionali: i biglietti creati prima di questa modifica, o quelli
    // il cui arricchimento è fallito, semplicemente non li avranno valorizzati.
    /** Codice di compartimento IATA (F/J/C/Y/…), letto direttamente dal barcode. */
    compartmentCode?: string;
    /** Etichetta leggibile del compartimento (es. "Economy"), calcolata da compartmentCode. */
    classLabel?: string;
    /** Numero di sequenza check-in, letto dal barcode. */
    checkInSequence?: string;
    /** Codice di prenotazione (PNR), letto dal barcode. */
    pnr?: string;
    /** Numero di registrazione dell'aeromobile (se disponibile dall'arricchimento). */
    aircraftReg?: string;
    departureTerminal?: string;
    departureGate?: string;
    departureCheckInDesk?: string;
    /** Orario locale di partenza previsto, formato ISO (es. "2026-08-13T09:35"). */
    departureTimeLocal?: string;
    arrivalTerminal?: string;
    arrivalGate?: string;
    arrivalBaggageBelt?: string;
    /** Orario locale di arrivo previsto, stesso formato di departureTimeLocal. */
    arrivalTimeLocal?: string;
    /** Stato del volo al momento della scansione (es. "Expected", "Canceled"): puramente informativo, non aggiornato in tempo reale. */
    status?: string;
}
