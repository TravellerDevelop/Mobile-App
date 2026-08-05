/**
 * Chiamate REST della sezione Money.
 *
 * Tutta la schermata gira su una sola GET (`takeMoneyOverview`): prima
 * servivano quattro richieste in parallelo che tornavano viste parziali e
 * fra loro incoerenti degli stessi pagamenti.
 */

import { serverLink } from "../../global/globalVariable";
import { apiGet, apiSend } from "../../shared/data/apiClient";
import { cacheKeys } from "../../shared/data/offlineCache";
import { MoneyOverview, SettleUpResponse } from "./types";

const base = serverLink + "api/";

export interface CachedOverview {
  overview: MoneyOverview;
  fromCache: boolean;
  savedAt: number | null;
}

/**
 * Riepilogo completo: totali, andamento, spesa per viaggio, saldi, movimenti.
 * Senza rete restituisce l'ultima copia scaricata, marcata `fromCache`:
 * i saldi mostrati potrebbero non tenere conto delle spese aggiunte dagli
 * altri partecipanti nel frattempo, e la schermata lo dice.
 */
export async function fetchMoneyOverview(userId: string): Promise<CachedOverview> {
  const { data, fromCache, savedAt } = await apiGet<MoneyOverview>(
    `${base}post/takeMoneyOverview?userid=${encodeURIComponent(userId)}`,
    { cacheKey: cacheKeys.moneyOverview(userId) }
  );
  return { overview: data, fromCache, savedAt };
}

/**
 * Segna saldate tutte le quote aperte che una persona ha verso di me.
 * Il server accetta la richiesta solo dal creditore (creatore dei pagamenti).
 * Offline finisce in coda: `null` significa "partirà al ritorno della rete".
 */
export async function settleUpWith(
  userId: string,
  otherUserId: string,
  travelId?: string
): Promise<SettleUpResponse | null> {
  const { data } = await apiSend<SettleUpResponse>(
    `${base}post/settleUp`,
    { userid: userId, otherUserId, travelid: travelId },
    { queue: { label: "Saldo registrato", invalidates: [cacheKeys.moneyOverview(userId)] } }
  );
  return data;
}

/**
 * Push legata a un debito:
 * - "reminder": sollecito del creditore verso il debitore;
 * - "paid": il debitore avvisa il creditore di aver pagato.
 *
 * Non va in coda di proposito: un sollecito recapitato ore dopo, quando
 * magari il debito è già stato saldato di persona, è peggio che non
 * recapitato. Offline lancia OfflineError e la UI lo ignora.
 */
export async function notifyDebt(params: {
  fromUserId: string;
  toUserId: string;
  kind: "reminder" | "paid";
  amount?: number;
  travelName?: string;
}): Promise<void> {
  await apiSend(`${base}post/notifyDebt`, params);
}

/** Salva (o rimuove, con null) il budget personale dell'utente su un viaggio. */
export async function setPersonalBudget(
  travelId: string,
  userId: string,
  budget: number | null
): Promise<{ personalBudget: number | null; queued: boolean }> {
  const { data, queued } = await apiSend<{ personalBudget: number | null }>(
    `${base}travel/setPersonalBudget`,
    { travelid: travelId, userid: userId, budget },
    {
      queue: {
        label: "Budget personale",
        invalidates: [cacheKeys.moneyOverview(userId)],
      },
    }
  );

  // Offline il valore autorevole non c'è: torniamo quello richiesto, che
  // è anche quello che il server salverà quando la coda partirà.
  return { personalBudget: queued ? budget : data?.personalBudget ?? null, queued };
}
