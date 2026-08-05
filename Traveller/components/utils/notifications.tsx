/**
 * @deprecated Sostituito da components/notifications/.
 *
 * Questo file conteneva un primo tentativo di gestione push, interamente
 * commentato e mai eseguito (usava hook fuori da un componente e un
 * projectId segnaposto). La logica reale vive ora in:
 *
 * - components/notifications/pushClient.ts       — token, permessi, listener
 * - components/notifications/NotificationsProvider.tsx — stato condiviso
 * - components/notifications/navigation.ts       — deep-link dal tap
 *
 * Il file resta come segnaposto perché non è eliminabile da qui; può essere
 * cancellato a mano senza conseguenze.
 */

export {};
