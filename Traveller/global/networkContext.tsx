/* ============================================================
   Traveller — Contesto di rete

   Ponte fra i moduli non-React (shared/data/netStatus + syncQueue) e
   le schermate: espone `online`, il numero di operazioni in attesa di
   invio e un `retry()` manuale.

   Si occupa anche dei due momenti in cui vale la pena riprovare da
   soli: il ritorno della rete e il rientro dell'app in primo piano
   (uscendo dalla metropolitana l'utente riapre l'app, non aspetta il
   ping successivo).
   ============================================================ */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  isOnline,
  pingServer,
  subscribeNetStatus,
} from "../shared/data/netStatus";
import {
  DroppedMutation,
  clearDropped,
  flushQueue,
  flushQueueIfPossible,
  hydrateQueue,
  readDropped,
  subscribeQueue,
} from "../shared/data/syncQueue";

interface NetworkContextValue {
  online: boolean;
  /** Operazioni fatte offline in attesa di essere inviate. */
  pending: number;
  /** Operazioni che il server ha rifiutato e che sono state scartate. */
  dropped: DroppedMutation[];
  dismissDropped: () => Promise<void>;
  /** Verifica la rete e prova subito a svuotare la coda. */
  retry: () => Promise<void>;
  syncing: boolean;
  /**
   * Cambia a ogni riconnessione riuscita: le schermate lo usano come
   * dipendenza di useEffect per ricaricare i propri dati.
   */
  reconnectedAt: number;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(isOnline());
  const [pending, setPending] = useState(0);
  const [dropped, setDropped] = useState<DroppedMutation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [reconnectedAt, setReconnectedAt] = useState(0);
  const wasOffline = useRef(!isOnline());

  /* Stato iniziale: coda salvata + eventuali scarti da mostrare. */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const queue = await hydrateQueue();
      const failures = await readDropped();
      if (cancelled) return;
      setPending(queue.length);
      setDropped(failures);
      // Se qualcosa era rimasto in sospeso dall'ultima sessione, proviamo subito.
      void flushQueueIfPossible();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeQueue((queue) => setPending(queue.length)), []);

  useEffect(
    () =>
      subscribeNetStatus((next) => {
        setOnline(next);

        if (next && wasOffline.current) {
          wasOffline.current = false;
          setReconnectedAt(Date.now());
          void syncNow();
        }

        if (!next) wasOffline.current = true;
      }),
    // syncNow è stabile (useCallback senza dipendenze mutabili)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /* Rientro in primo piano: la rete può essere tornata mentre l'app era
     in background, dove i timer di RN non sono affidabili. */
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state !== "active") return;
      void pingServer().then((ok) => {
        if (ok) void syncNow();
      });
    };

    const subscription = AppState.addEventListener("change", handler);
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await flushQueueIfPossible();
      if (result && result.dropped > 0) setDropped(await readDropped());
    } finally {
      setSyncing(false);
    }
  }, []);

  const retry = useCallback(async () => {
    setSyncing(true);
    try {
      const reachable = await pingServer();
      if (reachable) {
        const result = await flushQueue();
        if (result.dropped > 0) setDropped(await readDropped());
        setReconnectedAt(Date.now());
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  const dismissDropped = useCallback(async () => {
    await clearDropped();
    setDropped([]);
  }, []);

  const value = useMemo(
    () => ({ online, pending, dropped, dismissDropped, retry, syncing, reconnectedAt }),
    [online, pending, dropped, dismissDropped, retry, syncing, reconnectedAt]
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork deve essere usato dentro <NetworkProvider>");
  return ctx;
}

/**
 * Esegue `callback` a ogni riconnessione (non al primo montaggio):
 * scorciatoia per le schermate che devono ricaricarsi quando la rete torna.
 */
export function useOnReconnect(callback: () => void): void {
  const { reconnectedAt } = useNetwork();
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => {
    if (reconnectedAt === 0) return;
    saved.current();
  }, [reconnectedAt]);
}
