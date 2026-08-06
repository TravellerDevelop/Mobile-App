export const color = {
    primary: '#4960FF',
    secondary: '#4900FF',
    third: '#3582DB',
}

export const font = {
    montserrat: "montserrat-regular",
    montserratLight: "montserrat-light",
    montserratBold: "montserrat-bold",
    montserratThin: "montserrat-thin",
    text: "rubik-regular",
    text_bold: "rubik-bold",
    text_light: "rubik-light",
    text_black: "rubik-black",
}   

const myIp = "192.168.1.13";

export const appVersion = "1.0.2";
export const paddingTopPage = 15;

/**
 * Logica pura di ISDEBUG, esportata a parte per essere testabile senza
 * passare dal bundler (vedi sotto) — stesso schema di computeIsDebug(NODE_ENV)
 * in Server/server.ts.
 *
 * `dev` è pensato per essere il valore del globale `__DEV__` di Metro/Hermes:
 * `true` in ogni bundle di sviluppo (expo start, dev client), `false` nelle
 * build di release vere (EAS build --profile production, expo export). Solo
 * `false` conta come "non debug": qualunque altro valore (incluso `undefined`,
 * il caso di un ambiente fuori dal runtime RN) resta debug, il default più
 * sicuro quando non si sa con certezza in che contesto si gira.
 */
export function computeIsDebug(dev) {
  return dev !== false;
}

/**
 * Prima era un booleano scritto a mano, da ricordarsi di rimettere a `false`
 * prima di ogni build di release (vedi le ISTRUZIONI in fondo al file, prima
 * versione) — esattamente la stessa classe di errore già vista lato server
 * con ISDEBUG/computeIsDebug in Server/server.ts, dove infatti si è risolta
 * allo stesso modo: derivarlo automaticamente da un segnale che il sistema di
 * build imposta da sé, così non c'è più un passaggio manuale da dimenticare.
 * Qui il segnale è `__DEV__`, iniettato da Metro/Hermes in ogni bundle reale;
 * `typeof __DEV__ !== "undefined"` protegge solo l'esecuzione fuori da quel
 * runtime (Jest gira su plain Node, senza preset jest-expo: `__DEV__` non
 * esiste per niente lì, quindi va guardato con typeof invece di essere letto
 * direttamente, altrimenti è un ReferenceError).
 */
export const ISDEBUG = computeIsDebug(typeof __DEV__ !== "undefined" ? __DEV__ : true);
export const ISBETA = false;

/**
 * Anche questa a parte, per lo stesso motivo di computeIsDebug: dato che
 * ISDEBUG non è più forzabile a mano da un test (dipende da __DEV__, che
 * Jest non imposta mai), la scelta fra IP locale e server di produzione va
 * verificata passando esplicitamente `true`/`false`, non rileggendo
 * `serverLink` già calcolato.
 */
export function resolveServerLink(isDebug) {
    return isDebug ? "http://" + myIp + ":1337/" : "https://traveller-ttze.onrender.com/";
}

export const serverLink = resolveServerLink(ISDEBUG);

export let statusBarColor = "#4960FF";

export function setStatusBarColor(color){
    statusBarColor = color;
}

/* ISTRUZIONI */
// Prima di buildare
// - ISDEBUG ora è automatico (deriva da __DEV__): niente più da mettere a mano.
// - Impostare correttamente ISBETA