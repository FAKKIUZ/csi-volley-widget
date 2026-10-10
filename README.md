# CSI Volley — widget per iPhone

Widget per **Scriptable** (iOS) con classifica, risultati e la propria squadra di un girone di pallavolo CSI,
letti dalla pagina pubblica [live.centrosportivoitaliano.it](https://live.centrosportivoitaliano.it).
Progetto amatoriale, non ufficiale e non collegato al Centro Sportivo Italiano.

## Installazione
1. Installa **Scriptable** dall'App Store.
2. Apri il file `CSI Volley.js` di questa pagina, tocca **Raw** e copia tutto il testo.
3. In Scriptable tocca **+**, incolla il testo e chiama lo script **CSI Volley**.
4. Tocca ▶︎ una volta: lo script scarica il codice del widget e mostra un menu con le anteprime.
5. Sulla Home tieni premuto su uno spazio vuoto → **Modifica → Aggiungi widget** → **Scriptable**
   e scegli la dimensione.
6. Tieni premuto sul widget → **Modifica widget** → **Script** → **CSI Volley**.
   Alla voce **When Interacting** puoi lasciare quello che vuoi (va bene anche **Run Script**):
   cosa succede al tocco lo decide già il widget (vedi *Da sapere*).

Così com'è, il widget mostra il girone Libere D di Bergamo con la squadra Volley 2c evidenziata.

## Impostare la tua squadra e il tuo girone
Si fa una volta sola e vale per tutti i widget.

1. In Scriptable apri lo script **CSI Volley**.
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
| i risultati della giornata | `risultati` |
| la scheda della tua squadra | `squadra` |
| un po' di tutto | `panoramica` |

La **panoramica** cambia con la dimensione del widget:
- **piccolo**: posizione, chi ti sta sopra e sotto in classifica, ultimo risultato e prossima partita;
- **medio**: la tua squadra con ultima e prossima partita, accanto alla classifica;
- **grande**: scheda della squadra, giornata in corso e classifica completa.

### Usi avanzati (facoltativo)
Nel Parameter si possono aggiungere, separati da una **virgola**, un'altra squadra o un altro girone solo
per quel widget: `risultati, Pcq 1971` oppure *link del girone*`, Nome squadra`.

## Seguire più squadre o più gironi
Ci sono due modi:

1. **Dal Parameter del widget** (lo script resta uno solo): nel widget della seconda squadra scrivi
   la vista, il link del girone e il nome della squadra, separati da virgole:
   `panoramica, https://live.centrosportivoitaliano.it/..., Nome squadra`
2. **Duplicando lo script**: in Scriptable crea un secondo script (per esempio **CSI Volley 2**),
   incollaci lo stesso `CSI Volley.js` e in cima cambia `squadra` e `girone`. Nei widget scegli poi
   lo script giusto, e il Parameter resta corto (`panoramica`, `classifica`…). Anche Siri si imposta
   separatamente per ogni script.
   Il calendario scelto è **uno solo per tutti gli script**: nel secondo script metti
   `calendario: false`, altrimenti le sue partite finiscono nello stesso calendario del primo.

## Da sapere
- Toccando il widget si apre la pagina del girone sul sito CSI. Nei widget medio e grande, toccando una
  partita se ne apre la scheda, e toccando la palestra il percorso nell'app di navigazione predefinita
  (su iPhone: Impostazioni → App → App predefinite → Navigazione). Nel piccolo iOS permette un solo tocco:
  apre sempre la pagina del girone.
- I risultati in **rosso** non sono ancora ufficiali, come sul sito.
- Il risultato della tua squadra si legge così: bollino **V** (vittoria, verde) o **P** (sconfitta, rossa),
  poi il punteggio sempre in ordine casa-ospite con il **vostro numero in grassetto e colorato**.
  `@` vuol dire che avete giocato fuori casa, `vs` in casa.
- Se il sito CSI non risponde, il widget mostra i dati salvati e in fondo compare in rosso
  **⚠︎ dati delle…** con l'orario dell'ultimo aggiornamento riuscito.
- **Calendario**: dal menu dello script (tocca ▶︎) scegli **Aggiorna Calendario** e il calendario dove mettere
  le partite. Da lì in poi si aggiorna da solo insieme ai widget.
- **Siri**: nelle impostazioni dello script usa **Add to Siri**: Siri dirà posizione, ultimo risultato e prossima partita.
- Il formato **a tutta pagina** di iOS 27 è già previsto nel codice e mostrerà la panoramica completa
  quando Scriptable lo supporterà.

## Aggiornamenti
Il widget si aggiorna da solo. Il codice viene scaricato da questo repository e salvato sul telefono:
le correzioni arrivano a tutti entro qualche ora (subito, aprendo lo script nell'app), senza ricopiare
niente, e le tue impostazioni restano. Senza connessione il widget usa l'ultima copia salvata.

## File
- `CSI Volley.js` — lo script da copiare in Scriptable (impostazioni + caricatore)
- `csi-volley.js` — il codice del widget (scaricato dal caricatore)
