import { useCallback, useEffect, useMemo, useState } from "react";
import { getData } from "../../shared/data/localdata";
import * as api from "./api";
import { dayConflicts, stopsOfDay, todayIndex } from "./schedule";
import type {
  ItineraryData,
  ItineraryPermissionMode,
  Stop,
  StopChecklistItem,
  StopInput,
  StopStatus,
} from "./types";

/* ============================================================
   Stato dell'itinerario di un viaggio.
   Tutte le mutazioni ricaricano dal server invece di aggiornare
   lo stato locale: il piano è condiviso e due persone possono
   modificarlo insieme, quindi la verità sta sul server.
   ============================================================ */

interface UseItineraryOptions {
  travelId: string;
}

export type ItineraryTab = "ideas" | "timeline";

export function useItinerary({ travelId }: UseItineraryOptions) {
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ItineraryTab>("timeline");
  const [selectedDay, setSelectedDay] = useState(0);

  /* Il giorno mostrato all'apertura è quello di oggi se il viaggio è in
     corso: durante il viaggio è quasi sempre quello che si vuole vedere. */
  const [dayInitialized, setDayInitialized] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const user = await getData("user");
        if (!user?._id) {
          setError("Utente non trovato");
          return;
        }
        setUserId(user._id);

        const itinerary = await api.fetchItinerary(travelId, user._id);
        setData(itinerary);
        setError(null);

        if (!silent) {
          setTab(itinerary.days.length === 0 ? "ideas" : "timeline");
        }
      } catch (err) {
        console.log("Itinerario — caricamento", err);
        setError("Non riesco a caricare l'itinerario");
      } finally {
        setLoading(false);
      }
    },
    [travelId]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (dayInitialized || !data || data.days.length === 0) return;
    const today = todayIndex(data.days);
    setSelectedDay(today ?? 0);
    setDayInitialized(true);
  }, [data, dayInitialized]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  /* ---- Mutazioni ------------------------------------------- */

  /** Esegue l'operazione e ricarica; l'errore torna al chiamante per l'alert. */
  const run = useCallback(
    async <T,>(operation: (uid: string) => Promise<T>): Promise<T | null> => {
      if (!userId) return null;
      try {
        const result = await operation(userId);
        await load(true);
        return result;
      } catch (err: any) {
        const message = err?.response?.data || "Operazione non riuscita";
        console.log("Itinerario — mutazione", message);
        throw new Error(typeof message === "string" ? message : "Operazione non riuscita");
      }
    },
    [userId, load]
  );

  const addStop = useCallback(
    (param: StopInput) => run((uid) => api.createStop(travelId, uid, param)),
    [run, travelId]
  );

  const editStop = useCallback(
    (id: string, param: Partial<StopInput>) => run((uid) => api.updateStop(id, uid, param)),
    [run]
  );

  const removeStop = useCallback((id: string) => run((uid) => api.deleteStop(id, uid)), [run]);

  const assignToDay = useCallback(
    (id: string, day: number | null, startTime?: string | null, index?: number) =>
      run((uid) => api.assignStop(id, uid, day, startTime, index)),
    [run]
  );

  const reorderDay = useCallback(
    (day: number | null, order: string[]) => run((uid) => api.reorderStops(travelId, uid, day, order)),
    [run, travelId]
  );

  const setStatus = useCallback(
    (id: string, status: StopStatus) => run((uid) => api.updateStopStatus(id, uid, status)),
    [run]
  );

  const toggleVote = useCallback((id: string) => run((uid) => api.voteStop(id, uid)), [run]);

  const setChecklist = useCallback(
    (id: string, checklist: StopChecklistItem[]) => run((uid) => api.updateChecklist(id, uid, checklist)),
    [run]
  );

  const setMode = useCallback(
    (mode: ItineraryPermissionMode) => run((uid) => api.updateMode(travelId, uid, mode)),
    [run, travelId]
  );

  /** Sposta una tappa di una posizione dentro il giorno (alternativa accessibile al drag). */
  const moveStop = useCallback(
    async (stop: Stop, direction: -1 | 1) => {
      if (!data || stop.day === null) return;
      const ordered = stopsOfDay(data.stops, stop.day);
      const from = ordered.findIndex((item) => item._id === stop._id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= ordered.length) return;

      const next = [...ordered];
      next.splice(to, 0, next.splice(from, 1)[0]);
      await reorderDay(stop.day, next.map((item) => item._id));
    },
    [data, reorderDay]
  );

  /* ---- Derivati -------------------------------------------- */

  const currentDayStops = useMemo(
    () => (data ? stopsOfDay(data.stops, selectedDay) : []),
    [data, selectedDay]
  );

  const conflicts = useMemo(() => dayConflicts(currentDayStops), [currentDayStops]);

  /** Giorni con almeno un avviso: alimenta il puntino rosso sulle tab. */
  const conflictDays = useMemo(() => {
    if (!data) return new Set<number>();
    const flagged = new Set<number>();
    for (const day of data.days) {
      if (dayConflicts(stopsOfDay(data.stops, day.index)).length > 0) flagged.add(day.index);
    }
    return flagged;
  }, [data]);

  const hasDates = Boolean(data?.startDate && data?.endDate);

  return {
    userId,
    data,
    loading,
    refreshing,
    error,
    refresh,
    reload: load,
    tab,
    setTab,
    selectedDay,
    setSelectedDay,
    currentDayStops,
    conflicts,
    conflictDays,
    hasDates,
    addStop,
    editStop,
    removeStop,
    assignToDay,
    reorderDay,
    moveStop,
    setStatus,
    toggleVote,
    setChecklist,
    setMode,
  };
}

export type ItineraryController = ReturnType<typeof useItinerary>;
