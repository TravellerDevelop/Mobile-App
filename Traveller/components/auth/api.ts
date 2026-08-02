import axios from "axios";
import * as Crypto from "expo-crypto";
import { serverLink } from "../../global/globalVariable";
import type { ApiUser } from "../../shared/types/api";
import type { AuthUser } from "./types";
import { deriveUsernameFromEmail } from "./validation";

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
 * NOTA SICUREZZA: il backend attuale confronta un digest SHA-256 della
 * password invece della password in chiaro. Questo digest, non salato e
 * sempre uguale per la stessa password, va trattato a tutti gli effetti
 * come "la password" (chi lo intercetta o lo trova su disco può accedere
 * all'account): non protegge da nulla che HTTPS non protegga già, e NON
 * sostituisce un hashing salato lato server (bcrypt/argon2), che resta la
 * cosa giusta da implementare sul backend. Lo manteniamo qui solo per
 * compatibilità con l'API esistente; il client non lo salva mai da nessuna
 * parte (né in AsyncStorage né in SecureStore) una volta inviata la richiesta.
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
    });
    if (!response.data?.[0]) return null;
    return sanitizeUser(response.data[0]);
  } catch {
    return null;
  }
}
