import axios from "axios";

/* ============================================================
   Meteo del giorno in corso.
   Open-Meteo è gratuito e senza chiave, quindi la chiamata parte
   direttamente dall'app: nessun segreto da proteggere lato server.

   Usa un'istanza axios DEDICATA (non quella di default): l'interceptor
   registrato in shared/data/authToken.ts aggiunge Authorization/X-User-Id a
   ogni richiesta fatta con `axios` di default, per farle arrivare
   automaticamente al backend di Traveller — ma si applicherebbe anche a
   questa chiamata verso un dominio di terze parti, mandando il token di
   sessione (e l'id utente) a Open-Meteo a ogni apertura della schermata
   "oggi". Un'istanza separata, creata con axios.create() e mai passata a
   installAuthInterceptor(), non ha quell'interceptor: le credenziali non la
   toccano.
   ============================================================ */

const openMeteoClient = axios.create();

export interface DayWeather {
  temperature: number;
  icon: string;
  description: string;
}

/* Codici WMO raggruppati: non serve la precisione da bollettino,
   serve capire se ci si bagna. */
function describe(code: number): { icon: string; description: string } {
  if (code === 0) return { icon: "weather-sunny", description: "Sereno" };
  if (code <= 2) return { icon: "weather-partly-cloudy", description: "Poco nuvoloso" };
  if (code === 3) return { icon: "weather-cloudy", description: "Nuvoloso" };
  if (code <= 48) return { icon: "weather-fog", description: "Nebbia" };
  if (code <= 57) return { icon: "weather-rainy", description: "Pioviggine" };
  if (code <= 67) return { icon: "weather-pouring", description: "Pioggia" };
  if (code <= 77) return { icon: "weather-snowy", description: "Neve" };
  if (code <= 82) return { icon: "weather-pouring", description: "Rovesci" };
  if (code <= 86) return { icon: "weather-snowy-heavy", description: "Rovesci di neve" };
  return { icon: "weather-lightning", description: "Temporale" };
}

/** Meteo attuale su una coordinata; null se la chiamata non riesce. */
export async function fetchWeather(lat: number, lon: number): Promise<DayWeather | null> {
  try {
    const { data } = await openMeteoClient.get<any>("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: lat,
        longitude: lon,
        current: "temperature_2m,weather_code",
        timezone: "auto",
      },
      timeout: 6000,
    });

    const current = data?.current;
    if (!current) return null;

    const { icon, description } = describe(Number(current.weather_code));
    return {
      temperature: Math.round(Number(current.temperature_2m)),
      icon,
      description,
    };
  } catch (err) {
    // Il meteo è un di più: senza rete la schermata funziona lo stesso.
    return null;
  }
}
