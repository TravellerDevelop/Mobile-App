/** Mirror di Server/types/flight.ts (nessun pacchetto condiviso tra i due repo,
 *  stessa convenzione già usata per components/itinerary/types.ts). */

export interface FlightAirlineInfo {
  name: string;
  iata?: string;
  icao?: string;
}

export interface FlightAircraftInfo {
  model?: string;
  registration?: string;
}

export interface FlightAirportInfo {
  iata?: string;
  icao?: string;
  name?: string;
  municipality?: string;
  country?: string;
  timeZone?: string;
  terminal?: string;
  gate?: string;
  checkInDesk?: string;
  baggageBelt?: string;
  scheduledTimeLocal?: string;
}

export interface FlightLookupResult {
  flightNumber: string;
  airline: FlightAirlineInfo;
  aircraft?: FlightAircraftInfo;
  departure: FlightAirportInfo;
  arrival: FlightAirportInfo;
  status?: string;
  codeshareStatus?: string;
}
