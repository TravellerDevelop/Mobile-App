import type { DayConflict, ItineraryDay, Stop, TransferInfo } from "./types";

/* ============================================================
   Calcoli sulla giornata: orari, spostamenti e fattibilità.
   Tutto client-side: sono stime, non instradamenti reali.
   ============================================================ */

/** Velocità medie usate per stimare i trasferimenti (km/h). */
const WALK_SPEED = 4.5;
const DRIVE_SPEED = 28; // urbano, semafori inclusi
/** Oltre questa distanza si assume che il gruppo non vada a piedi. */
const WALK_MAX_KM = 1.8;

export function minutesFromTime(time?: string | null): number | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function timeFromMinutes(total: number): string {
  const normalized = ((Math.round(total) % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
  const minutes = String(normalized % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** "1h 30" / "45 min" / "in giornata" quando la durata non è indicata. */
export function formatDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "in giornata";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${String(rest).padStart(2, "0")}`;
}

/** Orario mostrato a sinistra della tappa; le tappe senza orario mostrano "—". */
export function formatStopTime(stop: Stop): string {
  return stop.startTime || "—";
}

/** Intervallo "10:30–12:00"; senza durata resta il solo orario di inizio. */
export function formatStopRange(stop: Stop): string | null {
  if (!stop.startTime) return null;
  const start = minutesFromTime(stop.startTime);
  if (start === null) return null;
  if (!stop.duration) return stop.startTime;
  return `${stop.startTime}–${timeFromMinutes(start + stop.duration)}`;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

/** Distanza in linea d'aria tra due punti, in km. */
export function haversineKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const R = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Stima del trasferimento tra due tappe consecutive.
 * Il fattore 1.35 approssima il percorso reale rispetto alla linea d'aria;
 * senza coordinate su entrambe le tappe non si stima nulla.
 */
export function estimateTransfer(from: Stop, to: Stop): TransferInfo | null {
  const a = from.place;
  const b = to.place;
  if (!a?.lat || !a?.lon || !b?.lat || !b?.lon) return null;

  const km = haversineKm(a.lat, a.lon, b.lat, b.lon) * 1.35;
  if (km < 0.05) return null;

  const walking = km <= WALK_MAX_KM;
  const speed = walking ? WALK_SPEED : DRIVE_SPEED;
  const minutes = Math.max(5, Math.round((km / speed) * 60));

  return {
    minutes,
    mode: walking ? "walk" : "drive",
    label: walking
      ? `${minutes} min a piedi fino alla prossima tappa`
      : `${minutes} min in auto fino alla prossima tappa`,
  };
}

/** Tappe di un giorno, ordinate come vanno mostrate (prima gli orari, poi le tappe "in giornata"). */
export function stopsOfDay(stops: Stop[], day: number): Stop[] {
  return stops
    .filter((stop) => stop.day === day)
    .sort((a, b) => {
      const aTime = minutesFromTime(a.startTime);
      const bTime = minutesFromTime(b.startTime);
      if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;
      if (aTime !== null && bTime === null) return -1;
      if (aTime === null && bTime !== null) return 1;
      return (a.order || 0) - (b.order || 0);
    });
}

/**
 * Avvisi di fattibilità di un giorno:
 * - due tappe con orari che si sovrappongono
 * - tempo di trasferimento maggiore del buco tra una tappa e la successiva
 * Le tappe saltate non generano avvisi.
 */
export function dayConflicts(daysStops: Stop[]): DayConflict[] {
  const conflicts: DayConflict[] = [];
  const timed = daysStops.filter(
    (stop) => stop.startTime && stop.status !== "skipped"
  );

  for (let i = 0; i < timed.length - 1; i++) {
    const current = timed[i];
    const next = timed[i + 1];

    const start = minutesFromTime(current.startTime);
    const nextStart = minutesFromTime(next.startTime);
    if (start === null || nextStart === null) continue;

    const end = start + (current.duration || 0);
    const gap = nextStart - end;

    if (gap < 0) {
      conflicts.push({
        stopId: next._id,
        message: `"${current.title}" finisce alle ${timeFromMinutes(end)}, dopo l'inizio di "${next.title}".`,
      });
      continue;
    }

    const transfer = estimateTransfer(current, next);
    if (transfer && transfer.minutes > gap) {
      conflicts.push({
        stopId: next._id,
        message: `Servono almeno ${transfer.minutes} min per spostarsi a ${next.title}: il buco tra le tappe è di ${gap} min.`,
      });
    }
  }

  return conflicts;
}

/**
 * Prossima tappa della giornata rispetto a un orario.
 * Si scartano le tappe già chiuse (fatte o saltate) e quelle finite;
 * a parità di condizioni vince l'ordine della giornata, così anche una
 * giornata senza orari ha una "prossima tappa" sensata.
 */
export function nextStop(stops: Stop[], now: Date = new Date()): Stop | null {
  const open = stops.filter((stop) => stop.status !== "done" && stop.status !== "skipped");
  if (open.length === 0) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const upcoming = open.find((stop) => {
    const start = minutesFromTime(stop.startTime);
    if (start === null) return true;
    return start + (stop.duration || 0) >= nowMinutes;
  });

  return upcoming ?? open[open.length - 1];
}

/**
 * Minuti che mancano all'inizio di una tappa.
 * Negativi se è già iniziata, null se la tappa non ha orario.
 */
export function minutesUntil(stop: Stop, now: Date = new Date()): number | null {
  const start = minutesFromTime(stop.startTime);
  if (start === null) return null;
  return start - (now.getHours() * 60 + now.getMinutes());
}

/** "tra 25 min" / "tra 1h 10" / "iniziata 5 min fa" / "in giornata". */
export function formatCountdown(minutes: number | null): string {
  if (minutes === null) return "in giornata";
  if (minutes < 0) {
    const late = Math.abs(minutes);
    return late < 60 ? `iniziata ${late} min fa` : `iniziata ${formatDuration(late)} fa`;
  }
  if (minutes === 0) return "adesso";
  return `tra ${minutes < 60 ? `${minutes} min` : formatDuration(minutes)}`;
}

const WEEKDAYS = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

/** "mer 21 gen" a partire da "YYYY-MM-DD"; null se il viaggio non ha date. */
export function formatDayDate(date?: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (isNaN(parsed.getTime())) return null;
  return `${WEEKDAYS[parsed.getDay()]} ${parsed.getDate()} ${MONTHS[parsed.getMonth()]}`;
}

/** "18–25 gen" per il sottotitolo dell'header. */
export function formatDateRange(start?: string | null, end?: string | null): string | null {
  if (!start || !end) return null;
  const from = new Date(start);
  const to = new Date(end);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;

  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
  if (sameMonth) return `${from.getDate()}–${to.getDate()} ${MONTHS[to.getMonth()]}`;
  return `${from.getDate()} ${MONTHS[from.getMonth()]} – ${to.getDate()} ${MONTHS[to.getMonth()]}`;
}

/** Indice del giorno di oggi nella timeline; null se il viaggio non è in corso. */
export function todayIndex(days: ItineraryDay[]): number | null {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const match = days.find((day) => day.date === iso);
  return match ? match.index : null;
}

/** Totale dei costi previsti di un elenco di tappe (le saltate non contano). */
export function plannedCostOf(stops: Stop[]): number {
  return stops
    .filter((stop) => stop.status !== "skipped")
    .reduce((sum, stop) => sum + (stop.cost || 0), 0);
}

/** "€ 32,00" con la virgola decimale italiana. */
export function formatCurrency(value?: number | null): string {
  const amount = Number(value || 0);
  return `€ ${amount.toFixed(2).replace(".", ",")}`;
}
