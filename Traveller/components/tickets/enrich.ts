import { ApiTicket } from "../../shared/types/api";
import { BcbpBoardingPass, compartmentLabel, parseBcbp, resolveFlightDate } from "./bcbp";
import { lookupFlight } from "./api";

export interface ScannedTicketDraft {
  /** Bozza di biglietto pronta per la POST a api/tickets/create (dopo eventuale editing di titolo/data da parte dell'utente). */
  ticket: Partial<ApiTicket>;
  pass: BcbpBoardingPass;
  flightDate: Date | null;
  /** true se l'arricchimento via api/tickets/lookupFlight non è andato a buon fine: la bozza resta comunque completa con i soli dati del barcode. */
  enrichmentFailed: boolean;
}

/**
 * Costruisce la bozza di biglietto a partire dal contenuto grezzo del QR
 * scansionato: legge tutti i campi disponibili dal barcode IATA-BCBP (posto,
 * classe, PNR, tratta, data volo…) — funziona con qualunque compagnia aerea,
 * non solo le 4 hardcoded del vecchio parser — e prova ad arricchirla via
 * api/tickets/lookupFlight (nome compagnia, aeromobile, terminal/gate/bagagli).
 *
 * Lancia BcbpParseError se il codice scansionato non è un boarding pass
 * IATA riconoscibile: il chiamante decide come segnalarlo (es. Alert).
 * L'arricchimento di rete invece non lancia mai: se fallisce, `enrichmentFailed`
 * è true ma la bozza resta utilizzabile con i soli dati del barcode.
 */
export async function buildTicketFromScan(qrType: string, qrData: string): Promise<ScannedTicketDraft> {
  const pass = parseBcbp(qrData);
  const flightDate = resolveFlightDate(pass.leg.julianDay);

  const ticket: Partial<ApiTicket> = {
    name: pass.firstName,
    surname: pass.lastName,
    from: { iata: pass.leg.fromIata, name: pass.leg.fromIata },
    to: { iata: pass.leg.toIata, name: pass.leg.toIata },
    company: { name: pass.leg.carrier, iata: pass.leg.carrier, icao: "" },
    flightNumber: pass.leg.flightNumber,
    aircraft: "",
    qrdata: qrData,
    // NOTA: qrtype è tipizzato number in ApiTicket ma il barcode scanner
    // restituisce una stringa (es. "qr"); refuso preesistente al di fuori
    // dello scopo di questa modifica, preservato per non alterare il
    // comportamento di codice a valle che legge questo campo.
    qrtype: qrType as unknown as number,
    seat: pass.leg.seat || undefined,
    compartmentCode: pass.leg.compartmentCode || undefined,
    classLabel: compartmentLabel(pass.leg.compartmentCode) || undefined,
    checkInSequence: pass.leg.checkInSequence || undefined,
    pnr: pass.leg.pnr || undefined,
    // ApiTicket.date è tipizzato string ma viene serializzato da axios/JSON
    // al momento della POST: assegniamo un Date reale come faceva il codice
    // precedente.
    date: (flightDate ?? new Date()) as unknown as string,
  };

  let enrichmentFailed = false;
  try {
    const flight = await lookupFlight(pass.leg.carrier, pass.leg.flightNumber, flightDate);
    if (flight) {
      if (flight.airline?.name) {
        ticket.company = {
          name: flight.airline.name,
          iata: flight.airline.iata || pass.leg.carrier,
          icao: flight.airline.icao || "",
        };
      }
      if (flight.departure?.name) {
        ticket.from = { iata: flight.departure.iata || pass.leg.fromIata, name: flight.departure.name };
      }
      if (flight.arrival?.name) {
        ticket.to = { iata: flight.arrival.iata || pass.leg.toIata, name: flight.arrival.name };
      }
      if (flight.aircraft?.model) ticket.aircraft = flight.aircraft.model;
      if (flight.aircraft?.registration) ticket.aircraftReg = flight.aircraft.registration;
      ticket.departureTerminal = flight.departure?.terminal;
      ticket.departureGate = flight.departure?.gate;
      ticket.departureCheckInDesk = flight.departure?.checkInDesk;
      ticket.departureTimeLocal = flight.departure?.scheduledTimeLocal;
      ticket.arrivalTerminal = flight.arrival?.terminal;
      ticket.arrivalGate = flight.arrival?.gate;
      ticket.arrivalBaggageBelt = flight.arrival?.baggageBelt;
      ticket.arrivalTimeLocal = flight.arrival?.scheduledTimeLocal;
      ticket.status = flight.status;
    } else {
      enrichmentFailed = true;
    }
  } catch {
    enrichmentFailed = true;
  }

  return { ticket, pass, flightDate, enrichmentFailed };
}

/** Suggerimento di titolo, usato per precompilare il campo (l'utente può comunque modificarlo). */
export function suggestTitle(draft: ScannedTicketDraft): string {
  const from = draft.ticket.from?.iata || draft.pass.leg.fromIata;
  const to = draft.ticket.to?.iata || draft.pass.leg.toIata;
  return `${from} → ${to}`;
}
