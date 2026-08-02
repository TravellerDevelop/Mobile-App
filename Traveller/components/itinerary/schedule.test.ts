/* Test della logica di giornata dell'itinerario: sono i calcoli che
   alimentano il banner di avviso e le note di trasferimento, quindi
   valgono la pena di essere verificati senza montare la UI. */

import {
  dayConflicts,
  estimateTransfer,
  formatCountdown,
  formatDateRange,
  formatDuration,
  formatStopRange,
  minutesFromTime,
  minutesUntil,
  nextStop,
  stopsOfDay,
  timeFromMinutes,
} from "./schedule";
import type { Stop } from "./types";

function makeStop(overrides: Partial<Stop> & { _id: string }): Stop {
  return {
    travel: "t1",
    creator: "u1",
    title: "Tappa",
    category: "visit",
    status: "confirmed",
    day: 0,
    startTime: null,
    duration: null,
    order: 1000,
    place: null,
    notes: "",
    cost: null,
    paymentPost: null,
    ticket: null,
    checklist: [],
    participants: [],
    votes: [],
    creation_date: "",
    update_date: "",
    ...overrides,
  } as Stop;
}

/* Coordinate reali: Colosseo e Foro Romano distano ~600 m in linea d'aria. */
const colosseo = { name: "Colosseo", address: "Roma", lat: 41.8902, lon: 12.4922 };
const foro = { name: "Foro Romano", address: "Roma", lat: 41.8925, lon: 12.4853 };
const fiumicino = { name: "Fiumicino", address: "Roma", lat: 41.8003, lon: 12.2389 };

describe("orari", () => {
  test("converte HH:mm in minuti e viceversa", () => {
    expect(minutesFromTime("10:30")).toBe(630);
    expect(minutesFromTime("00:00")).toBe(0);
    expect(minutesFromTime(null)).toBeNull();
    expect(timeFromMinutes(630)).toBe("10:30");
    expect(timeFromMinutes(75)).toBe("01:15");
  });

  test("formatta la durata in modo leggibile", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(90)).toBe("1h 30");
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(null)).toBe("in giornata");
  });

  test("l'intervallo esiste solo con orario di inizio", () => {
    expect(formatStopRange(makeStop({ _id: "a", startTime: "10:30", duration: 90 }))).toBe(
      "10:30–12:00"
    );
    expect(formatStopRange(makeStop({ _id: "b", startTime: "10:30" }))).toBe("10:30");
    expect(formatStopRange(makeStop({ _id: "c" }))).toBeNull();
  });

  test("formatta l'intervallo di date del viaggio", () => {
    expect(formatDateRange("2026-01-18T00:00:00Z", "2026-01-25T00:00:00Z")).toBe("18–25 gen");
    expect(formatDateRange(null, "2026-01-25T00:00:00Z")).toBeNull();
  });
});

describe("ordinamento del giorno", () => {
  test("prima le tappe con orario, poi quelle in giornata", () => {
    const stops = [
      makeStop({ _id: "libera", order: 500 }),
      makeStop({ _id: "pomeriggio", startTime: "16:00" }),
      makeStop({ _id: "mattina", startTime: "09:00" }),
      makeStop({ _id: "altro-giorno", day: 1, startTime: "08:00" }),
    ];

    expect(stopsOfDay(stops, 0).map((stop) => stop._id)).toEqual([
      "mattina",
      "pomeriggio",
      "libera",
    ]);
  });
});

describe("stima trasferimenti", () => {
  test("distanza breve: a piedi", () => {
    const transfer = estimateTransfer(
      makeStop({ _id: "a", place: colosseo }),
      makeStop({ _id: "b", place: foro })
    );

    expect(transfer).not.toBeNull();
    expect(transfer!.mode).toBe("walk");
    expect(transfer!.minutes).toBeGreaterThan(5);
    expect(transfer!.minutes).toBeLessThan(25);
  });

  test("distanza lunga: in auto", () => {
    const transfer = estimateTransfer(
      makeStop({ _id: "a", place: colosseo }),
      makeStop({ _id: "b", place: fiumicino })
    );

    expect(transfer!.mode).toBe("drive");
    expect(transfer!.minutes).toBeGreaterThan(30);
  });

  test("senza coordinate non si stima nulla", () => {
    const transfer = estimateTransfer(
      makeStop({ _id: "a", place: { name: "Bar", address: "Roma", lat: null, lon: null } }),
      makeStop({ _id: "b", place: colosseo })
    );

    expect(transfer).toBeNull();
  });
});

describe("giornata in corso", () => {
  /* Orario di riferimento: 11:00 del giorno in corso. */
  const at = (hours: number, minutes = 0) => {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  test("la prossima tappa è la prima ancora aperta", () => {
    const stops = [
      makeStop({ _id: "colazione", startTime: "09:00", duration: 30, status: "done" }),
      makeStop({ _id: "colosseo", startTime: "10:30", duration: 90 }),
      makeStop({ _id: "pranzo", startTime: "13:00" }),
    ];

    expect(nextStop(stops, at(11))!._id).toBe("colosseo");
  });

  test("una tappa già finita viene superata", () => {
    const stops = [
      makeStop({ _id: "colosseo", startTime: "10:30", duration: 30 }),
      makeStop({ _id: "pranzo", startTime: "13:00" }),
    ];

    expect(nextStop(stops, at(12))!._id).toBe("pranzo");
  });

  test("le tappe saltate non diventano mai la prossima", () => {
    const stops = [
      makeStop({ _id: "museo", startTime: "11:30", status: "skipped" }),
      makeStop({ _id: "pranzo", startTime: "13:00" }),
    ];

    expect(nextStop(stops, at(11))!._id).toBe("pranzo");
  });

  test("con tutto chiuso non c'è una prossima tappa", () => {
    const stops = [
      makeStop({ _id: "a", startTime: "09:00", status: "done" }),
      makeStop({ _id: "b", startTime: "10:00", status: "skipped" }),
    ];

    expect(nextStop(stops, at(11))).toBeNull();
  });

  test("il conto alla rovescia distingue prima, adesso e dopo", () => {
    const stop = makeStop({ _id: "a", startTime: "11:25" });

    expect(minutesUntil(stop, at(11))).toBe(25);
    expect(formatCountdown(25)).toBe("tra 25 min");
    expect(formatCountdown(0)).toBe("adesso");
    expect(formatCountdown(-5)).toBe("iniziata 5 min fa");
    expect(formatCountdown(90)).toBe("tra 1h 30");
    expect(formatCountdown(null)).toBe("in giornata");
  });
});

describe("avvisi di fattibilità", () => {
  test("segnala le sovrapposizioni di orario", () => {
    const stops = [
      makeStop({ _id: "a", title: "Colosseo", startTime: "10:30", duration: 120 }),
      makeStop({ _id: "b", title: "Pranzo", startTime: "12:00" }),
    ];

    const conflicts = dayConflicts(stops);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].stopId).toBe("b");
    expect(conflicts[0].message).toContain("12:30");
  });

  test("segnala il trasferimento più lungo del buco tra le tappe", () => {
    const stops = [
      makeStop({
        _id: "a",
        title: "Colosseo",
        startTime: "10:00",
        duration: 60,
        place: colosseo,
      }),
      makeStop({ _id: "b", title: "Fiumicino", startTime: "11:05", place: fiumicino }),
    ];

    const conflicts = dayConflicts(stops);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].message).toContain("Fiumicino");
  });

  test("una giornata realistica non genera avvisi", () => {
    const stops = [
      makeStop({
        _id: "a",
        title: "Colosseo",
        startTime: "10:00",
        duration: 90,
        place: colosseo,
      }),
      makeStop({ _id: "b", title: "Foro Romano", startTime: "12:00", place: foro }),
    ];

    expect(dayConflicts(stops)).toHaveLength(0);
  });

  test("le tappe saltate non generano avvisi", () => {
    const stops = [
      makeStop({ _id: "a", title: "Colosseo", startTime: "10:30", duration: 120 }),
      makeStop({ _id: "b", title: "Pranzo", startTime: "12:00", status: "skipped" }),
    ];

    expect(dayConflicts(stops)).toHaveLength(0);
  });
});
