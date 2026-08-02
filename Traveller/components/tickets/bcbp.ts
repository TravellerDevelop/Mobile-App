/**
 * Parser per il barcode IATA BCBP ("Bar Coded Boarding Pass", Risoluzione IATA 792,
 * formato a lunghezza fissa che inizia con "M"). È lo standard usato da tutte le
 * compagnie aeree per i QR/barcode dei boarding pass, quindi funziona con
 * qualunque vettore — a differenza del parsing precedente (split/substring "a mano"
 * in ticketsHeaders.tsx) che copriva solo un sottoinsieme dei casi ed era limitato
 * a 4 compagnie hardcoded (FR/VY/KL/AZ).
 *
 * Gestiamo solo il primo leg codificato: sufficiente perché l'app crea un
 * biglietto per singolo volo. Il blocco condizionale a lunghezza variabile
 * (bagaglio, frequent flyer, dati di sicurezza…) non viene interpretato: senza
 * un campione reale su cui validare byte-per-byte gli offset, è più sicuro
 * ignorarlo che rischiare di mostrare dati sbagliati con aria di certezza.
 *
 * Offset dei campi obbligatori validati contro l'esempio ufficiale IATA/Scandit:
 * "M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 226F001A0025 1"
 */

export interface BcbpLeg {
  pnr: string;
  fromIata: string;
  toIata: string;
  /** Designatore del vettore operante, es. "FR", "AZ", "AC" (2 o 3 lettere, senza padding). */
  carrier: string;
  /** Numero di volo senza zeri iniziali, es. "834". */
  flightNumber: string;
  /** Giorno giuliano (1-366) così come codificato nel barcode: nessun anno incluso. */
  julianDay: number;
  /** Codice di compartimento/classe (F/J/C/Y/…, risoluzione IATA 728). */
  compartmentCode: string;
  /** Numero di posto (es. "001A"), oppure "GATE"/"STBY" se non ancora assegnato. */
  seat: string;
  checkInSequence: string;
  passengerStatus: string;
}

export interface BcbpBoardingPass {
  raw: string;
  formatCode: string;
  legsCount: number;
  firstName: string;
  lastName: string;
  electronicTicket: boolean;
  pnr: string;
  leg: BcbpLeg;
}

/**
 * Controllo leggero, senza eccezioni, usato dal loop di scansione per
 * distinguere un frame di camera valido da uno corrotto/parziale prima di
 * bloccare la UI su di esso (vedi ticketsHeaders.tsx). Aztec e PDF417 sono
 * più delicati da leggere del QR quando si fotografa lo schermo di un altro
 * telefono (moiré, riflessi): capita che un singolo frame decodifichi solo
 * una parte del payload — es. i primi 2 caratteri "M1" persi — pur restituendo
 * "successo" alla libreria di scansione. La correzione è ritentare sul frame
 * successivo, non mostrare subito un errore.
 */
export function looksLikeBcbp(raw: unknown): raw is string {
  return typeof raw === "string" && raw.length >= 58 && raw[0] === "M";
}

export class BcbpParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BcbpParseError";
  }
}

function field(s: string, start: number, len: number): string {
  return s.substring(start, start + len).trim();
}

/** Etichette leggibili per i codici di compartimento più comuni (risoluzione IATA 728). */
export const COMPARTMENT_LABELS: Record<string, string> = {
  F: "Prima classe",
  A: "Prima classe",
  P: "Prima classe premium",
  J: "Business",
  C: "Business",
  D: "Business",
  I: "Business",
  Z: "Business",
  W: "Economy premium",
  Y: "Economy",
  B: "Economy",
  H: "Economy",
  K: "Economy",
  L: "Economy",
  M: "Economy",
  N: "Economy",
  Q: "Economy",
  S: "Economy",
  T: "Economy",
  U: "Economy",
  V: "Economy",
  X: "Economy",
  G: "Economy",
  E: "Economy",
};

export function compartmentLabel(code?: string): string | null {
  if (!code) return null;
  return COMPARTMENT_LABELS[code.toUpperCase()] || null;
}

/**
 * Analizza il contenuto grezzo di un QR/barcode di boarding pass IATA-BCBP.
 * Lancia BcbpParseError se la stringa non è nel formato atteso (es. QR di
 * tutt'altro tipo, o un boarding pass troppo corto/troncato).
 */
export function parseBcbp(raw: string): BcbpBoardingPass {
  if (!raw || raw[0] !== "M") {
    throw new BcbpParseError("Il codice scansionato non è una carta d'imbarco IATA riconoscibile");
  }
  if (raw.length < 58) {
    throw new BcbpParseError("Codice della carta d'imbarco incompleto");
  }

  const formatCode = raw[0];
  const legsCount = parseInt(raw[1], 10) || 1;

  const nameField = field(raw, 2, 20);
  const [lastNameRaw, firstNameRaw] = nameField.split("/");

  const electronicTicket = raw[22] === "E";

  let offset = 23;
  const pnr = field(raw, offset, 7); offset += 7;
  const fromIata = field(raw, offset, 3); offset += 3;
  const toIata = field(raw, offset, 3); offset += 3;
  const carrierRaw = field(raw, offset, 3); offset += 3;
  const flightNumberRaw = field(raw, offset, 5); offset += 5;
  const julianDayRaw = field(raw, offset, 3); offset += 3;
  const compartmentCode = field(raw, offset, 1); offset += 1;
  const seat = field(raw, offset, 4); offset += 4;
  const checkInSequence = field(raw, offset, 5); offset += 5;
  const passengerStatus = field(raw, offset, 1); offset += 1;

  if (fromIata.length !== 3 || toIata.length !== 3 || !carrierRaw) {
    throw new BcbpParseError("Impossibile leggere tratta o vettore dalla carta d'imbarco");
  }

  const julianDay = parseInt(julianDayRaw, 10) || 0;
  const flightNumber = flightNumberRaw.replace(/^0+(?=\d)/, "");

  const leg: BcbpLeg = {
    pnr,
    fromIata,
    toIata,
    carrier: carrierRaw,
    flightNumber,
    julianDay,
    compartmentCode,
    seat,
    checkInSequence,
    passengerStatus,
  };

  return {
    raw,
    formatCode,
    legsCount,
    firstName: (firstNameRaw || "").trim(),
    lastName: (lastNameRaw || "").trim(),
    electronicTicket,
    pnr,
    leg,
  };
}

/**
 * Il barcode codifica solo il giorno dell'anno (1-366), mai l'anno. Come da
 * prassi IATA per i reader senza data di emissione a disposizione, assumiamo
 * l'occorrenza più vicina nel tempo: se il giorno è già passato di più di
 * qualche giorno nell'anno corrente, il volo è quasi certamente l'anno prossimo
 * (tipico attorno a Capodanno: si scansiona a dicembre un imbarco di gennaio).
 */
export function resolveFlightDate(julianDay: number, referenceDate: Date = new Date()): Date | null {
  if (!julianDay || julianDay < 1 || julianDay > 366) return null;

  const GRACE_DAYS = 2;
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  let candidate = new Date(referenceDate.getFullYear(), 0, julianDay);
  if (candidate.getTime() < today.getTime() - GRACE_DAYS * 86400000) {
    candidate = new Date(referenceDate.getFullYear() + 1, 0, julianDay);
  }

  return candidate;
}
