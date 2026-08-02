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
