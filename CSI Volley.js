// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: volleyball-ball;

//
// CSI Volley — widget per Scriptable con classifica, risultati e la tua squadra
// di un girone di pallavolo CSI (live.centrosportivoitaliano.it)
// https://github.com/FAKKIUZ/csi-volley-widget
//
// ═════════════ IMPOSTAZIONI: modifica solo queste righe ═════════════

const IMPOSTAZIONI = {

  // la tua squadra (basta una parte del nome, maiuscole o minuscole non contano)
  squadra: "Volley 2c",

  // il link del girone, copiato da Safari sul sito live.centrosportivoitaliano.it
  girone: "https://live.centrosportivoitaliano.it/26/Pallavolo/Lombardia/Bergamo/C302/?j=NEU9REZIJjRGPWNpYiY0Rz1HREYmNEg9RCY0ST1RJjRMPURGSCY0Mj1l",

  // aggiorna da solo il calendario dopo averlo scelto una volta dal menu dell'app (true / false)
  calendario: true,

}

// Cosa mostra ogni widget si sceglie dal widget: tienilo premuto → Modifica widget → Parameter
// e scrivi classifica, risultati, squadra oppure panoramica (vuoto = classifica).

// ════════════════════ da qui in giù non serve toccare ════════════════════
// Il codice del widget viene scaricato da GitHub e salvato sul telefono: si riscarica al massimo
// ogni 3 ore, così le nuove versioni arrivano da sole. Senza rete usa l'ultima copia salvata.

const CODE_URL = "https://raw.githubusercontent.com/FAKKIUZ/csi-volley-widget/main/csi-volley.js"
const REFRESH_MS = 3 * 60 * 60 * 1000

const fm = FileManager.local()
const dir = fm.joinPath(fm.libraryDirectory(), "csi-volley")
if (!fm.fileExists(dir)) fm.createDirectory(dir, true)
const codePath = fm.joinPath(dir, "csi-volley-codice.js")
const timePath = fm.joinPath(dir, "csi-volley-codice.txt")

let savedAt = 0
try { if (fm.fileExists(timePath)) savedAt = Number(fm.readString(timePath)) || 0 } catch (e) {}

// in app si controlla sempre se c'è una versione nuova; nei widget al massimo ogni 3 ore
if (!fm.fileExists(codePath) || config.runsInApp || Date.now() - savedAt > REFRESH_MS) {
  try {
    const req = new Request(CODE_URL)
    req.timeoutInterval = 10
    const text = await req.loadString()
    if (req.response.statusCode === 200 && text.includes("CSI-VOLLEY-SCRIPTABLE")) {
      fm.writeString(codePath, text)
      fm.writeString(timePath, String(Date.now()))
    }
  } catch (e) { console.log(`Download del codice non riuscito: ${e}`) }
}

if (fm.fileExists(codePath)) {
  // il codice si legge ogni volta dal file (importModule lo terrebbe in memoria e userebbe la versione vecchia)
  const mod = { exports: {} }
  new Function("module", fm.readString(codePath))(mod)
  await mod.exports(IMPOSTAZIONI)
} else {
  const w = new ListWidget()
  w.backgroundColor = new Color("#F4F6FA")
  const t1 = w.addText("🏐 CSI Volley"); t1.font = Font.boldSystemFont(13); t1.textColor = new Color("#0F172A")
  const t2 = w.addText("Impossibile scaricare il widget"); t2.font = Font.systemFont(11); t2.textColor = new Color("#B91C1C")
  const t3 = w.addText("Controlla la connessione e riprova."); t3.font = Font.systemFont(9); t3.textColor = new Color("#64748B")
  w.addSpacer()
  if (config.runsInWidget) Script.setWidget(w)
  else await w.presentSmall()
  Script.complete()
}
