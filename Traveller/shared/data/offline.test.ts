/* ============================================================
   Test del livello offline: cache, client REST e coda di scrittura.

   AsyncStorage e axios sono sostituiti da doppi in memoria: qui
   interessa il comportamento (cosa succede quando la rete cade e
   quando torna), non l'integrazione con le librerie.
   ============================================================ */

const mockStorage = new Map<string, string>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStorage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      mockStorage.delete(key);
    }),
    getAllKeys: jest.fn(async () => [...mockStorage.keys()]),
    multiRemove: jest.fn(async (keys: string[]) => {
      keys.forEach((key) => mockStorage.delete(key));
    }),
  },
}));

jest.mock("../../global/globalVariable", () => ({ serverLink: "http://test/" }));

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    isAxiosError: (error: any) => Boolean(error?.isAxiosError),
  },
  isAxiosError: (error: any) => Boolean(error?.isAxiosError),
}));

import { apiGet, apiSend, isOfflineError } from "./apiClient";
import { cacheKeys, clearAllCache, readCache, writeCache } from "./offlineCache";
import { isOnline, resetNetStatusForTests } from "./netStatus";
import {
  clearDropped,
  clearQueue,
  flushQueue,
  readDropped,
  readQueue,
  resetQueueForTests,
} from "./syncQueue";

/** Errore "la richiesta non è mai arrivata al server". */
const networkError = () => ({ isAxiosError: true, code: "ERR_NETWORK", response: undefined });
/** Errore applicativo: il server ha risposto, quindi la rete c'è. */
const serverError = (status: number) => ({ isAxiosError: true, response: { status } });

beforeEach(async () => {
  mockStorage.clear();
  mockGet.mockReset();
  mockPost.mockReset();
  resetNetStatusForTests();
  resetQueueForTests();
  await clearQueue();
  await clearDropped();
  resetQueueForTests();
});

/* I test che simulano una caduta di rete fanno partire il ping periodico
   di netStatus: senza questo stop Jest resta appeso sul timer. */
afterEach(() => {
  resetNetStatusForTests();
});

describe("cache delle letture", () => {
  it("salva la risposta del server e la rilegge quando la rete manca", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ _id: "1", name: "Lisbona" }] });
    const first = await apiGet<any[]>("http://test/api/travels", { cacheKey: "travels" });

    expect(first.fromCache).toBe(false);
    expect(first.data).toHaveLength(1);

    mockGet.mockRejectedValueOnce(networkError());
    const second = await apiGet<any[]>("http://test/api/travels", { cacheKey: "travels" });

    expect(second.fromCache).toBe(true);
    expect(second.data[0].name).toBe("Lisbona");
    expect(second.savedAt).toBeGreaterThan(0);
    expect(isOnline()).toBe(false);
  });

  it("senza cache lancia OfflineError, non l'errore axios grezzo", async () => {
    mockGet.mockRejectedValueOnce(networkError());

    try {
      await apiGet("http://test/api/travels", { cacheKey: "mai-scaricato" });
      throw new Error("doveva lanciare");
    } catch (error) {
      expect(isOfflineError(error)).toBe(true);
    }
  });

  it("un errore applicativo non passa dalla cache né segna offline", async () => {
    await writeCache("travels", [{ _id: "1" }]);
    mockGet.mockRejectedValueOnce(serverError(500));

    await expect(apiGet("http://test/api/travels", { cacheKey: "travels" })).rejects.toBeDefined();
    expect(isOnline()).toBe(true);
  });

  it("applica la trasformazione prima di salvare, non dopo aver letto", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ n: 1 }, { n: 2 }] });
    await apiGet<number[]>("http://test/api/n", {
      cacheKey: "n",
      transform: (data: any[]) => data.map((item) => item.n * 10),
    });

    const cached = await readCache<number[]>("n");
    expect(cached?.data).toEqual([10, 20]);
  });

  it("clearAllCache (logout) rimuove solo le chiavi della cache", async () => {
    await writeCache("travels", [1]);
    mockStorage.set("user", '{"_id":"1"}');

    await clearAllCache();

    expect(await readCache("travels")).toBeNull();
    expect(mockStorage.get("user")).toBe('{"_id":"1"}');
  });
});

describe("coda delle scritture", () => {
  it("mette in coda la richiesta fallita per rete e la invia al ritorno", async () => {
    mockPost.mockRejectedValueOnce(networkError());

    const result = await apiSend("http://test/api/post/create", { param: { type: "text" } }, {
      queue: { label: "Nuovo post", invalidates: [cacheKeys.travelPosts("t1")] },
    });

    expect(result.queued).toBe(true);
    expect(await readQueue()).toHaveLength(1);

    mockPost.mockResolvedValueOnce({ data: "ok" });
    const flushed = await flushQueue();

    expect(flushed.sent).toBe(1);
    expect(await readQueue()).toHaveLength(0);
  });

  it("invalida la cache indicata quando l'invio riesce", async () => {
    await writeCache(cacheKeys.travelPosts("t1"), [{ _id: "vecchio" }]);
    mockPost.mockRejectedValueOnce(networkError());
    await apiSend("http://test/api/post/create", {}, {
      queue: { label: "Nuovo post", invalidates: [cacheKeys.travelPosts("t1")] },
    });

    mockPost.mockResolvedValueOnce({ data: "ok" });
    await flushQueue();

    expect(await readCache(cacheKeys.travelPosts("t1"))).toBeNull();
  });

  it("mantiene l'ordine e si ferma se la rete cade di nuovo a metà", async () => {
    mockPost.mockRejectedValue(networkError());
    await apiSend("http://test/api/uno", { n: 1 }, { queue: { label: "uno" } });
    await apiSend("http://test/api/due", { n: 2 }, { queue: { label: "due" } });
    mockPost.mockReset();

    mockPost.mockResolvedValueOnce({ data: "ok" }).mockRejectedValueOnce(networkError());
    const result = await flushQueue();

    expect(mockPost.mock.calls[0][0]).toBe("http://test/api/uno");
    expect(result.sent).toBe(1);

    const remaining = await readQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].url).toBe("http://test/api/due");
  });

  it("scarta dopo 3 tentativi ciò che il server rifiuta, senza bloccare il resto", async () => {
    mockPost.mockRejectedValue(networkError());
    await apiSend("http://test/api/rifiutata", {}, { queue: { label: "Operazione non valida" } });
    await apiSend("http://test/api/valida", {}, { queue: { label: "Valida" } });
    mockPost.mockReset();

    // Tre giri: due tentativi falliti lasciano l'elemento in testa, il terzo lo scarta.
    mockPost.mockRejectedValueOnce(serverError(400));
    await flushQueue();
    expect(await readQueue()).toHaveLength(2);

    mockPost.mockRejectedValueOnce(serverError(400));
    await flushQueue();
    expect(await readQueue()).toHaveLength(2);

    mockPost.mockRejectedValueOnce(serverError(400)).mockResolvedValueOnce({ data: "ok" });
    const result = await flushQueue();

    expect(result.dropped).toBe(1);
    expect(result.sent).toBe(1);
    expect(await readQueue()).toHaveLength(0);

    const dropped = await readDropped();
    expect(dropped).toHaveLength(1);
    expect(dropped[0].label).toBe("Operazione non valida");
  });

  it("senza opzione queue l'operazione offline fallisce invece di essere differita", async () => {
    mockPost.mockRejectedValueOnce(networkError());

    try {
      await apiSend("http://test/api/user/login", { username: "a" });
      throw new Error("doveva lanciare");
    } catch (error) {
      expect(isOfflineError(error)).toBe(true);
    }

    expect(await readQueue()).toHaveLength(0);
  });
});
