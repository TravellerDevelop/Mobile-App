/* ============================================================
   Traveller — Validazioni condivise da login e registrazione
   ============================================================ */

// Controllo pragmatico (non RFC-completo): sufficiente a intercettare i
// refusi più comuni senza rifiutare indirizzi validi ma insoliti.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH;
}

/**
 * Il mockup di registrazione ha un solo campo "Nome completo", ma il
 * backend (api/user/register) richiede "name" e "surname" separati.
 * Richiediamo quindi almeno due parole e usiamo l'ultima come cognome,
 * il resto come nome (gestisce anche i nomi composti, es. "Maria Chiara Rossi").
 */
export function splitFullName(fullName: string): { name: string; surname: string } | null {
  const parts = fullName.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (parts.length < 2) return null;

  return {
    name: parts.slice(0, -1).join(" "),
    surname: parts[parts.length - 1],
  };
}

/**
 * Il mockup di registrazione non ha un campo "username" (a differenza dello
 * schema utente, che lo richiede ed è usato ovunque nell'app come handle
 * pubblico: "@marco.rossi"). Deriviamo quindi uno username di partenza dalla
 * parte locale dell'email; se risulta già in uso, chi chiama la funzione di
 * registrazione prova ad aggiungere un suffisso (vedi api.ts).
 */
export function deriveUsernameFromEmail(email: string): string {
  const localPart = email.trim().split("@")[0] ?? "";
  const normalized = localPart
    .toLowerCase()
    .normalize("NFD")
    // ̀-ͯ sono i segni diacritici combinanti isolati da NFD
    // (es. "à" -> "a" + accento): li rimuoviamo per ottenere uno username ASCII pulito.
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9._-]/g, "");

  return normalized || "utente";
}
