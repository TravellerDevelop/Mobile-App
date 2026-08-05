/* ============================================================
   Traveller — Sessione di autenticazione

   La sessione "vera" (fonte di verità sul dispositivo) vive in
   expo-secure-store, cioè nel Keychain su iOS e nel Keystore-backed
   EncryptedSharedPreferences su Android: a differenza di AsyncStorage,
   che scrive JSON in chiaro leggibile da chiunque abbia accesso al
   filesystem dell'app (device compromesso, backup, adb su un device di
   sviluppo), questi storage sono cifrati dal sistema operativo.

   AsyncStorage["user"] resta comunque aggiornato in parallelo (sempre
   SENZA il campo "password") perché molte schermate esistenti
   (home, profile, money, ...) leggono l'utente con getData("user"):
   migrarle tutte è fuori dallo scope di questa modifica, ma il dato
   sensibile (la password/il suo digest) non viene più scritto da
   nessuna parte sul device, né qui né nelle risposte del backend che
   passano da questo modulo (vedi components/auth/api.ts:sanitizeUser).
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
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUserById } from "../components/auth/api";
import { releasePushToken } from "../components/notifications/pushClient";
import { clearAllCache } from "../shared/data/offlineCache";
import { clearDropped, clearQueue } from "../shared/data/syncQueue";
import type { AuthUser } from "../components/auth/types";
import {
  clearAuthCredentials,
  installAuthInterceptor,
  setAuthCredentials,
  setAuthRefresher,
} from "../shared/data/authToken";

const SESSION_KEY = "auth_session";
const LEGACY_USER_KEY = "user";

// Registrato una sola volta, al caricamento del modulo: da qui in poi ogni
// richiesta axios di ogni file dell'app porta le credenziali correnti (vedi
// shared/data/authToken.ts sul perché è fatto così invece che per-chiamata).
installAuthInterceptor();

/**
 * Aggiorna le credenziali REST/socket a partire da un utente appena
 * ottenuto dal server. Silenzioso se manca il socketToken (non dovrebbe
 * succedere per le risposte di login/registrazione/refresh, ma un utente
 * caricato da una copia locale molto vecchia potrebbe non averlo).
 */
function syncCredentials(user: AuthUser | null): void {
  const token = (user as { socketToken?: string } | null)?.socketToken;
  if (user?._id && token) {
    setAuthCredentials({ userId: user._id, token });
  } else {
    clearAuthCredentials();
  }
}

// expo-secure-store non è disponibile su web: sulla build web l'app usava
// già solo AsyncStorage, quindi lì il comportamento resta invariato.
const isSecureStoreSupported = Platform.OS !== "web";

async function secureGet(key: string): Promise<string | null> {
  if (!isSecureStoreSupported) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (!isSecureStoreSupported) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureDelete(key: string): Promise<void> {
  if (!isSecureStoreSupported) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

function stripPasswordIfPresent(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  if (!candidate._id) return null;

  const { password: _password, ...rest } = candidate as { password?: unknown } & Record<
    string,
    unknown
  >;
  return rest as AuthUser;
}

async function persistUser(user: AuthUser): Promise<void> {
  // La copia legacy su AsyncStorage è in chiaro (vedi l'intestazione del
  // file): il socketToken è una credenziale — chi ce l'ha può aprire il
  // canale realtime come questo utente — quindi resta solo nel SecureStore,
  // esattamente come si fa con la password. Nessuna schermata che legge
  // getData("user") ne ha bisogno: il socket lo prende da useAuth().
  const { socketToken: _socketToken, ...withoutToken } = user as AuthUser & { socketToken?: string };

  await Promise.all([
    secureSet(SESSION_KEY, JSON.stringify(user)),
    AsyncStorage.setItem(LEGACY_USER_KEY, JSON.stringify(withoutToken)),
  ]);
}

type AuthStatus = "checking" | "signedIn" | "signedOut";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Da chiamare dopo un login/una registrazione riusciti. */
  login: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Rilegge il profilo dal server e lo ripersiste, restituendo la versione
   * aggiornata (null se il server non risponde).
   *
   * Serve al canale realtime: il `socketToken` ha una scadenza e il server
   * lo invalida anche a ogni riavvio se SOCKET_SECRET non è configurato.
   * Quando l'handshake viene rifiutato, il socket chiama questa funzione per
   * ottenerne uno nuovo invece di restare scollegato fino al riavvio dell'app.
   */
  refreshSession: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const sessionRaw = await secureGet(SESSION_KEY);
        let sessionUser = sessionRaw ? stripPasswordIfPresent(JSON.parse(sessionRaw)) : null;

        if (!sessionUser) {
          // Migrazione da versioni precedenti dell'app, che salvavano la
          // sessione solo su AsyncStorage (in chiaro, a volte con la
          // password incluso). Se la troviamo, la spostiamo nello storage
          // sicuro e ripuliamo subito il campo password.
          const legacyRaw = await AsyncStorage.getItem(LEGACY_USER_KEY);
          const legacyUser = legacyRaw ? stripPasswordIfPresent(JSON.parse(legacyRaw)) : null;
          if (legacyUser) {
            sessionUser = legacyUser;
            await persistUser(legacyUser);
          }
        }

        if (cancelled) return;

        if (sessionUser) {
          setUser(sessionUser);
          setStatus("signedIn");
          syncCredentials(sessionUser);

          // Rinfresca i dati in background: se il profilo è cambiato (o
          // l'account non esiste più) li allineiamo, ma un errore di rete
          // qui non deve buttare fuori l'utente da una sessione altrimenti
          // valida (stesso comportamento, best-effort, del vecchio App.tsx).
          const fresh = await fetchUserById(sessionUser._id);
          if (!cancelled && fresh) {
            setUser(fresh);
            syncCredentials(fresh);
            await persistUser(fresh);
          }
        } else {
          setStatus("signedOut");
        }
      } catch {
        if (!cancelled) setStatus("signedOut");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (nextUser: AuthUser) => {
    try {
      await persistUser(nextUser);
    } catch (error) {
      // Se la scrittura persistente fallisce (storage pieno, Keychain non
      // disponibile...) l'utente resta comunque loggato per questa sessione
      // in memoria: non blocchiamo l'accesso per un problema di solo storage.
      console.warn("Impossibile salvare la sessione:", error);
    }
    setUser(nextUser);
    setStatus("signedIn");
    syncCredentials(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Prima di perdere l'id: sgancia il token push dall'account, altrimenti
      // il dispositivo continua a ricevere le notifiche dell'utente uscito
      // finché non reinstalla l'app. Il token resta sul device (SecureStore)
      // ed è il prossimo login a riassociarlo, tramite syncPushToken.
      if (user?._id) await releasePushToken(user._id);
    } catch (error) {
      console.warn("Impossibile rilasciare il token notifiche:", error);
    }

    try {
      await Promise.all([
        secureDelete(SESSION_KEY),
        AsyncStorage.removeItem(LEGACY_USER_KEY),
        AsyncStorage.removeItem("username"),
        // I dati offline sono di questo account: viaggi, post, saldi e
        // biglietti non devono restare leggibili al prossimo utente che
        // entra sullo stesso dispositivo. Stessa cosa per la coda: le
        // operazioni in sospeso verrebbero altrimenti inviate a nome suo.
        clearAllCache(),
        clearQueue(),
        clearDropped(),
      ]);
    } catch (error) {
      console.warn("Impossibile ripulire completamente la sessione salvata:", error);
    }
    clearAuthCredentials();
    setUser(null);
    setStatus("signedOut");
  }, [user?._id]);

  const refreshSession = useCallback(async () => {
    if (!user?._id) return null;
    const fresh = await fetchUserById(user._id);
    if (!fresh) return null;
    setUser(fresh);
    syncCredentials(fresh);
    try {
      await persistUser(fresh);
    } catch (error) {
      // Come in login(): un problema di solo storage non deve invalidare
      // la sessione in memoria, che è già aggiornata.
      console.warn("Impossibile salvare la sessione aggiornata:", error);
    }
    return fresh;
  }, [user?._id]);

  // Come ottenere credenziali REST nuove quando il server risponde 401 a un
  // token scaduto (vedi shared/data/authToken.ts): stessa idea del
  // renewAuth passato al socket in RealtimeProvider, qui per axios. In un
  // ref perché l'interceptor è registrato una volta sola e deve comunque
  // vedere sempre la refreshSession più recente.
  const refreshRef = useRef(refreshSession);
  refreshRef.current = refreshSession;

  useEffect(() => {
    setAuthRefresher(async () => {
      const fresh = await refreshRef.current();
      const token = (fresh as { socketToken?: string } | null)?.socketToken;
      if (!fresh?._id || !token) return null;
      return { userId: fresh._id, token };
    });
    return () => setAuthRefresher(null);
  }, []);

  const value = useMemo(
    () => ({ status, user, login, logout, refreshSession }),
    [status, user, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve essere usato dentro <AuthProvider>");
  return ctx;
}
