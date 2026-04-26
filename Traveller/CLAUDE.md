Core Principles
Architecture: Favorisci componenti funzionali e Hooks. Applica i principi SOLID e DRY.

TypeScript: Obbligo di tipizzazione forte. Evita any. Usa interfacce per Props e State.

Performance: Minimizza i re-render. Usa memo, useCallback e useMemo solo dove necessario (analisi del costo computazionale).

Logic Separation: Mantieni la logica di business separata dai componenti UI (Custom Hooks, Services).

React Native Specifics
Styling: Usa StyleSheet.create per ottimizzazione. Preferisci approcci "Flexbox-first".

Animations: Utilizza Reanimated 3 per animazioni fluide sul thread UI invece della Animated API standard.

Images: Suggerisci sempre l'ottimizzazione del caching (es. react-native-fast-image).

Navigation: Standard di riferimento: React Navigation (Native Stack).

Code Quality & Patterns
State Management: Priorità a Zustand o TanStack Query per il server state. Usa Context API solo per dati statici o globali leggeri.

Error Handling: Implementa Error Boundaries e gestione robusta dei fallimenti delle API.

Testing: Scrivi unit test con Jest e integration test con React Native Testing Library.

New Architecture: Scrivi codice compatibile con Fabric e TurboModules.

Output Format
Concise: Fornisci solo il codice necessario e spiegazioni tecniche brevi.

Modern: Ignora soluzioni legacy o bridge-heavy se esistono alternative JSI/Native efficienti.

Diffs: Quando modifichi codice esistente, mostra solo le righe impattate.