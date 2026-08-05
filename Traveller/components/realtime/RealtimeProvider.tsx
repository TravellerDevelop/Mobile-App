import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "../../global/authContext";
import realtimeClient, { ConnectionState } from "./socketClient";

/**
 * Tiene la connessione realtime allineata alla sessione.
 *
 * Va montato sotto <AuthProvider> e sopra le schermate: è l'unico punto
 * dell'app che apre e chiude il socket. Le schermate non lo fanno mai —
 * usano gli hook in `hooks.ts`, che si limitano a dichiarare a quali
 * viaggi ed eventi sono interessate.
 *
 * Prima questa responsabilità stava dentro NotificationsProvider, che
 * inizializzava il socket in un effetto su `userId` e non lo chiudeva mai:
 * al logout la connessione restava aperta, nella stanza del vecchio utente.
 */

interface RealtimeContextValue {
  state: ConnectionState;
  /** True quando gli eventi stanno arrivando davvero. */
  online: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({ state: "idle", online: false });

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshSession } = useAuth();
  const [state, setState] = useState<ConnectionState>(realtimeClient.getState());

  const userId = user?._id;
  const token = (user as { socketToken?: string } | null)?.socketToken;

  // In un ref perché il client la conserva a lungo: passare la funzione
  // "fresca" a ogni render provocherebbe una riconnessione per niente.
  const refreshRef = useRef(refreshSession);
  refreshRef.current = refreshSession;

  useEffect(() => realtimeClient.onStateChange(setState), []);

  // Come rinnovare il token quando il server rifiuta l'handshake: rileggere
  // il profilo, da cui il server rimanda un socketToken nuovo.
  useEffect(() => {
    realtimeClient.setAuthRenewer(async () => {
      const fresh = await refreshRef.current();
      const nextToken = (fresh as { socketToken?: string } | null)?.socketToken;
      if (!fresh?._id || !nextToken) return null;
      return { userid: fresh._id, token: nextToken };
    });
    return () => realtimeClient.setAuthRenewer(null);
  }, []);

  // Sessione ↔ connessione. Il logout chiude davvero il socket: senza,
  // il dispositivo resterebbe nelle stanze dell'account precedente.
  useEffect(() => {
    if (!userId || !token) {
      realtimeClient.disconnect();
      return;
    }
    realtimeClient.connect({ userid: userId, token });
  }, [userId, token]);

  // Ritorno in primo piano. socket.io riconnette da sé, ma su mobile il
  // socket muore in background senza che il client se ne accorga subito:
  // toccare `connect` al risveglio accorcia il buco in cui gli eventi si
  // perdono. È idempotente — con auth invariata e socket vivo non fa nulla.
  useEffect(() => {
    if (!userId || !token) return;

    const onChange = (next: AppStateStatus) => {
      if (next === "active") realtimeClient.connect({ userid: userId, token });
    };

    const subscription = AppState.addEventListener("change", onChange);
    return () => subscription.remove();
  }, [userId, token]);

  const value = useMemo(
    () => ({ state, online: state === "connected" }),
    [state]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeState(): RealtimeContextValue {
  return useContext(RealtimeContext);
}
