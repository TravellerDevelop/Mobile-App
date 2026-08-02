import axios from "axios";
import { serverLink } from "../../global/globalVariable";
import { FlightLookupResult } from "./types";

/** "2026-08-13" a partire dai componenti locali (evita lo shift di fuso di toISOString). */
function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Arricchisce i dati letti dal barcode del boarding pass passando dal server
 * (che tiene la chiave AeroDataBox, mai esposta al client — vedi
 * Server/func/flights.ts). Non lancia mai: in caso di volo non trovato o di
 * errore di rete/quota, risolve a `null` e il chiamante prosegue con i soli
 * dati del barcode invece di bloccare la creazione del biglietto.
 */
export async function lookupFlight(
  carrier: string,
  flightNumber: string,
  date: Date | null
): Promise<FlightLookupResult | null> {
  try {
    const { data } = await axios.get<FlightLookupResult | null>(
      serverLink + "api/tickets/lookupFlight",
      {
        params: {
          carrier,
          flightNumber,
          date: date ? toDateParam(date) : undefined,
        },
        timeout: 10000,
      }
    );
    return data || null;
  } catch (error) {
    console.log(error);
    return null;
  }
}
