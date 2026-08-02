/* Test del parser IATA-BCBP: usiamo l'esempio ufficiale della specifica
   (ripreso identico dalla documentazione Scandit, che lo cita a sua volta
   dalla Risoluzione IATA 792) per validare gli offset dei campi obbligatori
   byte per byte, più qualche caso limite (formato non riconosciuto, cambio
   anno sul giorno giuliano). */

import { BcbpParseError, compartmentLabel, looksLikeBcbp, parseBcbp, resolveFlightDate } from "./bcbp";

const IATA_SAMPLE = "M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 226F001A0025 1";

describe("parseBcbp", () => {
  test("legge correttamente l'esempio ufficiale IATA", () => {
    const pass = parseBcbp(IATA_SAMPLE);

    expect(pass.formatCode).toBe("M");
    expect(pass.legsCount).toBe(1);
    expect(pass.firstName).toBe("LUC");
    expect(pass.lastName).toBe("DESMARAIS");
    expect(pass.electronicTicket).toBe(true);
    expect(pass.pnr).toBe("ABC123");

    expect(pass.leg.fromIata).toBe("YUL");
    expect(pass.leg.toIata).toBe("FRA");
    expect(pass.leg.carrier).toBe("AC");
    expect(pass.leg.flightNumber).toBe("834");
    expect(pass.leg.julianDay).toBe(226); // 13 agosto
    expect(pass.leg.compartmentCode).toBe("F");
    expect(pass.leg.seat).toBe("001A");
    expect(pass.leg.checkInSequence).toBe("0025");
    expect(pass.leg.passengerStatus).toBe("1");
  });

  test("non impone la whitelist di compagnie del vecchio parser", () => {
    // Prima la scansione funzionava solo per FR/VY/KL/AZ: qualunque altro
    // vettore veniva rifiutato con "Linea aerea non supportata". Il nuovo
    // parser legge il codice IATA/ICAO direttamente dal barcode, quindi
    // qualsiasi compagnia standard-compliant funziona.
    const raw = "M1DESMARAIS/LUC       EABC123 YULFRAEK 0834 226F001A0025 1";
    const pass = parseBcbp(raw);
    expect(pass.leg.carrier).toBe("EK");
  });

  test("legge un boarding pass Ryanair reale (Aztec Code, non QR)", () => {
    // Struttura identica a un boarding pass Ryanair scansionato dall'app
    // (nome/PNR anonimizzati per non tenere dati personali nel repo). Il
    // punto rilevante è il formato del barcode: Ryanair lo emette come Aztec
    // Code, non QR — per questo barcodeScannerSettings in ticketsHeaders.tsx
    // ora richiede anche 'aztec' oltre a 'qr', altrimenti la fotocamera non
    // rileva proprio il codice. Il testo decodificato è identico a
    // prescindere dal formato del barcode, quindi il parser non cambia.
    const raw = "M1ROSSI/MARIA          K86LPR MXPBCNFR 0270 222Y015E0019 3";
    const pass = parseBcbp(raw);

    expect(pass.leg.fromIata).toBe("MXP");
    expect(pass.leg.toIata).toBe("BCN");
    expect(pass.leg.carrier).toBe("FR");
    expect(pass.leg.flightNumber).toBe("270");
    expect(pass.leg.julianDay).toBe(222);
    expect(pass.leg.compartmentCode).toBe("Y");
    expect(pass.leg.seat).toBe("015E");
    expect(pass.leg.checkInSequence).toBe("0019");
  });

  test("lancia BcbpParseError su un codice non-boarding-pass", () => {
    expect(() => parseBcbp("http://example.com/qualcosa")).toThrow(BcbpParseError);
  });

  test("lancia BcbpParseError su un barcode troncato", () => {
    expect(() => parseBcbp("M1DESMARAIS/LUC")).toThrow(BcbpParseError);
  });
});

describe("resolveFlightDate", () => {
  test("usa l'anno corrente quando il giorno giuliano è nel futuro prossimo", () => {
    const reference = new Date(2026, 0, 10); // 10 gennaio 2026
    const date = resolveFlightDate(20, reference); // giorno 20 = 20 gennaio
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(0);
    expect(date?.getDate()).toBe(20);
  });

  test("passa all'anno successivo se il giorno è già passato da tempo", () => {
    const reference = new Date(2026, 11, 20); // 20 dicembre 2026
    const date = resolveFlightDate(10, reference); // giorno 10 = già passato a marzo
    expect(date?.getFullYear()).toBe(2027);
    expect(date?.getMonth()).toBe(0);
    expect(date?.getDate()).toBe(10);
  });

  test("resta nell'anno corrente entro i giorni di tolleranza", () => {
    const reference = new Date(2026, 5, 5); // 5 giugno 2026, giorno giuliano 156
    const date = resolveFlightDate(155, reference); // ieri: dentro la tolleranza di 2 giorni
    expect(date?.getFullYear()).toBe(2026);
  });

  test("ritorna null per input non validi", () => {
    expect(resolveFlightDate(0)).toBeNull();
    expect(resolveFlightDate(400)).toBeNull();
  });
});

describe("looksLikeBcbp", () => {
  // Usato dal loop di scansione (ticketsHeaders.tsx) per scartare in silenzio
  // un frame di camera corrotto/parziale invece di bloccare subito la UI su
  // un errore — vedi il commento su MAX_SILENT_SCAN_RETRIES lì.
  test("accetta l'esempio ufficiale IATA", () => {
    expect(looksLikeBcbp(IATA_SAMPLE)).toBe(true);
  });

  test("rifiuta un frame corrotto a cui manca il prefisso M1", () => {
    // Caso reale osservato: un boarding pass Ryanair (Aztec Code) valido,
    // letto male su un singolo frame, restituiva solo il campo nome senza
    // il prefisso "M1" — parseBcbp lo avrebbe rifiutato definitivamente,
    // invece va scartato in silenzio e ritentato sul frame successivo.
    expect(looksLikeBcbp("BOSSOLASCO/PIETRO")).toBe(false);
  });

  test("rifiuta input non stringa o vuoti", () => {
    expect(looksLikeBcbp(undefined)).toBe(false);
    expect(looksLikeBcbp("")).toBe(false);
    expect(looksLikeBcbp(12345)).toBe(false);
  });
});

describe("compartmentLabel", () => {
  test("mappa i codici comuni", () => {
    expect(compartmentLabel("F")).toBe("Prima classe");
    expect(compartmentLabel("Y")).toBe("Economy");
    expect(compartmentLabel("J")).toBe("Business");
  });

  test("ritorna null per codici sconosciuti o assenti", () => {
    expect(compartmentLabel("")).toBeNull();
    expect(compartmentLabel(undefined)).toBeNull();
  });
});
