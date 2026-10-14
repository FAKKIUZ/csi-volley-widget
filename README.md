# CSI Widget — pallavolo e calcio sull'iPhone

Widget per **Scriptable** (iOS) con classifica, risultati, la propria squadra e la sua ultima partita di un girone CSI di
**pallavolo** o di **calcio** (a 11, a 7, a 5), anche di **coppe e fasi finali**, letti dalla pagina pubblica
[live.centrosportivoitaliano.it](https://live.centrosportivoitaliano.it).
Lo sport si riconosce da solo dal link del girone.
Progetto amatoriale, non ufficiale e non collegato al Centro Sportivo Italiano.

## Installazione
Si usa **uno script per ogni squadra seguita**. Ci sono due script pronti:

| Script | Sport | Già impostato con |
| --- | --- | --- |
| `CSI Volley.js` | pallavolo | Volley 2c · Libere girone D (Bergamo) |
| `CSI Calcio.js` | calcio | Or.Cividate · Dilettanti B girone C (Bergamo) |

1. Installa **Scriptable** dall'App Store.
2. Apri il file dello sport che ti interessa (`CSI Volley.js` o `CSI Calcio.js`), tocca **Raw** e copia tutto il testo.
3. In Scriptable tocca **+**, incolla il testo e dai allo script lo stesso nome (**CSI Volley** o **CSI Calcio**).
4. Tocca ▶︎ una volta: lo script scarica il codice dei widget e mostra un menu con le anteprime.
5. Sulla Home tieni premuto su uno spazio vuoto → **Modifica → Aggiungi widget** → **Scriptable**
   e scegli la dimensione.
6. Tieni premuto sul widget → **Modifica widget** → **Script** → scegli lo script.
   Alla voce **When Interacting** puoi lasciare quello che vuoi (va bene anche **Run Script**):
   cosa succede al tocco lo decide già il widget (vedi *Da sapere*).

Il codice dei widget è uno solo (`csi-widget.js`) per tutti gli script: le correzioni arrivano a tutti da sole.

## Impostare la tua squadra e il tuo girone
Si fa una volta sola e vale per tutti i widget.

1. In Scriptable apri lo script (per esempio **CSI Volley** o **CSI Calcio**).
2. In cima trovi il blocco **IMPOSTAZIONI**. Cambia solo il testo tra virgolette:
   ```js
   squadra: "Volley 2c",
   girone: "https://live.centrosportivoitaliano.it/...",
   ```
   - **squadra**: la tua squadra; basta una parte del nome.
   - **girone**: il link del girone (vedi sotto come copiarlo).
3. Tocca **Fatto**. I widget si aggiornano da soli.

Le virgolette e la virgola a fine riga vanno lasciate.

### Come prendere il link del girone
1. Apri [live.centrosportivoitaliano.it](https://live.centrosportivoitaliano.it) in Safari.
2. Cerca il tuo comitato, la categoria e il girone fino a vedere classifica e partite.
3. Tieni premuto sulla barra degli indirizzi → **Copia**, poi incollalo tra le virgolette di `girone`.

## Cosa mostra ogni widget
Ogni widget sceglie la sua vista: tieni premuto sul widget → **Modifica widget** e scrivi nella casella
**Parameter**:

| Cosa vuoi | Cosa scrivi nel Parameter |
| --- | --- |
| la classifica | *(niente)* oppure `classifica` |
| i risultati della giornata della tua squadra | `risultati` |
| la scheda della tua squadra | `squadra` |
| un po' di tutto | `panoramica` |
| l'ultima partita della tua squadra, nel dettaglio | `ultima` |

La **panoramica** cambia con la dimensione del widget:
- **piccolo**: posizione, chi ti sta sopra e sotto in classifica, ultimo risultato e prossima partita;
- **medio**: la tua squadra con ultima e prossima partita, accanto alla classifica;
- **grande**: scheda della squadra, giornata in corso e classifica completa.

La vista **ultima** mostra l'ultima partita giocata dalla tua squadra:
- **piccolo**: stemmi, punteggio, esito (V/N/P), data e giornata; in mezzo l'andamento dei set, una barra
  per set con i punti ai lati (pallavolo), oppure la linea del tempo dei gol, il risultato del primo tempo e i
  marcatori della tua squadra, se il CSI li inserisce (calcio);
- **medio**: accanto al punteggio l'andamento dei set (pallavolo), oppure la linea del tempo dei gol e sotto
  i gol con il minuto (calcio). Nella linea del tempo ogni gol è un pallino, arancione quelli della tua squadra;
  i minuti del secondo tempo sono contati dall'inizio della partita (23' del secondo tempo → 68');
- **grande**: scheda della partita, tabella dei set o cronaca (gol, ammonizioni, fine primo tempo) e i
  precedenti tra le due squadre. I nomi dei marcatori compaiono quando il CSI li inserisce sul sito.
  Toccando il widget si apre la pagina della partita.

### Coppe e fasi finali
Con il link di una coppa o di una fase finale (turni a eliminazione) i widget si adattano da soli:
- al posto di "Giornata N" compare il nome del turno ("Primo turno", "Quarti", "Semifinali", "Finale");
- **andata e ritorno** stanno su una riga sola ("2-0 · 1-0"), in grassetto chi passa il turno; ai rigori
  "rig. 4-2". Nell'**ultima partita** ai rigori c'è il risultato della partita e sotto quello dei rigori;
- **classifica** diventa il **Tabellone**: fin dove è arrivata ogni squadra (🏆, 2°, poi chi è ancora in
  corsa con il turno, chi è qualificata e chi è stata eliminata, in grigio);
- **squadra** e **panoramica** mostrano lo stato della squadra al posto di posizione e punti ("Secondo turno",
  "Qualificata", "Eliminata · Semifinali", "Vincitrice") e il **Percorso**: un turno per riga con avversario
  ed esito;
- se il turno ha poche partite (es. la finale), sotto compaiono i turni precedenti.

### Usi avanzati (facoltativo)
Nel Parameter si possono aggiungere, separati da una **virgola**, un'altra squadra o un altro girone solo
per quel widget: `risultati, Pcq 1971` oppure *link del girone*`, Nome squadra`.

## Seguire più squadre o più gironi
Il modo più comodo è **uno script per ogni squadra**: in Scriptable crea un altro
script (per esempio **CSI Volley 2**), incollaci `CSI Volley.js` (o `CSI Calcio.js`) e in cima cambia
`squadra` e `girone`. Nei widget scegli lo script giusto, e il Parameter resta corto (`panoramica`,
`classifica`…). Ogni script ricorda **il proprio calendario** e si imposta separatamente con Siri.

In alternativa, per un solo widget, nel Parameter si possono scrivere anche il link del girone e la squadra:
`panoramica, https://live.centrosportivoitaliano.it/..., Nome squadra`

## Da sapere
- Toccando il widget si apre la pagina del girone sul sito CSI. Nei widget medio e grande, toccando una
  partita se ne apre la scheda, e toccando la palestra il percorso nell'app di navigazione predefinita
  (su iPhone: Impostazioni → App → App predefinite → Navigazione). Nel piccolo iOS permette un solo tocco:
  apre la pagina del girone. Fa eccezione la vista **ultima**, che in ogni dimensione apre la pagina della partita.
- I risultati in **rosso** non sono ancora ufficiali, come sul sito.
- **Forma**: le ultime 5 partite, la più recente a sinistra; i pallini vuoti sono quelle ancora da giocare.
- Il risultato della tua squadra si legge così: bollino **V** (vittoria, verde), **N** (pareggio, grigio,
  solo calcio) o **P** (sconfitta, rossa), poi il punteggio sempre in ordine casa-ospite con il
  **vostro numero in grassetto e colorato**. `@` vuol dire che avete giocato fuori casa, `vs` in casa.
- La giornata mostrata segue **la tua squadra**: è quella della vostra ultima partita e passa a quella della
  vostra prossima dalla mattina del giorno in cui quella giornata comincia, anche se la prima partita è di altre squadre (vale per
  pallavolo e calcio). Un recupero di una giornata vecchia invece compare dal giorno della partita. Le partite con data ancora da fissare
  compaiono come **da definire**.
- Calcio: in classifica grande le colonne sono PT · G · V · N · P · DR (differenza reti); nei widget
  piccoli e medi i nomi molto lunghi perdono le sigle iniziali (es. "Pol.Com.Tavernola" → "Tavernola").
- Se il sito CSI non risponde, il widget mostra i dati salvati e in fondo compare in rosso
  **⚠︎ dati delle…** con l'orario dell'ultimo aggiornamento riuscito.
- **Calendario**: dal menu dello script (tocca ▶︎) scegli **Aggiorna Calendario** e il calendario dove mettere
  le partite. Da lì in poi si aggiorna da solo insieme ai widget. Ogni script (CSI Volley, CSI Calcio…)
  ha il suo calendario.
- **Siri**: nelle impostazioni dello script usa **Add to Siri**: Siri dirà posizione, ultimo risultato e prossima partita.
- Il formato **a tutta pagina** di iOS 27 è già previsto nel codice e mostrerà la panoramica completa
  quando Scriptable lo supporterà.

## Aggiornamenti
Il widget si aggiorna da solo. Il codice viene scaricato da questo repository e salvato sul telefono:
le correzioni arrivano a tutti entro qualche ora (subito, aprendo lo script nell'app), senza ricopiare
niente, e le tue impostazioni restano. Senza connessione il widget usa l'ultima copia salvata.

## File
- `CSI Volley.js` — script da copiare in Scriptable, impostato per la pallavolo (impostazioni + caricatore)
- `CSI Calcio.js` — lo stesso script, impostato per il calcio
- `csi-widget.js` — il codice dei widget, pallavolo e calcio (scaricato dagli script)
