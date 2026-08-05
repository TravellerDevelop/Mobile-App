/**
 * Formattazione di importi e date della sezione Money.
 * Tenuta a parte perché è logica pura, facile da testare e usata sia dalla
 * schermata sia dal dettaglio pagamento.
 */

/** "€ 123.45" — stesso formato già usato da Money e Dettagli pagamento. */
export function money(value: number | string | null | undefined): string {
  const n = Number(value);
  return Number.isFinite(n) ? "€ " + n.toFixed(2) : "€ --";
}

/** "€ 123" senza decimali: per le etichette dei grafici, dove lo spazio è poco. */
export function moneyShort(value: number): string {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1000) return "€ " + (n / 1000).toFixed(1).replace(".0", "") + "k";
  return "€ " + Math.round(n);
}

/** Importo con segno esplicito, per i saldi ("+ € 40.00" / "− € 12.50"). */
export function signedMoney(value: number): string {
  const n = Number(value) || 0;
  if (n === 0) return money(0);
  // Segno meno tipografico (U+2212): allineato con le cifre, a differenza del trattino.
  return (n > 0 ? "+ " : "− ") + money(Math.abs(n));
}

const DAY = 24 * 60 * 60 * 1000;

/** "oggi" / "ieri" / "3 giorni fa" / "12 mar" / "12 mar 2024". */
export function relativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfDate) / DAY);

  if (diffDays === 0) return "oggi";
  if (diffDays === 1) return "ieri";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} giorni fa`;

  const label = date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  return date.getFullYear() === now.getFullYear()
    ? label
    : `${label} ${date.getFullYear()}`;
}

/** Nome completo se disponibile, altrimenti lo username. */
export function personName(person: {
  name?: string;
  surname?: string;
  username?: string;
}): string {
  const full = `${person.name || ""} ${person.surname || ""}`.trim();
  return full || person.username || "?";
}

/** Variazione percentuale fra due mesi, arrotondata; null se il precedente è 0. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}
