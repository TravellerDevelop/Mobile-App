# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Traveller is an Expo-managed React Native app (React 19 / RN 0.83, iOS + Android + web) for organizing group trips with friends: creating/joining travels, a chat-like post feed per trip, shared expense tracking ("Money"), tickets (with QR/barcode scanning), and notifications. There is no backend code in this repo — the app is a pure client that talks to a separate Node backend over REST (axios) and Socket.IO.

## Commands

Run all commands from the `Traveller/` directory (the actual Expo project root; the repo root only contains this folder).

- `npm start` — start the Expo dev server (Metro). `npm run android` / `npm run ios` / `npm run web` — start and open on a specific platform.
- `npm test` — run the Jest suite (plain `jest`, no `jest-expo` preset configured).
- `npx jest general.test.js` — run the single existing test file.
- `npx jest -t "Server reachable"` — run one test by name.
- `eas build --profile <development|preview|production>` — native builds via EAS (see `eas.json`); no local Xcode/Gradle build is set up.

There is no lint script configured in `package.json`.

### Before building for release

`global/globalVariable.js` holds environment flags that must be set by hand before every build (see the `/* ISTRUZIONI */` comment at the bottom of that file):
- `ISDEBUG` must be `false` so `serverLink` points at the production server (`https://traveller-ttze.onrender.com/`) instead of the hardcoded local IP (`myIp`).
- `ISBETA` must be set correctly for the target release.

`general.test.js` / `forTests.js` are not unit tests in the usual sense — they are a pre-release sanity check that asserts `ISDEBUG`/`ISBETA` are flipped to production values, `serverLink` is the prod URL, the prod server is reachable, and `appVersion` matches what the server reports. Expect this suite to fail during normal local development (since `ISDEBUG` is `true` locally) and to only pass once the app is configured for a release build.

## Architecture

**Navigation is two-layered.** `App.js` renders the root `NavigationContainer` with a bottom `Tab.Navigator` (`Home`, `Tickets`, `Money`, plus a hidden `TicketsModal` tab). The `Home` tab renders `screens/nav.js`, which mounts a second, `independent` `NavigationContainer` (`routes/NotificationStack.js`) with its own stack navigator for everything reachable from the home feed (travel detail, participants, profile, payments, new post, edit travel, etc). When adding a new screen, decide whether it belongs in the top-level tab bar (`App.js`) or the nested home stack (`routes/NotificationStack.js`).

**Global app state is minimal and split across three mechanisms:**
- `AuthProvider`/`useAuth` (`global/authContext.tsx`, provided at the very top of `App.tsx`) is the source of truth for whether the user is logged in. `App.tsx` renders a splash (`shared/loading.js`) while `auth.status === "checking"`, the full-screen `components/auth/AuthScreen` while `"signedOut"`, and the tab navigator only when `"signedIn"` — unauthenticated users can no longer reach the Tickets/Money tabs by having the app skip the check. The session itself lives in `expo-secure-store` (Keychain/Keystore, encrypted at rest), not in `AsyncStorage`, and never includes the user's `password`/password-hash field; `AsyncStorage["user"]` is still kept in sync (sanitized) as a read-only cache because most existing screens read the user via `getData("user")`.
- `GlobalUserContext` (defined and provided in `App.tsx`) carries `globalUserInfo`/`setGlobalUserInfo` for the logged-in user; currently not consumed anywhere else in the app.
- `global/globalStates.js` exposes a separate `UserInfo` context/provider that is not wired up in `App.tsx` — check whether a screen consumes this one or `GlobalUserContext` before assuming which is live.
- Persistent state (offline tickets, "seen initial modal" flag, etc.) is read/written directly via `AsyncStorage`, wrapped by helpers in `shared/data/localdata.js` (`storeJsonData`/`getData`/`removeData`, `getStringDataWithState[Reverse]`).

**Folder roles:**
- `screens/` — top-level screens; `screens/Modals/` — screens presented as modals (new travel, edit travel, login/registration, post menu, QR/ticket modal, etc).
- `routes/` — navigation stack definitions.
- `components/` — reusable widgets grouped by domain (`Travel-Componets/` for in-trip UI like posts/budget/votes/to-dos, `tickets/`, `loading/` for skeleton states, `utils/` for non-UI helpers like file system, notifications, and the socket service).
- `shared/` — cross-screen UI (headers, cards, loading states) plus `shared/data/localdata.js` for AsyncStorage access.
- `global/` — app-wide config: `globalVariable.js` (colors, fonts, server link, env flags), `globalStyleComponent.tsx` (shared style objects), `bottombarConfig.tsx` (tab bar icon/style config).

**Backend integration:**
- REST calls go through `axios` directly against `serverLink + "api/..."` (no central API client/interceptor layer — each call site builds its own URL and handles its own `.then/.catch`).
- Realtime updates go through `components/utils/socketServise.js`, a small `socket.io-client` wrapper (`initializeSocket`, `emit`, `on`, `off`). Note its `URL` is currently hardcoded to `http://localhost:3000` rather than derived from `serverLink`/`ISDEBUG`.
- Push notifications go through `expo-notifications`, but it is loaded lazily via `shared/notificationsClient.js` and only outside Expo Go — as of Expo SDK 53, remote push on Android was removed from Expo Go, and merely importing `expo-notifications` at module scope breaks the app there. New notification code should go through `getNotifications()` from that file rather than importing `expo-notifications` directly.

**Mixed JS/TS:** the codebase is a mix of `.js` and `.tsx`/`.ts` files with no enforced boundary — new files can be TypeScript, but don't assume the file you're editing is one or the other without checking its extension.

**Language:** UI copy, code comments, and commit messages are in Italian; keep new user-facing strings and comments in Italian for consistency.

## Code style & conventions

- Functional components + Hooks; keep business logic out of components (custom hooks/services) where practical.
- Styling via `StyleSheet.create` (see `components/Travel-Componets/componentStyle.js` for the prevailing pattern), Flexbox-first.
- **Design system (PierTour):** `global/designSystem.js` holds every visual token — `ds.colors`, `ds.fontFamily` (Poppins for UI, Inter for numbers/meta), `ds.type`, `ds.space`, `ds.radius`, `ds.control`, `ds.shadow`, `ds.layout` — plus the `avatarColor()`/`initials()` helpers. Reusable UI primitives live in `components/ui/index.js` (`BrandHeader`, `Sheet`, `SectionLabel`, `InitialsAvatar`, `StatusBadge`, `HeaderChip`, `SearchField`, `Card`, `PrimaryButton`, `SecondaryButton`, `EmptyState`, `ProgressTrack`). New screens should compose those instead of hardcoding colors, spacings or font names; the legacy `color`/`font` exports in `global/globalVariable.js` remain only for screens not yet migrated (travels, otherProfile).
- **Auth flow (TypeScript):** `components/auth/` holds login/registration — `types.ts`, `validation.ts` (email/password rules, full-name splitting, username-from-email derivation), `api.ts` (`loginRequest`/`registerRequest`/`fetchUserById`, all going through `sanitizeUser` so the `password` field never leaves this module), `useLoginForm.ts`/`useRegisterForm.ts` (state, validation, submit), `AuthFields.tsx` (bordered icon field, T&C checkbox, social button) and `AuthScreen.tsx` (the single Accedi/Registrati screen, tab-switched, matching the design mockup). `screens/Modals/login.tsx`/`registration.tsx` are now thin `<Modal>` wrappers around `AuthScreen` kept for backward compatibility (e.g. a future "session expired" prompt) — the app itself no longer opens them automatically; see the `AuthProvider` note above for how sign-in/sign-up actually gates navigation. The backend still expects a client-side SHA-256 digest of the password (`api.ts` keeps computing it via `expo-crypto` for compatibility) — this is a transport detail only, not a substitute for salted hashing server-side, and the digest is never persisted on the device.
- The redesigned screens follow one layout recipe: purple `BrandHeader` on top, white `Sheet` (16px top radii) overlapping it by ~14px, floating pill tab bar (`global/bottombarConfig.tsx`) anchored 20px from the bottom, so content needs `paddingBottom: ds.layout.contentBottomPadding`.
- Icons come from `@expo/vector-icons` (`MaterialCommunityIcons`), not PNG assets.
- **New travel flow (TypeScript):** `components/newTravel/` mirrors the new-post structure — `types.ts`, `useCreateTravelForm.ts` (cover upload, invite code generation, participants, `api/travel/create`), `useJoinTravel.ts` (5-char invite code + QR scan + `api/travel/join`), `CreateTravelForm.tsx`, `JoinTravelForm.tsx`; `screens/Modals/NewTravel.tsx` is the shell with the Crea/Unisciti segmented control. It replaced the old `newTravel.js` / `enterTravel.js` modals, which were mounted inline by `interactiveCard` and `mainHeader`; both now navigate to the `NewTravel` route with `initialTab` and an `updateTravels` callback. `destination`, `startDate` and `endDate` are now persisted by the backend (`createTravel` converts them to `Date`); the itinerary timeline derives its days from `startDate`/`endDate`.
- **Itinerary flow (TypeScript):** `components/itinerary/` holds the feature — `types.ts` (mirror of `Server/types/itinerary.ts`), `categories.ts` (stop categories, statuses, permission modes), `schedule.ts` (pure day maths: time formatting, transfer estimation via haversine, feasibility conflicts — covered by `schedule.test.ts`), `api.ts` (all `api/itinerary/...` calls), `useItinerary.ts` (state + mutations; every mutation reloads from the server because the plan is shared), `parts.tsx` (IdeaRow, StopRow, DayTabs, banners, FAB) and `StopEditorSheet.tsx` (stop editor + day picker). Screens: `screens/Itinerary.tsx` (Idee/Timeline + switch mappa), `screens/ItineraryStopDetail.tsx`, `screens/ItineraryToday.tsx` (giorno in corso), `screens/ItineraryRecap.tsx` (resoconto), `screens/Modals/ItineraryPermissions.tsx`. The map uses `react-native-maps` (added to `app.json` plugins) and is loaded with a runtime `require` inside `ItineraryMap.tsx` because it has no web build — a static import would break `expo start --web`. Android needs a Google Maps API key in `android.config.googleMaps.apiKey` and a fresh dev build; iOS uses Apple Maps and needs neither. Weather on the "today" screen comes from Open-Meteo (no key, called directly from the app).
- **Itinerary events in the feed:** every itinerary mutation writes a system post of the new type `itinerary` (`ItineraryPost` in `Server/types/post.ts`, `ApiItineraryPost` client-side) with `action` / `stopTitle` / `day` / `detail`, rendered by `components/Travel-Componets/ItineraryEvent.tsx` in both `travelDetail` and `home`. These posts are silent — they are inserted directly instead of going through `createPost`, so they never trigger a push. Two events on the same stop with the same action within 30 minutes are merged into one post instead of stacking. The itinerary handlers that write events take the `NodeCache` instance and `cache.del("travel-post=" + travelId)`, because `takePosts` caches the feed with no expiry. Backend: `Server/func/itinerary.ts` with collections `itineraries` (one per travel, holds the permission mode) and `stops` (ideas have `day: null`, stops have a day index). Place search proxies Nominatim server-side (`api/itinerary/searchPlace`) because it requires an identifying User-Agent and rate-limits clients.
- **New post flow (TypeScript):** `components/newPost/` holds the whole feature — `types.ts` (discriminated `NewPostPayload` per post type), `postTypes.ts` (the shared catalogue of the 5 types), `useNewPostForm.ts` (all state, validation and the `api/post/create` submit, image upload included), `fields.tsx` (FieldCard, FieldInput, SegmentedControl, ToggleRow, AddButton), `forms.tsx` (one component per post type) and `NewPostTypeSheet.tsx` (the bottom sheet). `screens/Modals/NewPost.tsx` is only the shell; `components/MenuNewPost.tsx` is the FAB that opens the sheet. Keep form state inside the hook — the old screen kept payloads in module-level mutable variables, which leaked between mounts.
- Prefer `react-native-reanimated` (already a dependency, v4) for animation over the core `Animated` API.
- Navigation additions should follow the existing React Navigation (stack/bottom-tabs) structure described above rather than introducing a different navigation library.
- TypeScript: prefer explicit interfaces for props/state in new `.tsx` files; avoid `any`.
