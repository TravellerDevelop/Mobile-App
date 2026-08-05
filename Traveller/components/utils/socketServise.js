/**
 * @deprecated Sostituito da `components/realtime/`.
 *
 * Questo modulo apriva una connessione Socket.io senza autenticazione
 * (l'userid arrivava dal client e il server si fidava), non chiudeva mai il
 * socket precedente e aveva un `off(event)` che rimuoveva i listener di
 * tutte le schermate, non solo di chi chiamava. Le sue funzioni sono ora
 * in `components/realtime/socketClient.ts`, con la connessione gestita da
 * `RealtimeProvider` e le sottoscrizioni dagli hook.
 *
 * Il file resta come segnaposto solo per rendere esplicito l'errore a chi
 * dovesse trovarne un import in un branch vecchio: usare gli hook.
 */
throw new Error(
  "components/utils/socketServise.js è stato rimosso: usa components/realtime " +
    "(useTravelRealtime / useUserRealtime)."
);
