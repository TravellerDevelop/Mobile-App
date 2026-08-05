import axios from "axios";
import * as Crypto from "expo-crypto";
import { serverLink } from "../../global/globalVariable";
import type { ApiUser } from "../../shared/types/api";
import type { AuthUser } from "./types";
import { deriveUsernameFromEmail } from "./validation";
import { isNetworkError, markOffline, markOnline } from "../../shared/data/netStatus";

/**
 * Errore applicativo dell'autenticazione: il messaggio è già pensato per
 * essere mostrato all'utente (in italiano, senza dettagli tecnici), così i
 * componenti UI non devono mai propagare `error.message` di axios o del
 * server direttamente a schermo.
 */
export class AuthApiError extends Error {}

const GENERIC_ERROR = "Si è verificato un problema. Riprova tra qualche istante.";
const NETWORK_ERROR = "Impossibile contattare il server. Controlla la connessione e riprova.";

/**
 * Rimuove il campo "password" (che il server include nelle risposte utente)
 * prima che il dato tocchi qualunque stato React o storage locale: la
 * password (anche solo il suo digest) non deve mai sopravvivere oltre la
 * singola richiesta di login/registrazione.
 */
export function sanitizeUser(user: ApiUser): AuthUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

/**
 * Il client manda un digest SHA-256 della password, non la password in
 * chiaro — ma va comunque trattato come "la password": non salato e sempre
 * uguale per la stessa password, non protegge da nulla che HTTPS non
 * protegga già da solo in transito. La protezione vera è lato server:
 * Server/func/passwordHash.ts hasha questo digest con bcrypt (salt per
 * utente, costo intenzionalmente alto) prima di salvarlo, quindi un dump
 * del database non basta più a riusare le credenziali direttamente. Il
 * client non lo salva mai da nessuna parte (né in AsyncStorage né in
 * SecureStore) una volta inviata la richiesta.
 */
async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

function isAxiosNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

/* ---- Login --------------------------------------------------- */

export async function loginRequest(identifier: string, password: string): Promise<AuthUser> {
  const digest = await hashPassword(password);

  try {
    const response = await axios.post<ApiUser[] | string>(`${serverLink}api/user/login`, {
      username: identifier,
      password: digest,
    });

    if (response.status === 200 && Array.isArray(response.data) && response.data[0]) {
      return sanitizeUser(response.data[0]);
    }

    // Messaggio generico: evitiamo di confermare/negare esplicitamente se è
    // l'identificativo o la password a essere sbagliati (previene l'enumerazione
    // di account esistenti tramite i messaggi di errore del login).
    throw new AuthApiError("Email/username o password non corretti.");
  } catch (error) {
    if (error instanceof AuthApiError) throw error;
    if (isAxiosNetworkError(error)) throw new AuthApiError(NETWORK_ERROR);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new AuthApiError("Email/username o password non corretti.");
    }
    throw new AuthApiError(GENERIC_ERROR);
  }
}

/* ---- Registrazione -------------------------------------------- */

interface RegisterInput {
  name: string;
  surname: string;
  email: string;
  password: string;
}

const MAX_USERNAME_ATTEMPTS = 4;

async function registerOnce(
  name: string,
  surname: string,
  username: string,
  email: string,
  digest: string
): Promise<"ok" | "taken"> {
  const response = await axios.post(`${serverLink}api/user/register`, {
    name,
    surname,
    username,
    email,
    password: digest,
  });

  if (response.status === 200) return "ok";
  if (response.status === 202) return "taken";
  throw new AuthApiError(GENERIC_ERROR);
}

export async function registerRequest({
  name,
  surname,
  email,
  password,
}: RegisterInput): Promise<AuthUser> {
  const digest = await hashPassword(password);
  const baseUsername = deriveUsernameFromEmail(email);

  try {
    let username = baseUsername;
    let outcome: "ok" | "taken" = "taken";

    // Il mockup non ha un campo "username": ne generiamo uno dall'email e,
    // se risulta già occupato (status 202), riproviamo con un suffisso
    // numerico casuale, senza obbligare l'utente a sceglierne uno a mano.
    for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
      username = attempt === 0 ? baseUsername : `${baseUsername}${Math.floor(100 + Math.random() * 900)}`;
      outcome = await registerOnce(name, surname, username, email, digest);
      if (outcome === "ok") break;
    }

    if (outcome !== "ok") {
      throw new AuthApiError("Non è stato possibile completare la registrazione. Riprova.");
    }

    const info = await axios.get<ApiUser[]>(`${serverLink}api/user/info`, {
      params: { username },
    });

    if (!info.data?.[0]) {
      throw new AuthApiError(GENERIC_ERROR);
    }

    return sanitizeUser(info.data[0]);
  } catch (error) {
    if (error instanceof AuthApiError) throw error;
    if (isAxiosNetworkError(error)) throw new AuthApiError(NETWORK_ERROR);
    if (axios.isAxiosError(error) && error.response?.status === 202) {
      throw new AuthApiError("Questa email è già registrata. Prova ad accedere.");
    }
    throw new AuthApiError(GENERIC_ERROR);
  }
}

/* ---- Aggiornamento dati utente ---------------------------------
   Usato all'avvio app per rinfrescare il profilo di una sessione già
   valida (stesso endpoint già usato altrove nell'app). */
export async function fetchUserById(id: string): Promise<AuthUser | null> {
  try {
    const response = await axios.get<ApiUser[]>(`${serverLink}api/user/takeUserById`, {
      params: { id },
      // Questa chiamata è essa stessa il meccanismo di rinnovo del token
      // (vedi authContext.tsx:refreshSession e authToken.ts). Se prendesse
      // 401 e l'interceptor globale provasse a "rinnovare e ritentare" come
      // fa per le altre richieste, chiamerebbe di nuovo fetchUserById da capo:
      // un loop. Il flag dice all'interceptor di non provarci qui.
      __isAuthBootstrap: true,
    } as any);
    markOnline();
    if (!response.data?.[0]) return null;
    return sanitizeUser(response.data[0]);
  } catch (error) {
    // Offline il profilo non si può rinfrescare: chi chiama continua con
    // la copia locale (AsyncStorage["user"]). Segnaliamo però lo stato di
    // rete, perché questa è spesso la prima richiesta dell'app.
    if (isNetworkError(error)) markOffline();
    return null;
  }
}
