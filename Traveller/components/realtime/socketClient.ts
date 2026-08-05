import { io, Socket } from "socket.io-client";
import { serverLink } from "../../global/globalVariable";
import { CLIENT_EVENTS } from "./events";

/**
 * Connessione Socket.io dell'app.
 *
 * Sostituisce `components/utils/socketServise.js`, che aveva tre problemi
 * strutturali, non di rifinitura:
 *
 * 1. `off(event)` rimuoveva TUTTI i listener di quell'evento, non solo il
 *    proprio. Con due schermate in ascolto dello stesso evento — che è
 *    esattamente il caso di home e travelDetail sui post — lo smontaggio di
 *    una spegneva silenziosamente l'altra. Qui `on()` restituisce la
 *    funzione di disiscrizione e non esiste un modo per sbagliare.
 * 2. Nessuno chiudeva il socket precedente al cambio utente o al logout:
 *    i socket orfani restavano aperti e nelle stanze del vecchio account.
 * 3. Le stanze non venivano rifatte alla riconnessione. Il socket cadeva
 *    (tunnel, cambio rete), si riconnetteva, e da lì in poi non arrivava
 *    più niente senza che nulla segnalasse il problema. Qui le stanze sono
 *    uno stato dichiarativo (`desiredTravels`) che viene riapplicato a ogni
 *    `connect`.
 *
 * Modulo singleton e non un context React di proposito: la connessione
 * sopravvive al montaggio/smontaggio delle schermate, e le schermate si
 * limitano a dichiarare a cosa vogliono essere iscritte.
 */

const URL = serverLink.replace(/\/$/, "");

export type ConnectionState = "idle" | "connecting" | "connected" | "unauthorized";

export interface SocketAuth {
  userid: string;
  token: string;
}

type Listener = (payload: any) => void;

class RealtimeClient {
  private socket: Socket | null = null;
  private auth: SocketAuth | null = null;
  private state: ConnectionState = "idle";

  /**
   * Viaggi a cui l'app *vuole* essere iscritta, con quante schermate lo
   * chiedono. È la sorgente di verità: le stanze effettive del socket sono
   * solo una conseguenza, riallineata a ogni connessione.
   *
   * Il conteggio non è un dettaglio: home (iscritta a tutti i viaggi) e
   * travelDetail (iscritta a uno) coesistono, e senza refcount l'uscita da
   * travelDetail toglierebbe quel viaggio anche alla home, che smetterebbe
   * di aggiornarsi senza il minimo segnale.
   */
  private desiredTravels = new Map<string, number>();

  /** Callback per evento, in un Set così due schermate non si pestano i piedi. */
  private listeners = new Map<string, Set<Listener>>();

  private stateListeners = new Set<(state: ConnectionState) => void>();

  /**
   * Come ottenere un token nuovo quando il server rifiuta l'handshake.
   * Iniettata da chi conosce la sessione (RealtimeProvider), per non far
   * dipendere questo modulo dall'auth.
   */
  private renewAuth: (() => Promise<SocketAuth | null>) | null = null;

  /** Evita rinnovi a raffica se il server continua a rifiutare. */
  private renewInFlight = false;

  /**
   * Tentativi di rinnovo consecutivi senza una riconnessione riuscita.
   * Senza un tetto, un server che rifiuta sempre il token nuovo (es.
   * SOCKET_SECRET non fisso, invalidato a ogni riavvio) genera un loop
   * infinito di GET api/user/takeUserById: ogni rinnovo produce un token
   * "diverso" ma comunque non valido, si riconnette subito, il server lo
   * rifiuta di nuovo, e così via senza pause.
   */
  private renewAttempts = 0;

  /** Timer del backoff in corso: null se non c'è un rinnovo in attesa. */
  private renewBackoffTimer: ReturnType<typeof setTimeout> | null = null;

  private static readonly MAX_RENEW_ATTEMPTS = 5;
  private static readonly RENEW_BASE_DELAY_MS = 2000;
  private static readonly RENEW_MAX_DELAY_MS = 60000;

  // ------------------------------------------------------------------ ciclo di vita

  setAuthRenewer(renew: (() => Promise<SocketAuth | null>) | null): void {
    this.renewAuth = renew;
  }

  /**
   * Apre (o riapre) la connessione per l'utente indicato.
   * Chiamarla con lo stesso utente e lo stesso token non fa nulla: è pensata
   * per essere invocata da un effetto React senza doversi preoccupare dei
   * ri-render.
   */
  connect(auth: SocketAuth): void {
    if (!auth?.userid || !auth?.token) return;

    const sameUser = this.auth?.userid === auth.userid;
    const sameToken = this.auth?.token === auth.token;
    if (this.socket && sameUser && sameToken) return;

    // Una connessione "voluta" (login, cambio utente, foreground) prevale
    // su un rinnovo automatico ancora in attesa del suo backoff.
    if (this.renewBackoffTimer) {
      clearTimeout(this.renewBackoffTimer);
      this.renewBackoffTimer = null;
    }

    // Cambio utente: le stanze del precedente non devono sopravvivere.
    if (this.socket && !sameUser) this.desiredTravels.clear();

    this.disconnect(false);
    this.auth = auth;
    this.setState("connecting");

    // `auth` viaggia nell'handshake, non in un evento successivo: il server
    // può così rifiutare la connessione prima ancora che esista un socket in
    // una stanza (vedi io.use in Server/server.ts).
    const socket = io(URL, {
      auth: { userid: auth.userid, token: auth.token },
      // Trasporti lasciati al default (polling con upgrade a websocket):
      // forzare "websocket" fa fallire la connessione dietro i proxy che
      // non lo inoltrano, e il guadagno non vale il rischio.
      //
      // La riconnessione automatica di socket.io basta: qui interessa solo
      // rifare le stanze quando risale (vedi handler "connect").
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      this.setState("connected");
      // Handshake accettato: il problema che il backoff proteggeva non c'è
      // più, si riparte da zero per il prossimo eventuale rifiuto.
      this.renewAttempts = 0;
      // Le stanze non sopravvivono alla caduta del socket: vanno rifatte a
      // ogni connessione, non solo alla prima.
      for (const travelId of this.desiredTravels.keys()) {
        socket.emit(CLIENT_EVENTS.JOIN_TRAVEL, { travelId });
      }
    });

    socket.on("disconnect", () => {
      if (this.state !== "unauthorized") this.setState("connecting");
    });

    socket.on("connect_error", (error: Error) => {
      // Il server codifica il motivo nel messaggio ("auth:expired", ...).
      // Un token scaduto o firmato con un segreto diverso (riavvio del
      // server senza SOCKET_SECRET) si risolve chiedendone uno nuovo;
      // qualunque altro errore è di rete e lo gestisce socket.io da sé.
      if (typeof error?.message === "string" && error.message.startsWith("auth:")) {
        this.setState("unauthorized");
        void this.tryRenewAuth();
      }
    });

    // Un unico ponte fra socket.io e i callback registrati: `onAny` evita di
    // dover aggiungere/togliere handler sul socket a ogni subscribe, che è
    // il punto in cui la vecchia implementazione perdeva i listener.
    socket.onAny((event: string, payload: unknown) => {
      const set = this.listeners.get(event);
      if (!set) return;
      for (const listener of set) {
        try {
          listener(payload);
        } catch (err) {
          console.log("[realtime] listener in errore su", event, err);
        }
      }
    });

    this.socket = socket;
  }

  /** Chiude la connessione. `forget` azzera anche le stanze desiderate (logout). */
  disconnect(forget = true): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.renewBackoffTimer) {
      clearTimeout(this.renewBackoffTimer);
      this.renewBackoffTimer = null;
    }
    if (forget) {
      this.desiredTravels.clear();
      this.auth = null;
      this.setState("idle");
      // Logout o cambio utente: la serie di rifiuti apparteneva alla sessione
      // precedente, non deve limitare i tentativi della prossima.
      this.renewAttempts = 0;
    }
  }

  private async tryRenewAuth(): Promise<void> {
    if (this.renewInFlight || this.renewBackoffTimer || !this.renewAuth) return;

    if (this.renewAttempts >= RealtimeClient.MAX_RENEW_ATTEMPTS) {
      // Troppi rifiuti di fila (es. server che invalida il token a ogni
      // riavvio): ci fermiamo per non martellare api/user/takeUserById.
      // Si riparte da capo al prossimo handshake accettato o alla prossima
      // connect() "voluta" (login, cambio utente, rientro in foreground).
      return;
    }

    this.renewInFlight = true;
    try {
      const next = await this.renewAuth();
      this.renewAttempts += 1;
      if (next?.token && next.token !== this.auth?.token) {
        this.scheduleRenewedConnect(next);
      }
    } catch {
      /* nessun token nuovo: si resta scollegati, l'app funziona lo stesso */
    } finally {
      this.renewInFlight = false;
    }
  }

  /**
   * Riconnette con il token rinnovato dopo un backoff esponenziale
   * (2s, 4s, 8s, 16s, 32s, tetto a RENEW_MAX_DELAY_MS), invece che subito:
   * è la differenza fra "il server rifiuta 5 volte in un secondo" e "il
   * server rifiuta 5 volte in un minuto".
   */
  private scheduleRenewedConnect(auth: SocketAuth): void {
    const delay = Math.min(
      RealtimeClient.RENEW_BASE_DELAY_MS * 2 ** (this.renewAttempts - 1),
      RealtimeClient.RENEW_MAX_DELAY_MS
    );
    this.renewBackoffTimer = setTimeout(() => {
      this.renewBackoffTimer = null;
      this.connect(auth);
    }, delay);
  }

  // ------------------------------------------------------------------ stanze

  /**
   * Entra nella stanza di un viaggio. Il server verifica che l'utente ne sia
   * davvero partecipante: se non lo è, il join viene semplicemente ignorato.
   *
   * Va sempre accoppiata a una `leaveTravel` (gli hook lo fanno nel cleanup
   * dell'effetto): il conteggio serve proprio a rendere sicuro chiamarla da
   * più schermate contemporaneamente.
   */
  joinTravel(travelId: string): void {
    if (!travelId) return;
    const count = this.desiredTravels.get(travelId) ?? 0;
    this.desiredTravels.set(travelId, count + 1);
    // Solo il primo interessato manda il join: dal secondo in poi la stanza
    // c'è già.
    if (count === 0) this.socket?.emit(CLIENT_EVENTS.JOIN_TRAVEL, { travelId });
  }

  leaveTravel(travelId: string): void {
    if (!travelId) return;
    const count = this.desiredTravels.get(travelId);
    if (!count) return;

    if (count > 1) {
      this.desiredTravels.set(travelId, count - 1);
      return;
    }

    this.desiredTravels.delete(travelId);
    this.socket?.emit(CLIENT_EVENTS.LEAVE_TRAVEL, { travelId });
  }

  // ------------------------------------------------------------------ eventi

  /**
   * Registra un callback e restituisce la funzione per rimuoverlo.
   *
   * Restituire la disiscrizione (invece di offrire un `off(event)`) è quello
   * che rende impossibile l'errore della vecchia implementazione: si può
   * togliere solo il proprio callback, mai quello di un'altra schermata.
   */
  on(event: string, listener: Listener): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);

    return () => {
      const current = this.listeners.get(event);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) this.listeners.delete(event);
    };
  }

  // ------------------------------------------------------------------ stato

  getState(): ConnectionState {
    return this.state;
  }

  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setState(next: ConnectionState): void {
    if (this.state === next) return;
    this.state = next;
    for (const listener of this.stateListeners) {
      try {
        listener(next);
      } catch {
        /* ignora */
      }
    }
  }
}

const realtimeClient = new RealtimeClient();
export default realtimeClient;
