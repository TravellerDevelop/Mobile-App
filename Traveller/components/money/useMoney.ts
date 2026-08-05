/**
 * Stato della schermata Money: caricamento, refresh, filtri della lista
 * movimenti e azioni sui saldi.
 *
 * La logica sta qui e non nella schermata così che money.tsx resti solo
 * composizione di UI (stessa impostazione di useNewPostForm / useItinerary).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMoneyRealtime } from "../realtime/hooks";
import { getData } from "../../shared/data/localdata";
import { isOfflineError } from "../../shared/data/apiClient";
import { fetchMoneyOverview, notifyDebt, settleUpWith } from "./api";
import {
  MoneyBalance,
  MoneyMovement,
  MoneyOverview,
  MovementFilter,
} from "./types";

interface CurrentUser {
  _id: string;
  username: string;
  name?: string;
  surname?: string;
}

export function useMoney() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [overview, setOverview] = useState<MoneyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  /* Momento in cui è stata scaricata la copia mostrata, valorizzato solo
     quando i dati arrivano dalla cache: la schermata avvisa che i saldi
     potrebbero non includere le spese aggiunte dagli altri nel frattempo. */
  const [stale, setStale] = useState<number | null>(null);

  /* ---- Filtri lista movimenti ---------------------------------- */
  const [filter, setFilter] = useState<MovementFilter>("all");
  const [travelFilter, setTravelFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const stored = (await getData("user")) as CurrentUser | null;
      if (!stored?._id) {
        // Senza utente in cache non c'è nulla da mostrare: non è un errore
        // di rete, quindi si esce dallo stato di caricamento senza allarmi.
        setOverview(null);
        return;
      }

      setUser(stored);
      const result = await fetchMoneyOverview(stored._id);
      setOverview(result.overview);
      setStale(result.fromCache ? result.savedAt : null);
    } catch (err) {
      console.log("Money overview", err);
      // Senza questo ramo un errore lasciava la schermata sugli scheletri
      // di caricamento all'infinito (nessun .catch sulla vecchia Promise.all).
      setError(
        isOfflineError(err)
          ? "Sei offline e non abbiamo ancora una copia dei tuoi dati."
          : "Non riusciamo a caricare i tuoi dati. Controlla la connessione."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Pull to refresh: attende davvero la risposta prima di chiudere lo spinner. */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  /* ---- Realtime ------------------------------------------------
     Il riepilogo aggrega i pagamenti di tutti i viaggi dell'utente,
     quindi l'evento arriva sulla sua stanza personale e non su quella
     di un viaggio: chi ha la tab Money aperta mentre un compagno
     registra una spesa non è nella stanza di quel viaggio.

     Ricarica silenziosa: la schermata è già disegnata e non deve
     tornare sugli scheletri per un aggiornamento che l'utente non ha
     chiesto. Chi ha appena fatto l'azione ricarica comunque per conto
     suo (settleUp/nudge), e una ricarica in più è innocua. */
  const moneyReloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (moneyReloadTimer.current) clearTimeout(moneyReloadTimer.current);
    },
    []
  );

  useMoneyRealtime(() => {
    if (moneyReloadTimer.current) clearTimeout(moneyReloadTimer.current);
    moneyReloadTimer.current = setTimeout(() => {
      moneyReloadTimer.current = null;
      void load(true);
    }, 400);
  });

  /* ---- Azioni sui saldi ---------------------------------------- */

  /**
   * Marca saldate tutte le quote aperte di una persona verso di me.
   * Consentita solo sui crediti (`theyOweMe`): sui debiti il server
   * rifiuterebbe, perché solo il creditore può confermare un incasso.
   */
  const settleUp = useCallback(
    async (balance: MoneyBalance) => {
      if (!user?._id || settlingId) return;

      setSettlingId(balance.userid);
      try {
        const result = await settleUpWith(user._id, balance.userid);
        if (result === null) {
          // Messa in coda: i saldi qui non cambiano finché non parte.
          setError("Sei offline: il saldo verrà registrato al ritorno della connessione.");
        }
        await load(true);
      } catch (err) {
        console.log("Settle up", err);
        setError("Non siamo riusciti a registrare il saldo. Riprova.");
      } finally {
        setSettlingId(null);
      }
    },
    [user, settlingId, load]
  );

  /** Sollecito (se sono creditore) o avviso "ho pagato" (se sono debitore). */
  const nudge = useCallback(
    async (balance: MoneyBalance) => {
      if (!user?._id) return;

      const creditor = balance.net > 0;
      try {
        await notifyDebt({
          fromUserId: user._id,
          toUserId: balance.userid,
          kind: creditor ? "reminder" : "paid",
          amount: Math.abs(balance.net),
        });
      } catch (err) {
        console.log("Notify debt", err);
      }
    },
    [user]
  );

  /* ---- Derivati ------------------------------------------------ */

  const movements = useMemo<MoneyMovement[]>(() => {
    const all = overview?.movements ?? [];
    const needle = query.trim().toLowerCase();

    return all.filter((movement) => {
      if (travelFilter && movement.travelId !== travelFilter) return false;

      if (filter === "open" && movement.settled) return false;
      if (filter === "out" && movement.direction === "in") return false;
      if (filter === "in" && movement.direction !== "in") return false;

      if (!needle) return true;
      return (
        movement.description.toLowerCase().includes(needle) ||
        movement.travelName.toLowerCase().includes(needle)
      );
    });
  }, [overview, filter, travelFilter, query]);

  /** Crediti e debiti separati: in UI sono due elenchi distinti. */
  const { credits, debts } = useMemo(() => {
    const balances = overview?.balances ?? [];
    return {
      credits: balances.filter((balance) => balance.net > 0),
      debts: balances.filter((balance) => balance.net < 0),
    };
  }, [overview]);

  const hasFilters = filter !== "all" || travelFilter !== null || query.trim().length > 0;

  const clearFilters = useCallback(() => {
    setFilter("all");
    setTravelFilter(null);
    setQuery("");
  }, []);

  return {
    user,
    overview,
    loading,
    refreshing,
    error,
    /** Timestamp della copia in cache mostrata, null se il dato è fresco. */
    stale,
    refresh,
    reload: load,

    filter,
    setFilter,
    travelFilter,
    setTravelFilter,
    query,
    setQuery,
    hasFilters,
    clearFilters,
    movements,

    credits,
    debts,
    settleUp,
    settlingId,
    nudge,
  };
}
