/**
 * Test del client realtime.
 *
 * Nessuna rete: `socket.io-client` è sostituito da un doppio in memoria,
 * come fa shared/data/offline.test.ts con AsyncStorage e axios. Quello che
 * si verifica qui sono le tre cose che nella vecchia implementazione erano
 * rotte e che nessun test avrebbe intercettato:
 *
 * - le stanze vanno rifatte a ogni riconnessione;
 * - togliere un listener non deve toglierlo anche alle altre schermate;
 * - due schermate iscritte allo stesso viaggio non devono disiscriversi
 *   a vicenda.
 */

type Handler = (...args: any[]) => void;

/** Doppio del socket restituito da io(): registra gli emit e gli handler. */
class FakeSocket {
  handlers = new Map<string, Handler[]>();
  anyHandlers: Handler[] = [];
  emitted: { event: string; payload: any }[] = [];
  disconnected = false;

  on(event: string, handler: Handler) {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
    return this;
  }

  onAny(handler: Handler) {
    this.anyHandlers.push(handler);
    return this;
  }

  emit(event: string, payload: any) {
    this.emitted.push({ event, payload });
    return this;
  }

  removeAllListeners() {
    this.handlers.clear();
    this.anyHandlers = [];
  }

  disconnect() {
    this.disconnected = true;
  }

  /* ---- helper del test ---- */

  /** Simula un evento del trasporto (connect, disconnect, connect_error). */
  fire(event: string, ...args: any[]) {
    for (const handler of this.handlers.get(event) ?? []) handler(...args);
  }

  /** Simula un evento applicativo in arrivo dal server. */
  deliver(event: string, payload: any) {
    for (const handler of this.anyHandlers) handler(event, payload);
  }

  joinsFor(travelId: string) {
    return this.emitted.filter(
      (e) => e.event === "travel:join" && e.payload?.travelId === travelId
    ).length;
  }

  leavesFor(travelId: string) {
    return this.emitted.filter(
      (e) => e.event === "travel:leave" && e.payload?.travelId === travelId
    ).length;
  }
}

let sockets: FakeSocket[] = [];

jest.mock("socket.io-client", () => ({
  io: () => {
    const socket = new (require("./socketClient.test").__FakeSocket)();
    require("./socketClient.test").__sockets.push(socket);
    return socket;
  },
}));

// Esportati per il mock qui sopra (il factory di jest.mock non può chiudere
// su variabili del modulo di test).
export const __FakeSocket = FakeSocket;
export const __sockets = sockets;

jest.mock("../../global/globalVariable", () => ({ serverLink: "http://test/" }));

import realtimeClient from "./socketClient";

const AUTH = { userid: "u1", token: "t1" };

function current(): FakeSocket {
  return __sockets[__sockets.length - 1];
}

beforeEach(() => {
  realtimeClient.disconnect();
  __sockets.length = 0;
});

describe("connessione", () => {
  test("connect apre un socket e connect con la stessa auth non ne apre un altro", () => {
    realtimeClient.connect(AUTH);
    expect(__sockets.length).toBe(1);

    realtimeClient.connect(AUTH);
    expect(__sockets.length).toBe(1);
  });

  test("un token nuovo riapre la connessione e chiude la precedente", () => {
    realtimeClient.connect(AUTH);
    const first = current();

    realtimeClient.connect({ userid: "u1", token: "t2" });

    expect(first.disconnected).toBe(true);
    expect(__sockets.length).toBe(2);
  });

  test("disconnect chiude davvero il socket (era il bug del logout)", () => {
    realtimeClient.connect(AUTH);
    const socket = current();

    realtimeClient.disconnect();

    expect(socket.disconnected).toBe(true);
    expect(realtimeClient.getState()).toBe("idle");
  });
});

describe("stanze dei viaggi", () => {
  test("il join parte subito se il socket è già connesso", () => {
    realtimeClient.connect(AUTH);
    current().fire("connect");

    realtimeClient.joinTravel("v1");

    expect(current().joinsFor("v1")).toBe(1);
  });

  test("le stanze vengono rifatte a ogni riconnessione", () => {
    realtimeClient.connect(AUTH);
    const socket = current();
    socket.fire("connect");
    realtimeClient.joinTravel("v1");
    expect(socket.joinsFor("v1")).toBe(1);

    // Caduta e ritorno della connessione: senza il rejoin, da qui in poi
    // non arriverebbe più nulla, in silenzio.
    socket.fire("disconnect");
    socket.fire("connect");

    expect(socket.joinsFor("v1")).toBe(2);
  });

  test("due schermate sullo stesso viaggio: una che esce non scollega l'altra", () => {
    realtimeClient.connect(AUTH);
    const socket = current();
    socket.fire("connect");

    realtimeClient.joinTravel("v1"); // home
    realtimeClient.joinTravel("v1"); // travelDetail
    expect(socket.joinsFor("v1")).toBe(1);

    realtimeClient.leaveTravel("v1"); // travelDetail si smonta
    expect(socket.leavesFor("v1")).toBe(0);

    realtimeClient.leaveTravel("v1"); // anche la home si smonta
    expect(socket.leavesFor("v1")).toBe(1);
  });

  test("il cambio utente azzera le stanze del precedente", () => {
    realtimeClient.connect(AUTH);
    current().fire("connect");
    realtimeClient.joinTravel("v1");

    realtimeClient.connect({ userid: "u2", token: "t9" });
    const socket = current();
    socket.fire("connect");

    expect(socket.joinsFor("v1")).toBe(0);
  });
});

describe("listener", () => {
  test("più listener sullo stesso evento ricevono tutti", () => {
    realtimeClient.connect(AUTH);
    const received: string[] = [];

    realtimeClient.on("travel:post:new", () => received.push("a"));
    realtimeClient.on("travel:post:new", () => received.push("b"));

    current().deliver("travel:post:new", { travelId: "v1" });

    expect(received).toEqual(["a", "b"]);
  });

  test("disiscriversi rimuove solo il proprio listener", () => {
    // Il vecchio off(event) li toglieva tutti: bastava che una schermata si
    // smontasse per spegnere il realtime di quelle ancora aperte.
    realtimeClient.connect(AUTH);
    const received: string[] = [];

    const offA = realtimeClient.on("travel:post:new", () => received.push("a"));
    realtimeClient.on("travel:post:new", () => received.push("b"));

    offA();
    current().deliver("travel:post:new", { travelId: "v1" });

    expect(received).toEqual(["b"]);
  });

  test("un listener che lancia non blocca gli altri", () => {
    realtimeClient.connect(AUTH);
    const received: string[] = [];

    realtimeClient.on("travel:post:new", () => {
      throw new Error("boom");
    });
    realtimeClient.on("travel:post:new", () => received.push("b"));

    expect(() => current().deliver("travel:post:new", {})).not.toThrow();
    expect(received).toEqual(["b"]);
  });
});

describe("token rifiutato", () => {
  test("chiede un token nuovo e riconnette", async () => {
    const renew = jest.fn().mockResolvedValue({ userid: "u1", token: "t-nuovo" });
    realtimeClient.setAuthRenewer(renew);

    realtimeClient.connect(AUTH);
    current().fire("connect_error", new Error("auth:expired"));

    // Il rinnovo è asincrono: lasciamo girare la microtask.
    await Promise.resolve();
    await Promise.resolve();

    expect(renew).toHaveBeenCalledTimes(1);
    expect(__sockets.length).toBe(2);

    realtimeClient.setAuthRenewer(null);
  });

  test("un errore di rete non fa scattare il rinnovo", async () => {
    const renew = jest.fn();
    realtimeClient.setAuthRenewer(renew);

    realtimeClient.connect(AUTH);
    current().fire("connect_error", new Error("xhr poll error"));

    await Promise.resolve();

    expect(renew).not.toHaveBeenCalled();
    expect(__sockets.length).toBe(1);

    realtimeClient.setAuthRenewer(null);
  });
});
