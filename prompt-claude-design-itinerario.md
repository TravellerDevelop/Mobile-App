# Prompt per Claude Design — Feature "Itinerario" (Traveller)

> Copia tutto quello che segue e incollalo in Claude Design.

---

## Ruolo

Sei un product designer mobile. Devi progettare il **concept completo** (flussi, wireframe, gerarchia informativa, stati, microcopy) di una nuova feature chiamata **Itinerario** dentro un'app di viaggi di gruppo. Non scrivere codice: produci un concept di design implementabile.

## Contesto prodotto

**Traveller** è un'app React Native (Expo, iOS + Android) per organizzare viaggi di gruppo con amici. Oggi esiste:

- **Viaggio**: creato da un utente ("admin di viaggio"), con nome, cover, destinazione, date, budget, codice invito a 5 caratteri, lista partecipanti.
- **Feed del viaggio** (`travelDetail`): un flusso cronologico di post di 5 tipi — Testo, Sondaggio, Pagamento, Immagini, To-Do — creati da un FAB con bottom sheet di scelta tipo.
- **Money**: spese condivise, con importo, descrizione, tipo (normale/personale) e destinatari con stato "pagato".
- **Biglietti**: ticket salvati con QR/barcode scansionabile, disponibili anche offline.
- **Notifiche** push e aggiornamenti realtime via socket.
- **Budget indicator**: budget del viaggio vs speso, in cima al feed.

Lingua UI: **italiano**. Tutto il microcopy che produci deve essere in italiano, tono informale ma non ammiccante (dai del "tu", niente emoji nell'interfaccia).

## Design system esistente (da rispettare)

- Brand viola/blu. Accent azione `#4960FF`, primary scuro `rgb(1, 21, 93)`; scale a 12 step in stile Radix per primary / accent / neutral / success / warning / error.
- Ricetta di layout ricorrente: **header brand viola** in alto, **sheet bianco** con raggio 16px in alto che si sovrappone all'header di ~14px, **tab bar a pillola flottante** ancorata a 20px dal fondo (quindi serve padding inferiore nei contenuti scrollabili).
- Tipografia: Poppins per la UI, Inter per numeri e metadati.
- Primitive UI già disponibili: `BrandHeader`, `Sheet`, `SectionLabel`, `InitialsAvatar`, `StatusBadge`, `HeaderChip`, `SearchField`, `Card`, `PrimaryButton`, `SecondaryButton`, `EmptyState`, `ProgressTrack`.
- Icone: `MaterialCommunityIcons` (@expo/vector-icons), mai immagini PNG.
- Avatar utente generati da iniziali + colore derivato dall'username.

Progetta **componendo queste primitive**; se ne servono di nuove, dichiarale esplicitamente come aggiunte al design system (nome, anatomia, varianti, stati).

---

## Cosa deve fare la feature

### 1. Modello: ibrido wishlist + timeline

Due livelli, un solo dato sottostante:

- **Idee (wishlist)**: backlog non datato di posti/attività che qualcuno vuole fare. Nessun orario, nessun giorno.
- **Timeline**: i giorni del viaggio (derivati da data inizio/fine), ognuno con una sequenza ordinata di **tappe**. Un'idea diventa tappa quando viene assegnata a un giorno; l'orario è **opzionale** (una tappa può essere "in giornata" oppure avere orario di inizio ed eventuale durata).

Progetta il passaggio idea → tappa come azione a basso attrito (drag, oppure "Aggiungi al giorno…" con selettore giorno), e anche il ritorno indietro (tappa rimessa nelle idee, non cancellata).

### 2. Anatomia di una tappa

Definisci quali campi sono obbligatori, opzionali e progressivamente rivelati:

- Titolo, categoria/tipo (es. visita, ristorante, trasferimento, alloggio, evento, attività, tempo libero)
- Luogo (nome + indirizzo + coordinate) e mappa
- Giorno, orario di inizio opzionale, durata stimata
- Note, link, allegati/foto
- **Costo previsto** e collegamento a una spesa in Money
- **Biglietto** allegato (uno dei ticket con QR già in app, o nuovo)
- **Checklist** di cose da portare/fare per quella tappa
- Chi partecipa alla tappa (il gruppo può splittarsi: non tutti fanno tutto)
- Stato: da confermare / confermata / in corso / fatta / saltata

### 3. Mappa e navigazione live

- Ricerca luogo con autocomplete (Places), salvataggio coordinate.
- Vista mappa del giorno con tappe numerate e percorso.
- Tempi di spostamento stimati tra una tappa e la successiva, con avviso quando la timeline è **impossibile** (sovrapposizioni, tempo di trasferimento maggiore del buco tra due tappe).
- Handoff verso Google/Apple Maps per la navigazione vera.
- Progetta anche lo **switch lista ↔ mappa** e come si comportano insieme (mappa a metà schermo con lista trascinabile? tab? bottom sheet?): motiva la scelta.

### 4. Permessi decisi dall'admin del viaggio

Il modello di collaborazione **non è fisso**: l'admin del viaggio sceglie, in un pannello impostazioni dell'itinerario, come si lavora. Progetta l'impostazione e le tre modalità risultanti:

- **Aperto** — chiunque aggiunge, modifica e riordina.
- **Proposte + voto** — chiunque propone, il gruppo vota, l'admin (o la maggioranza) conferma. Riusa il sistema di sondaggi esistente.
- **Solo admin** — l'admin costruisce, gli altri leggono, commentano e aggiungono idee alla wishlist.

Mostra chiaramente lo **stato corrente dei permessi** dentro l'itinerario (chip nell'header o banner) e cosa succede a chi non ha i diritti: pulsanti nascosti o disabilitati con spiegazione? Decidi e motiva. Progetta anche il caso in cui l'admin **cambia modalità a itinerario avviato** (cosa succede alle proposte in sospeso).

### 5. Integrazioni con le feature esistenti

- **Money**: una tappa con costo genera o si collega a una spesa; mostra in itinerario il totale previsto vs il budget del viaggio, e la differenza tra "previsto" e "già speso".
- **Biglietti**: allega un ticket a una tappa; il giorno dell'evento il QR deve essere raggiungibile in uno o due tap dall'itinerario, anche offline.
- **Post del feed**: una tappa può essere annunciata nel feed; le foto caricate durante il viaggio si possono agganciare alla tappa, così l'itinerario a viaggio finito diventa un diario.
- **To-do e sondaggi**: checklist per tappa; sondaggio del gruppo collegato a una tappa proposta (le opzioni del sondaggio sono alternative di tappa).

Per ognuna definisci **da dove parte l'azione** (dall'itinerario verso la feature, o viceversa) ed evita duplicati: non deve nascere una seconda schermata "spese" dentro l'itinerario.

### 6. Ciclo di vita: prima, durante, dopo

Progetta come cambia la stessa schermata nelle tre fasi. È la parte più importante del concept.

- **Prima (pianificazione)**: raccolta idee, discussione, riempimento giorni, controllo fattibilità e costi, stato "bozza" vs "confermato", conto alla rovescia alla partenza.
- **Durante (in viaggio)**: la schermata si apre sul **giorno di oggi** e sulla **prossima tappa**; check-in su una tappa, "siamo in ritardo" con ricalcolo/slittamento delle tappe successive, modifiche al volo, tappa saltata, meteo del giorno, accesso rapido a biglietto e navigazione, notifica prima di una tappa con orario.
- **Dopo (ricordo)**: l'itinerario diventa un resoconto — mappa dei posti visti, tappe fatte vs saltate, spesa reale vs prevista, foto per tappa, esportazione/condivisione, e possibilità di **riusare l'itinerario** come modello per un altro viaggio o di condividerlo pubblicamente.

### 7. Creazione assistita (opzionale ma da esplorare)

Proponi come potrebbe funzionare un aiuto alla generazione: da destinazione + date + interessi + ritmo (rilassato/intenso) a una bozza di itinerario modificabile. Progetta soprattutto il **momento della revisione**: come l'utente accetta, scarta o modifica ciò che gli viene proposto, e come si capisce cosa è stato generato e cosa deciso dal gruppo.

---

## Vincoli e attenzioni

- **Mobile-first, una mano sola**: le azioni frequenti stanno nella metà bassa dello schermo. Attenzione al drag-and-drop su mobile: proponi sempre un'alternativa accessibile (menu "Sposta a…").
- **Offline**: durante il viaggio la connessione manca. Definisci cosa è disponibile offline e come si comunicano modifiche non sincronizzate e conflitti tra due persone che editano lo stesso giorno.
- **Densità**: un giorno può avere 1 tappa o 12; un viaggio 3 giorni o 30. Mostra come regge la UI in entrambi gli estremi.
- **Viaggio senza date** (esiste già: destinazione e date non sono garantite): l'itinerario deve funzionare anche senza date impostate — probabilmente solo wishlist, con invito a impostare le date.
- **Accessibilità**: target touch ≥ 44px, contrasto AA, niente informazione veicolata dal solo colore (gli stati tappa servono anche icona/etichetta).
- **Non reinventare la navigazione**: la feature vive dentro il viaggio, insieme al feed. Decidi e motiva se è una tab dentro il viaggio, una card nel feed che apre uno stack, o una voce nell'header.

---

## Cosa consegnare

1. **Sintesi del concept** — in 10 righe: cos'è l'itinerario in Traveller e cosa lo distingue da una nota condivisa.
2. **Mappa dei flussi** — i percorsi principali: aggiungi idea, pianifica un giorno, proponi e vota una tappa, giorno in corso, chiudi il viaggio. Formato diagramma testuale o Mermaid.
3. **Elenco schermate** con obiettivo, contenuto e azioni primarie/secondarie di ciascuna.
4. **Wireframe** delle schermate chiave (almeno: itinerario vuoto, wishlist, giorno in lista, giorno in mappa, dettaglio tappa, editor tappa, proposta in votazione, giorno in corso, resoconto post-viaggio). ASCII/blocchi va bene se non puoi generare immagini; se puoi, layout ad alta fedeltà sui token del design system.
5. **Stati** per ogni schermata: vuoto, caricamento, errore, offline, senza permessi, molti elementi.
6. **Microcopy in italiano**: titoli, empty state, conferme distruttive, notifiche, messaggi di errore.
7. **Componenti nuovi** da aggiungere al design system, con anatomia, varianti e stati.
8. **Modello dati proposto** (entità e campi, in TypeScript) e gli endpoint REST che il backend dovrà esporre.
9. **Roadmap in 3 tagli**: MVP spedibile, v1 completa, idee successive — con la motivazione di cosa resta fuori dall'MVP.
10. **Rischi e domande aperte** che il concept lascia irrisolte.

Inizia dal punto 1 e 2, poi fermati e chiedimi conferma prima di sviluppare wireframe e dettaglio.
