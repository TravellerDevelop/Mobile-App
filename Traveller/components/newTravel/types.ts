/* ============================================================
   Tipi del flusso "Nuovo viaggio" (creazione e adesione)
   ============================================================ */

export type NewTravelTab = "create" | "join";

export interface Friend {
  _id: string;
  username: string;
  name: string;
  surname: string;
}

export interface TravelParticipantPayload {
  userid: string;
  username: string;
  creator: boolean;
}

export interface CreateTravelPayload {
  name: string;
  description: string;
  budget: number | "";
  participants: TravelParticipantPayload[];
  /** "1" pubblico · "3" privato */
  visibility: "1" | "3";
  creation_date: Date;
  /** "1" tutti · "0" chiuso */
  new_members_allowed: "1" | "0";
  code: string;
  closed: boolean;
  image?: string;
  /* Persistiti dal backend: da startDate/endDate derivano i giorni dell'itinerario */
  destination: string;
  startDate: string;
  endDate: string;
}

export interface PickedCover {
  uri: string;
  base64?: string | null;
}

/* ============================================================
   Tipi del flusso "Modifica viaggio"
   ============================================================ */

/** Sottoinsieme di TravelDocument che la schermata di modifica legge/scrive. */
export interface EditableTravel {
  _id: string;
  name: string;
  description: string;
  budget: number | string | null;
  image?: string;
  destination?: string;
  /** ISO string, come restituito dal server via JSON. */
  startDate?: string | null;
  endDate?: string | null;
  /** "1" pubblico · "3" privato (vedi CreateTravelPayload); altri valori legacy trattati come pubblico. */
  visibility?: string | number;
}

export interface UpdateTravelPayload {
  id: string;
  /**
   * Chi sta salvando. Usato solo dal server per escluderlo dai destinatari
   * della notifica "viaggio modificato": senza, chi modifica riceve la push
   * della propria modifica.
   */
  userid?: string;
  param: {
    name: string;
    description: string;
    budget: number | string | null;
    destination: string;
    startDate: string | null;
    endDate: string | null;
    visibility: "1" | "3";
    image?: string;
  };
}
