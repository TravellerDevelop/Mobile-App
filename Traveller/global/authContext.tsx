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
  useState,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUserById } from "../components/auth/api";
import type { AuthUser } from "../components/auth/types";

const SESSION_KEY = "auth_session";
const LEGACY_USER_KEY = "user";

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
  const serialized = JSON.stringify(user);
  await Promise.all([
    secureSet(SESSION_KEY, serialized),
    AsyncStorage.setItem(LEGACY_USER_KEY, serialized),
  ]);
}

type AuthStatus = "checking" | "signedIn" | "signedOut";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Da chiamare dopo un login/una registrazione riusciti. */
  login: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
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

          // Rinfresca i dati in background: se il profilo è cambiato (o
          // l'account non esiste più) li allineiamo, ma un errore di rete
          // qui non deve buttare fuori l'utente da una sessione altrimenti
          // valida (stesso comportamento, best-effort, del vecchio App.tsx).
          const fresh = await fetchUserById(sessionUser._id);
          if (!cancelled && fresh) {
            setUser(fresh);
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
  }, []);

  const logout = useCallback(async () => {
    try {
      await Promise.all([
        secureDelete(SESSION_KEY),
        AsyncStorage.removeItem(LEGACY_USER_KEY),
        AsyncStorage.removeItem("username"),
      ]);
    } catch (error) {
      console.warn("Impossibile ripulire completamente la sessione salvata:", error);
    }
    setUser(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve essere usato dentro <AuthProvider>");
  return ctx;
}
