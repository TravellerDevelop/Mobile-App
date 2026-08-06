import axios from "axios";

/* ============================================================
   Traveller — Credenziali per le chiamate REST

   Il backend ora richiede un token valido su ogni rotta /api/*
   tranne login/registrazione/renewToken (vedi Server/func/socketAuth.ts:
   requireAuth). Il token è lo stesso "socketToken" già emesso da
   login/registrazione/renewToken e già usato per il canale
   realtime — qui viene solo riusato anche per il REST, non è una
   seconda credenziale da gestire.

   Perché un modulo a parte e non "passare il token a ogni chiamata":
   l'app fa ~25 file diversi di chiamate axios dirette (un api.ts per
   dominio, dentro components/...), scritte prima che esistesse questo
   concetto di sessione. Riscriverle tutte
   per accettare un token come parametro è un cambiamento enorme e rischioso
   per una sola riga di guadagno. axios è un modulo singleton: registrare UN
   interceptor qui, importato una sola volta all'avvio (vedi
   global/authContext.tsx), lo applica a ogni richiesta di ogni file, incluse
   quelle già scritte, senza toccarle.

   Le credenziali vivono in una variabile di modulo (non in AsyncStorage/
   SecureStore) perché l'interceptor axios è sincrono: deve poter leggere il
   token nell'istante in cui una richiesta parte, senza un await. È
   authContext.tsx — l'unica fonte di verità sulla sessione — a tenerla
   allineata (setAuthCredentials al login/refresh, clearAuthCredentials al
   logout).
   ============================================================ */

interface AuthCredentials {
  userId: string;
  token: string;
}

let current: AuthCredentials | null = null;

export function setAuthCredentials(credentials: AuthCredentials): void {
  current = credentials;
}

export function clearAuthCredentials(): void {
  current = null;
}

export function getAuthCredentials(): AuthCredentials | null {
  return current;
}

/**
 * Come ottenere credenziali nuove quando il server rifiuta quelle in uso
 * (token scaduto: dura 30 giorni, vedi Server/func/socketAuth.ts). Iniettata
 * da authContext.tsx, che rilegge il profilo e quindi ottiene un token
 * fresco — lo stesso meccanismo già usato dal socket (vedi
 * components/realtime/socketClient.ts:tryRenewAuth), qui riapplicato al REST.
 */
let refresh: (() => Promise<AuthCredentials | null>) | null = null;

export function setAuthRefresher(fn: (() => Promise<AuthCredentials | null>) | null): void {
  refresh = fn;
}

function applyHeaders(config: any, credentials: AuthCredentials): any {
  config.headers = config.headers ?? {};
  config.headers["Authorization"] = `Bearer ${credentials.token}`;
  config.headers["X-User-Id"] = credentials.userId;
  return config;
}

let interceptorInstalled = false;

/**
 * Da chiamare una sola volta, il prima possibile (vedi global/authContext.tsx).
 * Idempotente: un secondo richiamo (es. fast refresh in sviluppo) non
 * registra un secondo interceptor duplicato.
 */
export function installAuthInterceptor(): void {
  if (interceptorInstalled) return;
  interceptorInstalled = true;

  axios.interceptors.request.use((config) => {
    if (current) applyHeaders(config, current);
    return config;
  });

  // Un solo tentativo di rinnovo per richiesta (flag su config): un 401
  // dopo il rinnovo è un errore vero (non autorizzato, non "scaduto") e va
  // propagato invece di rientrare in loop.
  //
  // `__isAuthBootstrap` protegge un caso diverso: `refresh()` stesso chiama
  // fetchUserById (profilo) e renewSocketToken (token, POST api/user/
  // renewToken) — richieste axios come le altre, che passerebbero da qui.
  // Se ANCHE una di quelle prendesse 401 e richiamassimo refresh() per lei,
  // richiameremmo la stessa funzione che l'ha generata — un loop fra questo
  // interceptor e refreshSession, che è esattamente quello che si è visto
  // in pratica quando il meccanismo di rinnovo passava (in modo non
  // sicuro) da GET takeUserById invece che da renewToken (vedi
  // Server/func/user.ts). Su queste richieste un 401 è un rinnovo fallito
  // e basta: va propagato, non ritentato.
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const config = error?.config;
      if (
        status === 401 &&
        refresh &&
        config &&
        !config.__authRetried &&
        !config.__isAuthBootstrap
      ) {
        config.__authRetried = true;
        const next = await refresh();
        if (next) {
          setAuthCredentials(next);
          return axios(applyHeaders(config, next));
        }
      }
      return Promise.reject(error);
    }
  );
}
