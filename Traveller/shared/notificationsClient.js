import { isRunningInExpoGo } from "expo";

/**
 * Da SDK 53 le push notification remote su Android sono state rimosse da Expo Go.
 *
 * Non basta evitare le chiamate: il solo `import "expo-notifications"` fa partire
 * `DevicePushTokenAutoRegistration.fx`, che registra un push token listener a
 * livello di modulo e lancia un errore ("[runtime not ready]") dentro Expo Go.
 *
 * Per questo il modulo viene caricato in modo lazy e solo fuori da Expo Go.
 */
export const isExpoGo = isRunningInExpoGo();

let notificationsModule = null;

/**
 * Restituisce il modulo `expo-notifications`, oppure `null` se l'app gira in Expo Go.
 */
export function getNotifications() {
  if (isExpoGo) return null;

  if (!notificationsModule) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    notificationsModule = require("expo-notifications");
  }

  return notificationsModule;
}
