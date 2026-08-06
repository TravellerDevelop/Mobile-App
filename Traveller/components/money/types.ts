/**
 * Tipi della schermata Money — specchio di Server/types/money.ts.
 *
 * Sul filo HTTP/JSON ObjectId e Date arrivano come stringhe, quindi qui
 * sono tipizzati `string` (stessa convenzione di shared/types/api.ts).
 *
 * Promemoria sul modello dati dei pagamenti: `amount` è la QUOTA PRO
 * CAPITE, non il totale, e `destinator` contiene gli altri partecipanti
 * (non il creatore, che ha anticipato). Vedi il commento esteso in
 * Server/types/money.ts.
 */

/** Verso di un movimento rispetto a chi guarda la schermata. */
export type MoneyDirection = "in" | "out" | "personal";

export interface MoneyTotals {
  last12Months: number;
  last30Days: number;
  toPay: number;
  toReceive: number;
  /** toReceive - toPay: positivo se sono in credito. */
  net: number;
  personal: number;
  movementsCount: number;
}

export interface MoneyMonthPoint {
  /** "YYYY-MM" */
  month: string;
  /** "gen", "feb", … */
  label: string;
  total: number;
}

export interface MoneyTravelRow {
  travelId: string;
  name: string;
  total: number;
  pending: number;
  count: number;
  closed: boolean;
}

export interface MoneyBalance {
  userid: string;
  name: string;
  surname: string;
  username: string;
  theyOweMe: number;
  iOweThem: number;
  net: number;
  openCount: number;
}

export interface MoneyMovementCreator {
  _id: string;
  name: string;
  surname: string;
  username: string;
}

export interface MoneyMovement {
  _id: string;
  travelId: string;
  travelName: string;
  description: string;
  /** ISO string */
  dateTime: string;
  paymentType: "normal" | "personal";
  direction: MoneyDirection;
  amount: number;
  myShare: number;
  pending: number;
  settled: boolean;
  peopleCount: number;
  paidCount: number;
  creator: MoneyMovementCreator;
  /** Nome file (o URL S3) dello scontrino allegato, se presente. */
  receipt?: string;
}

export interface MoneyOverview {
  totals: MoneyTotals;
  byMonth: MoneyMonthPoint[];
  byTravel: MoneyTravelRow[];
  balances: MoneyBalance[];
  movements: MoneyMovement[];
}

export interface SettleUpResponse {
  settledCount: number;
  settledAmount: number;
}

/** Tab della schermata. */
export type MoneyTab = "overview" | "balances" | "movements";

/** Filtro di stato applicato alla lista movimenti. */
export type MovementFilter = "all" | "out" | "in" | "open";
