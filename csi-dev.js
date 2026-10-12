// CSI-WIDGET-SCRIPTABLE — codice dei widget CSI (pallavolo e calcio) per Scriptable  [CSI-VOLLEY-SCRIPTABLE]
// Questo file viene scaricato dagli script "CSI Volley" e "CSI Calcio" (i caricatori): non va copiato in Scriptable.
// Lo sport si riconosce dal link del girone (…/Pallavolo/… oppure …/Calcio-a-11/…, …/Calcio-a-5/…).
// https://github.com/FAKKIUZ/csi-widget

module.exports = async function (IMPOSTAZIONI) {
IMPOSTAZIONI = IMPOSTAZIONI || {}

const CONFIG = {
  url: "https://live.centrosportivoitaliano.it/26/Pallavolo/Lombardia/Bergamo/C302/?j=NEU9REZIJjRGPWNpYiY0Rz1HREYmNEg9RCY0ST1RJjRMPURGSCY0Mj1l",
  titolo: "",            // vuoto = ricavato dal sito ("Libere · Girone D")
  squadra: "Volley 2c",  // squadra evidenziata di default (il parametro del widget ha la precedenza)
  vista: "classifica",   // vista di default se il parametro non la indica
  loghi: true,           // false = solo badge con le iniziali
  aggiornaOgniMin: 30,   // richiesta a iOS: il momento esatto lo decide il sistema
  calendarioAuto: true,  // dopo il primo "Aggiorna Calendario" dall'app, il calendario si aggiorna con i widget
}
// impostazioni scritte nello script (es. "CSI Volley" o "CSI Calcio", il caricatore)
{
  const val = x => typeof x === "string" && x.trim() ? x.trim() : null
  if (val(IMPOSTAZIONI.girone)) CONFIG.url = val(IMPOSTAZIONI.girone)
  if (val(IMPOSTAZIONI.squadra)) CONFIG.squadra = val(IMPOSTAZIONI.squadra)
  if (typeof IMPOSTAZIONI.calendario === "boolean") CONFIG.calendarioAuto = IMPOSTAZIONI.calendario
}

// ───────────────────────── impostazioni ─────────────────────────

const params = parseParams(args.widgetParameter || (args.queryParameters || {}).p)
const URL_GIRONE = params.url || CONFIG.url
let TEAM = (params.squadra || CONFIG.squadra || "").trim()
// sport riconosciuto dal link del girone (…/Calcio-a-11/…, …/Calcio-a-5/…, …/Pallavolo/…)
const CALCIO = /\/calcio/i.test(URL_GIRONE)
const ICON = CALCIO ? "⚽️" : "🏐"

const C = {
  // sfondo con una tinta appena accennata per sport: caldo per la pallavolo, verde per il calcio
  bg:     CALCIO ? Color.dynamic(new Color("#F2F7F3"), new Color("#0C1614")) : Color.dynamic(new Color("#F8F5F0"), new Color("#15131B")),
  text:   Color.dynamic(new Color("#0F172A"), new Color("#F1F5F9")),
  sub:    Color.dynamic(new Color("#64748B"), new Color("#8B9AB0")),
  // righe e schede: bianche in chiaro; in scuro con la stessa tinta dello sfondo
  stripe: Color.dynamic(new Color("#FFFFFF"), new Color(CALCIO ? "#15241F" : "#211E2A")),
  chip:   Color.dynamic(new Color("#E3E9F4"), new Color("#1E2B42")),
  accent: new Color("#F5A524"),
  accentSoft: Color.dynamic(new Color("#FDE9C4"), new Color("#3A2A08")),
  hl:     Color.dynamic(new Color("#FFE6AE"), new Color("#47330C")),
  hlText: Color.dynamic(new Color("#9A5B00"), new Color("#FFC861")),
  win:    Color.dynamic(new Color("#15803D"), new Color("#4ADE80")),
  lose:   Color.dynamic(new Color("#B91C1C"), new Color("#F87171")),
  uff:    Color.dynamic(new Color("#DC2626"), new Color("#FF6B6B")), // risultato ufficioso (non ancora omologato)
  draw:   Color.dynamic(new Color("#94A3B8"), new Color("#64748B")), // pareggio (calcio)
}

const SCREEN = Device.screenSize()
// profilo del telefono: "larghezza x altezza" dello schermo in punti
const DEV = `${Math.round(Math.min(SCREEN.width, SCREEN.height))}x${Math.round(Math.max(SCREEN.width, SCREEN.height))}`
// larghezza widget medio/grande: misurata dove c'è un profilo (iPhone 11 / XR / 11 Pro Max: 354), altrimenti stimata
const WIDE = { "414x896": 354 }[DEV] || Math.round(Math.min(SCREEN.width, SCREEN.height) * 0.89)
const PAD = 14
const INNER = WIDE - PAD * 2
const INNER_SMALL = Math.round(WIDE * 0.467) - PAD * 2
// Misure reali del widget medio (punti), dalle tabelle Apple per i vari iPhone; per gli altri una stima.
// Servono ai medi per usare tutta l'altezza: contenuto = misure meno i margini (14 ai lati, 12 sopra e sotto).
const MED = (() => {
  const sw = Math.round(Math.min(SCREEN.width, SCREEN.height)), sh = Math.round(Math.max(SCREEN.width, SCREEN.height))
  // 414x896 (iPhone 11) misurato sugli screenshot con iOS 27: 354×166
  const t = { "430x932": [364, 170], "428x926": [364, 170], "414x896": [354, 166], "414x736": [348, 157],
    "393x852": [338, 158], "390x844": [338, 158], "375x812": [329, 155], "360x780": [329, 155],
    "375x667": [321, 148], "320x568": [292, 141] }[`${sw}x${sh}`] || [Math.round(sw * 0.867), Math.round(sw * 0.405)]
  return { w: t[0] - PAD * 2, h: t[1] - 24 }
})()
// Misure reali del widget grande (punti). Riferimento: iPhone 12 Pro con iOS 27, 352×352
// (misurate sugli screenshot) → contenuto 324×328. iPhone 11 (414x896): 354×371, misurato allo stesso modo.
const LRG = (() => {
  const sw = Math.round(Math.min(SCREEN.width, SCREEN.height)), sh = Math.round(Math.max(SCREEN.width, SCREEN.height))
  const t = { "390x844": [352, 352], "414x896": [354, 371] }[`${sw}x${sh}`] || [WIDE, Math.round(WIDE * 1.05)]
  return { w: t[0] - PAD * 2, h: t[1] - 24 }
})()
// scala dei caratteri della panoramica: testi 10,5 · dettagli 10 · etichette 9 (sectionLabel)
const F_TXT = 10.5, F_SUB = 10
let LOGOS = {}
let TREND = null // posizioni a fine giornata precedente, per le frecce
let FAMILY = "" // dimensione del widget che si sta disegnando

// ───────────────────────── main ─────────────────────────

let data = null, err = null
if (params.vista !== "diagnosi") { try { data = await getData(URL_GIRONE) } catch (e) { err = e } }

if ((config.runsInWidget || config.runsInAccessoryWidget) && params.vista === "diagnosi") {
  // widget minimo: dice quale formato iOS sta chiedendo a Scriptable
  const w = new ListWidget()
  w.backgroundColor = new Color("#F4F6FA")
  const add = (s, size, bold) => { const t = w.addText(s); t.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size); t.textColor = new Color("#0F172A") }
  add(`${ICON} Diagnosi widget`, 16, true)
  w.addSpacer(8)
  add(`Formato: ${config.widgetFamily}`, 14, true)
  const sc = Device.screenSize()
  add(`Schermo: ${Math.round(sc.width)}×${Math.round(sc.height)} pt`, 12)
  add(`${Device.model()} · iOS ${Device.systemVersion()}`, 12)
  add(new Date().toLocaleTimeString("it-IT"), 12)
  w.addSpacer()
  Script.setWidget(w)
} else if (!config.runsInWidget && !config.runsInAccessoryWidget && wantsCalendar()) {
  // automazione di Comandi Rapidi: aggiorna solo il calendario, in silenzio
  let out
  if (err || !data) out = "Calendario CSI: sito non raggiungibile, riprovo alla prossima esecuzione."
  else if (data.fromCache) out = "Calendario CSI: sito non raggiungibile, nessuna modifica."
  else {
    const r = await syncCalendar(data, true)
    out = !r ? "Calendario CSI: calendario non configurato. Apri lo script in Scriptable e usa «Aggiorna Calendario» una volta."
      : r.added + r.updated === 0 ? "Calendario CSI: nessuna modifica."
      : `Calendario CSI: ${r.added} partite aggiunte, ${r.updated} aggiornate.`
  }
  Script.setShortcutOutput(out)
} else if (config.runsWithSiri || config.runsFromShortcut) {
  const say = err ? "Non riesco a caricare i dati del CSI." : siriText(data)
  Script.setShortcutOutput(say)
  if (config.runsWithSiri) Speech.speak(say)
} else if (config.runsInWidget || config.runsInAccessoryWidget) {
  const view = params.vista || CONFIG.vista
  Script.setWidget(err ? errorWidget(err) : await buildWidget(data, config.widgetFamily || "medium", view))
  if (data && !data.fromCache && CONFIG.calendarioAuto) { try { await syncCalendar(data, true) } catch (e) { console.log(`Calendario: ${e}`) } }
} else if (config.runsInApp) {
  const code = (args.queryParameters || {}).partita
  const match = data && code ? data.matches.find(m => m.code === code) : null
  if (match) await showMatch(data, match)
  else await appMenu(data, err)
}
Script.complete()

// ───────────────────────── dati ─────────────────────────

async function getData(url) {
  const fm = FileManager.local()
  const cache = fm.joinPath(fm.cacheDirectory(), `csi-volley-${hash(url)}.json`)
  try {
    const html = await fetchHTML(url)
    const d = parsePage(html)
    if (!d.standings.length && !d.matches.length) throw new Error("Nessun dato trovato nella pagina")
    fm.writeString(cache, JSON.stringify(d))
    return finalize(d, false)
  } catch (e) {
    if (fm.fileExists(cache)) {
      const d = JSON.parse(fm.readString(cache))
      d.error = e.message || String(e)
      return finalize(d, true)
    }
    throw e
  }
}

function finalize(d, fromCache) {
  d.fromCache = fromCache
  if (CONFIG.titolo || params.titolo) d.title = params.titolo || CONFIG.titolo
  // risolve il nome della squadra scritto dall'utente su quello ufficiale
  if (TEAM) {
    const n = norm(TEAM)
    const names = d.standings.map(s => s.name).concat(d.matches.flatMap(m => [m.home, m.away]))
    TEAM = names.find(x => norm(x) === n) || names.find(x => norm(x).includes(n)) || TEAM
  }
  try { updateHistory(d, fromCache) } catch (e) { d.prevPos = null }
  return d
}

// Salva la classifica di ogni giornata; le frecce confrontano con la giornata precedente
function updateHistory(d, fromCache) {
  const fm = FileManager.local()
  const p = fm.joinPath(fm.cacheDirectory(), `csi-history-${hash(URL_GIRONE)}.json`)
  let h = { states: [] }
  if (fm.fileExists(p)) { try { h = JSON.parse(fm.readString(p)) } catch (e) {} }
  const last = d.matches.filter(m => m.sets).sort((a, b) => b.ts - a.ts)[0]
  const key = last ? last.giornata : ""
  if (!fromCache && key && d.standings.length) {
    const pos = {}
    d.standings.forEach(s => pos[s.name] = s.pos)
    const i = h.states.findIndex(x => x.key === key)
    if (i >= 0) h.states[i].pos = pos; else h.states.push({ key, pos })
    h.states = h.states.slice(-30)
    fm.writeString(p, JSON.stringify(h))
  }
  const i = h.states.findIndex(x => x.key === key)
  d.prevPos = i > 0 ? h.states[i - 1].pos : null
}

async function fetchHTML(url) {
  const r = new Request(url)
  r.timeoutInterval = 20
  r.headers = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    "Accept-Language": "it-IT,it;q=0.9",
  }
  const html = await r.loadString()
  if (r.response && r.response.statusCode >= 400) throw new Error(`HTTP ${r.response.statusCode}`)
  return html
}

function parsePage(html) {
  const standings = parseStandings(html)
  const teamNames = [...new Set(standings.map(s => s.name))].sort((a, b) => b.length - a.length)
  const matches = parseMatches(html, teamNames)
  const names = [...new Set(teamNames.concat(matches.flatMap(m => [m.home, m.away])))]
  // fase a eliminazione (coppe, fasi finali): turni con un nome invece delle giornate; l'eventuale tabella
  // della pagina è solo un riepilogo, non una classifica
  const ko = matches.some(m => m.giornata && !/^(Andata|Ritorno) \d+$/.test(m.giornata))
  return {
    title: parseTitle(html),
    ko,
    standings: ko ? [] : standings,
    matches,
    logos: parseLogos(html, names),
    info: parseTeamsInfo(html, names),
    fetched: Date.now(),
  }
}

function parseTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  let t = m ? strip(m[1]) : ""
  t = t.replace(/^.*\bCSI\s+\S+\s+/i, "").replace(/^Pvo\s+/i, "").trim()
  // calcio: "Cal Dilettanti A 11 Gruppo B C" → "Dilettanti B C" (poi "· Girone C")
  if (CALCIO) t = t.replace(/^Cal\s+/i, "").replace(/\bA\s+\d+\s+/i, "").replace(/\bGruppo\s+/i, "").trim()
  const g = t.match(/^(.*\S)\s+([A-Z])$/)
  return g ? `${g[1]} · Girone ${g[2]}` : (t || "Girone CSI")
}

// Classifica: prima prova come <table>, altrimenti legge la sequenza di testi
// "# Squadra Pt PG V P SV SP PF PS QS QP" seguita dalle righe, qualunque sia il markup.
function parseStandings(html) {
  return standingsFromTable(html) || standingsFromChunks(html) || []
}

function standingsFromTable(html) {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || []
  const table = tables.find(t => { const x = strip(t); return /\bSquadra\b/i.test(x) && /\bPt\b/.test(x) })
  if (!table) return null
  const out = []
  let head = null
  for (const row of table.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
    const cells = (row.match(/<t[hd]\b[^>]*>[\s\S]*?<\/t[hd]>/gi) || []).map(strip)
    if (!cells.length) continue
    if (!head) { if (cells.some(c => /^squadra$/i.test(c))) head = cells.map(c => c.toUpperCase()); continue }
    const s = makeStanding(head, cells, out.length)
    if (s) out.push(s)
  }
  return out.length ? out : null
}

function standingsFromChunks(html) {
  const ch = chunks(html)
  for (let i = 0; i < ch.length; i++) {
    if (!/^squadra$/i.test(ch[i])) continue
    // intestazioni: da "Squadra" fino al primo numero (la posizione della 1ª riga)
    let j = i + 1
    const labels = []
    while (j < ch.length && !/^\d+$/.test(ch[j]) && labels.length < 20) labels.push(ch[j++])
    if (!labels.some(l => /^pt$/i.test(l))) continue
    const head = ["#", "SQUADRA", ...labels.map(l => l.toUpperCase())]
    const H = head.length
    const out = []
    while (j + H <= ch.length && /^\d+$/.test(ch[j]) && !/^[\d,.\-]+$/.test(ch[j + 1])) {
      const s = makeStanding(head, ch.slice(j, j + H), out.length)
      if (!s) break
      out.push(s)
      j += H
    }
    if (out.length) return out
  }
  return null
}

function makeStanding(head, cells, idx) {
  const o = {}
  head.forEach((h, i) => o[h] = cells[i])
  const name = o.SQUADRA
  if (!name || /^[\d,.\-]+$/.test(name)) return null
  return {
    pos: parseInt(o["#"]) || idx + 1,
    name,
    pt: num(o.PT), pg: num(o.PG), v: num(o.V), p: num(o.P),
    sv: num(o.SV), sp: num(o.SP), pf: num(o.PF), ps: num(o.PS),
    qs: num(o.QS),
    n: num(o.N), gf: num(o.GF), gs: num(o.GS), dr: num(o.DR), // calcio
  }
}

// Ogni partita è un link .../P2026302DA0104/...; testo: "07/10/26 21:15 <cod> Casa <cod> Ospite [parziali...] setCasa setOspite"
function parseMatches(html, teamNames) {
  const heads = []
  let m
  // intestazioni dei turni: "Andata giornata 3" diventa "Andata 3"; nelle fasi finali e nelle coppe
  // il nome del turno resta com'è ("Primo turno", "Quarti", "Finale 1°- 2° Posto")
  const lre = /<div class="label-giornata[^"]*">\s*<label>([^<]*)<\/label>/gi
  while ((m = lre.exec(html))) {
    const t = decode(m[1]).replace(/\s+/g, " ").trim(), g = t.match(/^(Andata|Ritorno)\s+giornata\s+(\d+)$/i)
    heads.push({ i: m.index, label: g ? `${g[1][0].toUpperCase()}${g[1].slice(1).toLowerCase()} ${g[2]}` : t })
  }
  const hre = heads.length ? /$^/g : /(Andata|Ritorno)\s+giornata\s+(\d+)/gi
  while ((m = hre.exec(html))) heads.push({ i: m.index, label: `${m[1]} ${m[2]}` })

  const out = [], seen = new Set()
  // codici partita: P2026302DA0104 (campionati), P2026701T1001514 (coppe), P2025302T16OT007 (fasi finali)
  const are = /<a\b[^>]*?href\s*=\s*["']([^"']*\/(P\d{5,}[A-Z0-9]{3,})\/[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  while ((m = are.exec(html))) {
    const code = m[2]
    if (seen.has(code)) continue
    const t = strip(m[3])
    let dm = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2})[:.](\d{2})\s+(.*)$/)
    // data ancora da definire ("  /  /   16:30", es. partita rinviata): la data si prende dopo dalla sua giornata
    const tbdm = !dm && t.match(/^\/\s*\/\s+(\d{1,2})[:.](\d{2})\s+(.*)$/)
    if (!dm && !tbdm) continue
    if (tbdm) dm = [null, 0, 0, 0, tbdm[1], tbdm[2], tbdm[3]]
    seen.add(code)
    let y = +dm[3]; if (y < 100) y += 2000
    const ts = tbdm ? 0 : new Date(y, +dm[2] - 1, +dm[1], +dm[4], +dm[5]).getTime()
    // ogni dato sta nel suo elemento: squadre e punteggi restano separati
    let home, away, nums
    const parts = chunks(m[3])
      .map(c => c.replace(/^\d{7,9}\s+/, "").replace(/\s+\d{7,9}$/, ""))
      .filter(c => !/^\d{7,9}$/.test(c))
      .filter(c => !/^\d{1,2}\/\d{1,2}\/\d{2,4}(\s+\d{1,2}[:.]\d{2})?$/.test(c) && !/^\d{1,2}[:.]\d{2}$/.test(c))
      .filter(c => !/^[\s\/]+$/.test(c) && !/style\s*=|^["']/.test(c)) // data "  /  /" e resti di avvisi
    const nameIdx = parts.map((c, i) => /^(\d+|[-–]|vs\.?)$/i.test(c) ? -1 : i).filter(i => i >= 0)
    if (nameIdx.length >= 2) {
      home = parts[nameIdx[0]]; away = parts[nameIdx[1]]
      nums = parts.slice(nameIdx[1] + 1).filter(c => /^\d+$/.test(c)).map(Number)
    } else {
      const sp = splitTeams(dm[6], teamNames)
      home = sp.home; away = sp.away
      nums = (sp.tail.match(/\d+/g) || []).map(Number)
    }
    let sets = null
    const parziali = []
    if (nums.length >= 2 && CALCIO) {
      // calcio: gol, anche 0-0 e oltre 7; niente parziali
      sets = [nums[nums.length - 2], nums[nums.length - 1]]
    } else if (nums.length >= 2) {
      const a = nums[nums.length - 2], b = nums[nums.length - 1]
      if (a <= 7 && b <= 7 && a + b > 0) {
        sets = [a, b]
        const p = nums.slice(0, -2)
        for (let k = 0; k + 1 < p.length; k += 2) parziali.push([p[k], p[k + 1]])
      }
    }
    const h = heads.filter(x => x.i < m.index).pop()
    // attributi del link: campo di gioco (data-bs-title) e avvisi; punteggio in rosso (text-danger) = ufficioso
    const tag = m[0].slice(0, m[0].indexOf(">") + 1)
    const title = decode((tag.match(/data-bs-title\s*=\s*(["'])([\s\S]*?)\1/i) || [])[2] || "")
    const campo = title.replace(/\s*\([^)]*\)\s*$/, "").trim()
    const variaz = (m[3].match(/Variazione di campo\.?\s*([^"'<]*)/i) || [])[1]
    const ufficioso = !!sets && /text-danger/i.test(m[3])
    const o = { code, ts, home, away, sets, parziali, ufficioso, campo, variazione: variaz ? variaz.trim() : "", giornata: h ? h.label : "", href: absUrl(decode(m[1])) }
    if (tbdm) { o.tbd = true; o.tbdTime = [+dm[4], +dm[5]] }
    // "DCR" = dopo calci di rigore: il punteggio mostrato dal sito è quello dei rigori
    if (sets && />\s*(<br\s*\/?>)?\s*DCR\s*</i.test(m[3])) o.dcr = true
    out.push(o)
  }
  // partite senza data: si mettono nel giorno della loro giornata (solo per l'ordine), segnate "da definire"
  for (const o of out.filter(x => x.tbd)) {
    const ref = out.filter(x => !x.tbd && x.giornata === o.giornata).sort((a, b) => a.ts - b.ts)[0]
    if (ref) { const dt = new Date(ref.ts); dt.setHours(o.tbdTime[0], o.tbdTime[1], 0, 0); o.ts = dt.getTime() }
    delete o.tbdTime
  }
  return out.filter(x => x.ts > 0).sort((a, b) => a.ts - b.ts)
}

function splitTeams(s, teams) {
  const segs = s.split(/\b\d{7,9}\b/).map(x => x.trim()).filter(Boolean) // i codici societari separano le squadre
  let home, rest
  if (segs.length >= 2) { home = segs[0]; rest = segs.slice(1).join(" ") }
  else [home, rest] = takeTeam(s, teams)
  const [away, tail] = takeTeam(rest, teams)
  return { home, away, tail }
}

function takeTeam(s, teams) {
  const low = s.toLowerCase()
  for (const t of teams) {
    const tl = t.toLowerCase()
    if (low === tl || low.startsWith(tl + " ")) return [s.slice(0, t.length), s.slice(t.length).trim()]
  }
  const tok = s.split(" "), tail = []
  while (tok.length > 1 && /^(\d+|-)$/.test(tok[tok.length - 1])) tail.unshift(tok.pop())
  return [tok.join(" "), tail.join(" ")]
}

// ───────────────────────── loghi ─────────────────────────

// Nella sezione "Squadre iscritte" ogni logo <img> precede il nome della squadra
function parseLogos(html, teamNames) {
  const byNorm = {}
  teamNames.forEach(n => byNorm[norm(n)] = n)
  const map = {}
  let pending = null, ttl = 0
  const tokens = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .split(/(<img\b[^>]*>)|<[^>]*>/)
  for (const tk of tokens) {
    if (!tk) continue
    if (/^<img\b/i.test(tk)) {
      const src = (tk.match(/\bsrc\s*=\s*["']([^"']+)["']/i) || [])[1]
      pending = src && /\/logo\//i.test(src) && !/\.svg(\?|$)/i.test(src) ? absUrl(decode(src)) : null
      ttl = 6
      continue
    }
    const t = decode(tk).replace(/\s+/g, " ").trim()
    if (!t || !pending) continue
    const name = byNorm[norm(t)]
    if (name) { if (!map[name]) map[name] = pending; pending = null }
    else if (--ttl <= 0) pending = null
  }
  return map
}

async function loadLogos(d) {
  const fm = FileManager.local()
  const names = allTeams(d)
  const out = {}
  await Promise.all(names.map(async n => {
    const url = CONFIG.loghi && d.logos ? d.logos[n] : null
    if (url) {
      const p = fm.joinPath(fm.cacheDirectory(), `csi-logo64-${hash(url)}.png`)
      try {
        if (fm.fileExists(p)) { out[n] = fm.readImage(p); return }
        const r = new Request(url); r.timeoutInterval = 10
        const img = badge(await r.loadImage())
        fm.writeImage(p, img)
        out[n] = img
        return
      } catch (e) { /* usa il badge con le iniziali */ }
    }
    out[n] = avatar(n)
  }))
  return out
}

// Logo dentro un cerchio bianco, ridimensionato (risparmia memoria al widget)
function badge(img) {
  const S = 64, ctx = new DrawContext()
  ctx.size = new Size(S, S); ctx.opaque = false; ctx.respectScreenScale = false
  ctx.setFillColor(Color.white()); ctx.fillEllipse(new Rect(0, 0, S, S))
  const box = S * 0.7, k = Math.min(box / img.size.width, box / img.size.height)
  const w = img.size.width * k, h = img.size.height * k
  ctx.drawImageInRect(img, new Rect((S - w) / 2, (S - h) / 2, w, h))
  return ctx.getImage()
}

function avatar(name) {
  const palette = ["#2563EB", "#7C3AED", "#DB2777", "#0891B2", "#059669", "#D97706", "#DC2626", "#4F46E5", "#0D9488", "#9333EA"]
  const words = String(name).split(/[\s.\-]+/).filter(w => /[a-z]/i.test(w))
  const ini = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] || "?").slice(0, 2)).toUpperCase()
  const S = 64, ctx = new DrawContext()
  ctx.size = new Size(S, S); ctx.opaque = false; ctx.respectScreenScale = false
  ctx.setFillColor(new Color(palette[parseInt(hash(name), 36) % palette.length]))
  ctx.fillEllipse(new Rect(0, 0, S, S))
  ctx.setFont(Font.boldRoundedSystemFont(25)); ctx.setTextColor(Color.white()); ctx.setTextAlignedCenter()
  ctx.drawTextInRect(ini, new Rect(0, 17, S, 34))
  return ctx.getImage()
}

function logo(stack, name, size) {
  const img = LOGOS[name] || (LOGOS[name] = avatar(name))
  const i = stack.addImage(img)
  i.imageSize = new Size(size, size)
  i.cornerRadius = size / 2
  return i
}

// ───────────────────────── widget ─────────────────────────

async function buildWidget(d, family, view) {
  FAMILY = family
  const w = new ListWidget()
  w.url = URL_GIRONE
  w.refreshAfterDate = new Date(Date.now() + CONFIG.aggiornaOgniMin * 60000)
  if (family.startsWith("accessory")) return accessoryLayout(w, d, family, view)
  LOGOS = await loadLogos(d)
  TREND = d.prevPos
  w.backgroundColor = C.bg
  w.setPadding(12, PAD, 12, PAD)
  const layouts = {
    classifica: [standingsSmall, standingsMedium, standingsLarge],
    risultati: [resultsSmall, resultsMedium, resultsLarge],
    squadra: [teamSmall, teamMedium, teamLarge],
  }[view] || [standingsSmall, standingsMedium, standingsLarge]
  // coppe e fasi finali: niente classifica, al suo posto il tabellone del turno
  if (d.ko && layouts[0] === standingsSmall) layouts.splice(0, 3, koRankSmall, koRankMedium, koRankLarge)
  // formati oltre il grande (extra large su iPad, verticale alto di iOS 27…): panoramica
  if (!["small", "medium", "large"].includes(family)) { dashboard(w, d); footer(w, d); return w }
  if (view === "panoramica") {
    // senza squadra la panoramica piccola e media ripiegano sulla classifica
    const noTeam = !TEAM || (!myStanding(d) && !d.matches.some(isMyMatch))
    const fs = noTeam ? (d.ko ? [koRankSmall, koRankMedium, panoramaLarge] : [standingsSmall, standingsMedium, panoramaLarge]) : [panoramaSmall, panoramaMedium, panoramaLarge]
    fs[family === "small" ? 0 : family === "medium" ? 1 : 2](w, d)
    footer(w, d)
    return w
  }
  if (view === "ultima") {
    if (!TEAM || !d.matches.some(isMyMatch)) return noTeamWidget(w)
    const t = teamData(d)
    // la pagina della partita serve a medio e grande, e al piccolo del calcio (marcatori e primo tempo)
    const info = t.last && (family !== "small" || CALCIO) ? await getMatchInfo(t.last) : { events: [], prev: [] }
    // ai rigori il sito mostra il punteggio dei rigori: il risultato vero si conta dai gol della cronaca
    if (t.last && t.last.dcr) {
      const gl = info.events.filter(e => e.type === "gol")
      if (gl.length) t.last.real = [gl.filter(e => e.side === "home").length, gl.filter(e => e.side === "away").length]
    }
    ;[lastSmall, lastMedium, lastLarge][family === "small" ? 0 : family === "medium" ? 1 : 2](w, d, t, info)
    footer(w, d)
    return w
  }
  if (view === "squadra" && !myStanding(d) && !d.matches.some(isMyMatch)) return noTeamWidget(w)
  layouts[family === "small" ? 0 : family === "medium" ? 1 : 2](w, d)
  footer(w, d)
  return w
}

// ── classifica ──

function standingsSmall(w, d) {
  header(w, d, "Classifica", true)
  w.addSpacer(6)
  const rows = pickStandings(d, 5)
  const avail = WIDE * 0.467 - 58 // altezza utile del piccolo (quadrato)
  const col = w.addStack(); col.layoutVertically()
  col.spacing = Math.max(2, Math.min(10, (avail - rows.length * 16) / Math.max(1, rows.length - 1)))
  const ns = rowNameSize(rows, INNER_SMALL)
  for (const s of rows) panoStandingRow(col, s, ns)
  w.addSpacer()
}

function standingsMedium(w, d) {
  header(w, d, "Classifica", true)
  w.addSpacer()
  const s = d.standings.slice(0, 12)
  const per = Math.ceil(s.length / 2)
  const row = w.addStack(); row.topAlignContent(); row.spacing = 12
  // altezza utile del medio, tolta l'intestazione (~30) e il suo stacco: le righe si distribuiscono su quella
  const avail = MED.h - 30
  const gap = Math.max(1, Math.min(10, (avail - per * 14) / Math.max(1, per - 1)))
  const ns = rowNameSize(s, (INNER - 12) / 2)
  for (const part of [s.slice(0, per), s.slice(per)]) {
    const c = row.addStack(); c.layoutVertically(); c.spacing = gap
    for (const x of part) panoStandingRow(c, x, ns)
  }
  w.addSpacer()
}

function standingsLarge(w, d) {
  header(w, d, "Classifica", false, true)
  const rows = d.standings.slice(0, 14)
  const n = rows.length
  // fino a 10 squadre come sempre; con più squadre righe più basse, così entrano intestazione e "Aggiornata a"
  w.addSpacer(n > 10 ? 4 : 8)
  standingsTable(w, rows, n > 11 ? 11 : 12, n <= 10 ? 3 : n === 11 ? 2 : n === 12 ? 1 : 0)
  w.addSpacer()
  const last = played(d)[0]
  if (last && last.giornata) {
    const f = w.addStack(); f.addSpacer()
    txt(f, `Aggiornata a: ${prettyGiornata(last.giornata)}`, 9, C.sub)
    f.addSpacer()
  }
}

function standingsTable(w, rows, size, vpad) {
  // calcio: stesse 6 colonne del volley (con 8 i nomi non entrerebbero): N al posto dei set, DR = differenza reti
  const cols = CALCIO ? [["PT", "pt"], ["G", "pg"], ["V", "v"], ["N", "n"], ["P", "p"], ["DR", "dr"]]
    : [["PT", "pt"], ["G", "pg"], ["V", "v"], ["P", "p"], ["SV", "sv"], ["SP", "sp"]]
  const cw = size * 1.75
  const h = w.addStack(); h.centerAlignContent(); h.spacing = 4; h.setPadding(0, 5, 0, 5)
  cell(h, "#", size * 1.6, Font.semiboldSystemFont(9), C.sub, "center")
  h.addSpacer(size * 0.8 + 4)
  h.addSpacer(size + 7)
  txt(h, "SQUADRA", 9, C.sub, "semibold")
  h.addSpacer()
  for (const [l] of cols) cell(h, l, cw, Font.semiboldSystemFont(9), C.sub, "center")
  w.addSpacer(4)
  const list = w.addStack(); list.layoutVertically(); list.spacing = 2
  rows.forEach((s, i) => {
    const r = list.addStack(); r.centerAlignContent(); r.spacing = 4
    r.setPadding(vpad, 5, vpad, 5); r.cornerRadius = 7
    const mine = isMine(s.name)
    r.backgroundColor = mine ? C.hl : (i % 2 === 0 ? C.stripe : C.bg)
    posBadge(r, s.pos, size * 1.6, size)
    trend(r, s, size)
    logo(r, s.name, size + 6)
    const n = txt(r, s.name, size, mine ? C.hlText : C.text, mine ? "bold" : "regular")
    n.minimumScaleFactor = 0.85
    r.addSpacer()
    cols.forEach(([, k], j) => cell(r, k === "dr" && s[k] > 0 ? `+${s[k]}` : s[k], cw, j === 0 ? ptsFont(s, size + 1) : Font.systemFont(size - 1), j === 0 ? ptsColor(s) : C.sub, "center"))
  })
}

// Dimensione unica dei nomi, scelta sul più lungo, perché entrino tutti nella colonna
function fitNames(rows, width, size, logoSize) {
  const free = width - size * 1.6 - (TREND ? size * 0.8 + 3 : 0) - logoSize - size * 1.5 - 4 * 3 - 8
  const longest = Math.max(1, ...rows.map(r => r.name.length))
  return Math.max(8, Math.min(size, Math.floor(free / (longest * 0.53) * 2) / 2))
}

function standingRowCompact(stack, s, width, size, logoSize, nameSize) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 3
  const mine = isMine(s.name)
  if (mine) { r.backgroundColor = C.hl; r.cornerRadius = 5 }
  posBadge(r, s.pos, size * 1.6, size - 1)
  if (TREND) trend(r, s, size - 1)
  logo(r, s.name, logoSize)
  const n = txt(r, s.name, nameSize || size, mine ? C.hlText : C.text, mine ? "bold" : "regular")
  n.minimumScaleFactor = 0.85
  r.addSpacer()
  cell(r, s.pt, size * 1.5, ptsFont(s, size), ptsColor(s), "center")
}

// ▲ salita / ▼ discesa rispetto alla fine della giornata precedente
function trend(stack, s, size) {
  const prev = TREND ? TREND[s.name] : null
  const delta = prev ? prev - s.pos : 0
  cell(stack, delta > 0 ? "▲" : delta < 0 ? "▼" : "", size * 0.8, Font.systemFont(size - 4), delta > 0 ? C.win : C.lose, "center")
}

// Punti: in evidenza la propria squadra e la capolista, grigi gli zeri
function ptsColor(s) { return isMine(s.name) ? C.hlText : s.pt > 0 ? C.text : C.sub }
function ptsFont(s, size) { return isMine(s.name) || s.pos === 1 ? Font.boldRoundedSystemFont(size) : s.pt > 0 ? Font.semiboldRoundedSystemFont(size) : Font.mediumRoundedSystemFont(size) }

function posBadge(stack, pos, width, size) {
  cell(stack, pos, width, Font.boldRoundedSystemFont(size), pos === 1 ? C.accent : C.sub, "center", true)
}

// ── risultati ──

function resultsSmall(w, d) {
  const g = currentGiornata(d)
  const label = g.cur ? g.cur.label : ""
  const gn = String(label).match(/(\d+)\s*$/)
  header(w, d, !label ? "Risultati" : gn ? `Giornata ${gn[1]}` : roundTitle(label), true)
  w.addSpacer()
  // coppe: tante sfide per turno, quella della squadra seguita non resta mai fuori
  const ms = d.ko ? pickMatches(roundList(d, g.cur), 5) : roundList(d, g.cur).slice(0, 5)
  if (!ms.length) { txt(w, "Nessuna partita", F_TXT, C.sub); w.addSpacer(); return }
  const ab = shortNames(allTeams(d))
  const list = w.addStack(); list.layoutVertically(); list.spacing = 3
  for (const m of ms) roundRowSmall(list, m, ab)
  // coppe: turno con poche partite (es. la finale): sotto il turno prima
  let left = 5 - ms.length
  for (const x of earlierRounds(d, g.cur)) {
    if (left < 2) break
    const sh = pickMatches(roundList(d, x), left - 1)
    left -= 1 + sh.length
    sectionLabel(list, roundTitle(x.label))
    for (const m of sh) roundRowSmall(list, m, ab)
  }
  w.addSpacer()
}

// Partita della giornata in una riga: logo, nome breve, punteggio (o data/ora), nome breve, logo.
// Riga gialla se gioca la squadra seguita, punteggio rosso se non ancora ufficiale.
function roundRowSmall(stack, m, ab, width) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 2; r.setPadding(2, 3, 2, 3); r.cornerRadius = 6
  r.backgroundColor = isMyMatch(m) ? C.hl : C.stripe
  const hw = m.sets && m.sets[0] > m.sets[1], aw = m.sets && m.sets[1] > m.sets[0]
  // i due lati hanno la stessa larghezza fissa, così il punteggio resta sempre centrato
  const CHIP = 30, SIDE = Math.floor(((width || INNER_SMALL) - 6 - CHIP - 4) / 2)
  const side = (name, win, lose, isHome) => {
    const sd = r.addStack(); sd.size = new Size(SIDE, 0); sd.centerAlignContent(); sd.spacing = 3
    const mine = isMine(name)
    const put = () => {
      const t = sd.addText(ab[name] || name)
      t.font = win || mine ? Font.semiboldSystemFont(9.5) : Font.systemFont(9.5)
      t.textColor = mine ? C.hlText : lose ? C.sub : C.text
      t.lineLimit = 1; t.minimumScaleFactor = 0.85
    }
    // senza loghi: il nome, più lungo, sta al centro della sua metà (niente spaziatori: iOS ne riserva una larghezza minima)
    put()
  }
  side(m.home, hw, aw, true)
  const c = r.addStack(); c.size = new Size(CHIP, 0); c.centerAlignContent(); c.cornerRadius = 4; c.setPadding(1, 0, 1, 0)
  if (m.sets || m.chipLines) c.backgroundColor = C.chip
  else { c.borderColor = C.chip; c.borderWidth = 1 }
  if (m.chipLines) {
    // andata e ritorno: un punteggio per riga
    c.layoutVertically()
    for (const l of m.chipLines) {
      const lr = c.addStack(); lr.size = new Size(CHIP, 0); lr.centerAlignContent()
      const lt = lr.addText(l); lt.font = /^\d+-\d+$|^r /.test(l) ? Font.boldRoundedSystemFont(8) : Font.mediumSystemFont(7.5)
      lt.textColor = /^\d+-\d+$|^r /.test(l) ? (m.ufficioso ? C.uff : C.text) : C.sub; lt.lineLimit = 1; lt.minimumScaleFactor = 0.75
    }
    side(m.away, aw, hw, false)
    return
  }
  const ct = c.addText(m.sets ? `${m.sets[0]}-${m.sets[1]}` : shortWhen(m))
  ct.font = m.sets ? Font.boldRoundedSystemFont(F_SUB) : Font.mediumSystemFont(8.5)
  ct.textColor = m.sets ? (m.ufficioso ? C.uff : C.text) : C.sub; ct.lineLimit = 1; ct.minimumScaleFactor = 0.8
  side(m.away, aw, hw, false)
}

// Nomi brevi (al massimo 7 caratteri), riconoscibili e tutti diversi tra loro:
// "Pol.Com.Tavernola" → "Tavern.", "Pcq 1971" → "Pcq", "Volley 2c" → "Vol. 2c", "San Pancrazio" → "S.Panc."
function shortNames(names) {
  const GENERIC = /^(pol|polisportiva|com|or|oratorio|gso|gs|us|as|asd|ssd|a\.s\.d|s\.s\.d|volley|pallavolo|pvo|team|sport|ac|sc|usd|cs|csi)$/i
  const GENERIC_CALCIO = /^(calcio|virtus|nova|real|atletico|sporting|fc|ssd|polisp|st|sant|santo|la|il|lo)$/i
  const MAX = 11 // senza loghi nel piccolo c'è posto per una parola intera (es. "S.Pancrazio", "Tavernola")
  const base = n => {
    const clean = String(n).trim()
    if (clean.length <= MAX) return clean
    const words = clean.split(/[\s.]+/).filter(Boolean)
    // calcio: anche "Calcio", "Virtus", "Nova"… sono parole comuni, resta il paese ("Credaro", "Montello")
    // sigla puntata iniziale di sole lettere ("A.C.D. Paratico"): non conta, "S.Marco" invece resta
    let lead = 0; while (lead < words.length && /^[a-z]$/i.test(words[lead])) lead++
    if (lead >= 2) words.splice(0, lead)
    const keep = words.filter(x => !GENERIC.test(x) && !(CALCIO && GENERIC_CALCIO.test(x)) && !/^\d{4}$/.test(x))
    const gen = words.filter(x => GENERIC.test(x))
    let out
    if (!keep.length) out = words[0]
    else if (keep.join(" ").length < 3 && gen.length) out = `${gen[0].slice(0, 3)}. ${keep.join(" ")}`
    else if (keep.length > 1 && keep[0].length <= 3) {
      // "San Pancrazio" → "S.Pancrazio"; se così è troppo lungo resta la parola intera ("Martinengo")
      out = `${keep[0][0]}.${keep[1]}`
      if (out.length > MAX) out = keep[1]
    }
    else out = keep[0]
    out = out.charAt(0).toUpperCase() + out.slice(1)
    // troppo lungo: si accorcia con il punto, come un'abbreviazione ("Zandobbio" → "Zandob.")
    return out.length <= MAX ? out : out.slice(0, MAX - 1).replace(/[.\s]+$/, "") + "."
  }
  const res = {}, used = {}
  for (const n of names) {
    let a = base(n), k = 2
    while (used[a.toLowerCase()]) { a = base(n).replace(/\.$/, "").slice(0, MAX - 1) + k; k++ }
    used[a.toLowerCase()] = true
    res[n] = a
  }
  return res
}

function resultsMedium(w, d) {
  const g = currentGiornata(d)
  header(w, d, g.cur ? prettyGiornata(g.cur.label) : "Risultati", true)
  w.addSpacer()
  const list = w.addStack(); list.layoutVertically(); list.spacing = 2
  const ms = roundList(d, g.cur)
  const shown = d.ko ? pickMatches(ms, 5) : ms.slice(0, 5), lay = rowLayout(shown, INNER, F_TXT)
  lay.nameSize = Math.min(lay.nameSize, F_TXT)
  shown.forEach(m => matchRow(list, m, INNER, F_TXT, false, true, lay))
  if (!ms.length) txt(list, "Nessuna partita", F_TXT, C.sub)
  // coppe: se il turno ha poche partite (es. la finale) sotto c'è il turno prima; l'etichetta vale una riga
  let left = 5 - shown.length
  for (const x of earlierRounds(d, g.cur)) {
    if (left < 2) break
    const sh = pickMatches(roundList(d, x), left - 1)
    left -= 1 + sh.length
    list.addSpacer(2)
    sectionLabel(list, roundTitle(x.label))
    const ly = rowLayout(sh, INNER, F_TXT); ly.nameSize = Math.min(ly.nameSize, F_TXT)
    sh.forEach(m => matchRow(list, m, INNER, F_TXT, false, true, ly))
  }
  w.addSpacer()
}

function resultsLarge(w, d) {
  const g = currentGiornata(d)
  header(w, d, d.ko ? "Tabellone" : "Risultati", false, true)
  w.addSpacer(6)
  // altezze misurate sul 12 Pro: riga 19 punti, con i parziali 30; 3 tra le righe; etichetta 14
  const withP = params.parziali !== "no"
  const rowH = m => (withP && m.parziali.length ? 30 : 19) + 3
  let budget = LRG.h - 30 - 6
  if (g.cur) {
    budget -= 14
    const ms = []
    const all = roundList(d, g.cur)
    for (const m of pickMatches(all, all.length)) { if (budget - rowH(m) < 0) break; budget -= rowH(m); ms.push(m) }
    const cur = pickMatches(all, ms.length)
    sectionLabel(w, prettyGiornata(g.cur.label))
    w.addSpacer(3)
    const list = w.addStack(); list.layoutVertically(); list.spacing = 3
    const lay = rowLayout(cur, LRG.w, 11)
    cur.forEach(m => matchRow(list, m, LRG.w, 11, withP, true, lay))
  }
  // coppe: sotto il turno mostrato, quello dopo (se c'è) e poi i turni prima, finché c'è posto
  // (es. Finale, Semifinali, Quarti…)
  if (d.ko && g.cur) {
    const all = giornate(d), i = all.findIndex(x => x.label === g.cur.label)
    const more = (g.next ? [g.next] : []).concat(all.slice(0, Math.max(0, i)).reverse())
    for (const x of more) {
      const list0 = roundList(d, x)
      if (budget - 6 - 14 - rowH(list0[0]) < 0) break
      budget -= 6 + 14
      const ms = []
      for (const m of pickMatches(list0, list0.length)) { if (budget - rowH(m) < 0) break; budget -= rowH(m); ms.push(m) }
      const show = pickMatches(list0, ms.length)
      w.addSpacer(6)
      sectionLabel(w, prettyGiornata(x.label))
      w.addSpacer(3)
      const list = w.addStack(); list.layoutVertically(); list.spacing = 3
      const lay = rowLayout(show, LRG.w, 11)
      show.forEach(m => matchRow(list, m, LRG.w, 11, withP, true, lay))
    }
    w.addSpacer()
    return
  }
  if (g.next && params.prossima !== "no") {
    budget -= 6 + 14
    const fit = Math.floor(budget / (19 + 3))
    if (fit >= 2) {
      w.addSpacer(6)
      sectionLabel(w, prettyGiornata(g.next.label))
      w.addSpacer(3)
      const list = w.addStack(); list.layoutVertically(); list.spacing = 3
      const nx = pickMatches(roundList(d, g.next), fit), lay = rowLayout(nx, LRG.w, 11)
      nx.forEach(m => matchRow(list, m, LRG.w, 11, true, true, lay))
    }
  }
  w.addSpacer()
}

// Le prime n partite della lista, ma quella della squadra seguita non resta mai fuori:
// se non rientra tra le prime n prende il posto dell'ultima (l'ordine resta quello del sito)
function pickMatches(list, n) {
  if (list.length <= n) return list.slice()
  const out = list.slice(0, n)
  const mine = list.find(isMyMatch)
  if (n > 0 && mine && !out.includes(mine)) {
    out[n - 1] = mine
    out.sort((a, b) => list.indexOf(a) - list.indexOf(b))
  }
  return out
}

// Larghezza stimata di un testo (punti), per decidere se entra prima di disegnarlo
function textW(str, size) { return String(str).length * size * 0.55 }

// Riga di classifica a due colonne del grande: colonnine di posizione e punti un po' più strette,
// così i nomi lunghi (es. "Montello Thunders") entrano interi alla grandezza normale
function largeStandingRow(stack, s, width, arrows) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 3; r.setPadding(0, 2, 0, 2)
  r.size = new Size(width, 0)
  const mine = isMine(s.name)
  if (mine) { r.backgroundColor = C.hl; r.cornerRadius = 5 }
  cell(r, s.pos, 14, Font.semiboldRoundedSystemFont(F_SUB), s.pos === 1 ? C.accent : C.sub, "center", true)
  // la colonnina delle frecce ▲▼ c'è solo quando almeno una squadra ha cambiato posizione
  if (arrows) trend(r, s, F_SUB)
  logo(r, s.name, 13)
  const n = txt(r, s.name, F_TXT, mine ? C.hlText : C.text, mine ? "bold" : "regular"); n.minimumScaleFactor = 0.9
  r.addSpacer()
  cell(r, s.pt, 14, ptsFont(s, F_TXT), ptsColor(s), "center")
}

// Partita su una riga: Casa [logo] [punteggio] [logo] Ospite (+ parziali sotto)
// Un'unica dimensione per tutti i nomi della lista, scelta sul nome più lungo,
// e chip stretto se nessuna partita deve mostrare la data
function rowLayout(list, width, size) {
  const needsDate = list.some(m => !m.sets && !isToday(m.ts))
  const chipLen = Math.max(0, ...list.map(m => m.chip ? m.chip.length : 0))
  const L = size + 4, sW = Math.max(size * (needsDate ? 5.4 : 3.8), chipLen * (size - 1) * 0.55 + 10)
  const nW = Math.floor((width - 10 - sW - 2 * L - 4 * 4) / 2)
  const longest = Math.max(1, ...list.flatMap(m => [m.home.length, m.away.length]))
  const nameSize = Math.max(8, Math.min(size, Math.floor(nW / (longest * 0.6) * 2) / 2))
  return { L, sW, nW, nameSize }
}

function matchRow(stack, m, width, size, withPartials, compact, lay) {
  lay = lay || rowLayout([m], width, size)
  const box = stack.addStack(); box.layoutVertically(); box.spacing = 1
  box.setPadding(compact ? 2 : 3, 5, compact ? 2 : 3, 5); box.cornerRadius = 7
  box.backgroundColor = isMyMatch(m) ? C.hl : C.stripe
  box.url = matchUrl(m)
  const r = box.addStack(); r.centerAlignContent(); r.spacing = 4
  const { L, sW, nW, nameSize: ns } = lay
  const hw = m.sets && m.sets[0] > m.sets[1], aw = m.sets && m.sets[1] > m.sets[0]
  cell(r, m.home, "flex", hw || isMine(m.home) ? Font.semiboldSystemFont(ns) : Font.systemFont(ns), isMine(m.home) ? C.hlText : (aw ? C.sub : C.text), "right")
  logo(r, m.home, L)
  scoreChip(r, m, sW, size)
  logo(r, m.away, L)
  cell(r, m.away, "flex", aw || isMine(m.away) ? Font.semiboldSystemFont(ns) : Font.systemFont(ns), isMine(m.away) ? C.hlText : (hw ? C.sub : C.text), "left")
  if (withPartials && m.parziali.length) {
    const p = box.addStack(); p.addSpacer()
    const t = p.addText(m.parziali.map(x => x.join("-")).join("  ·  "))
    t.font = Font.systemFont(size - 3); t.textColor = m.ufficioso ? C.uff : C.sub
    t.lineLimit = 1; t.minimumScaleFactor = 0.8
    p.addSpacer()
  }
}

function scoreChip(stack, m, width, size) {
  const s = stack.addStack(); s.size = new Size(width, 0); s.centerAlignContent()
  s.cornerRadius = 6; s.setPadding(1, 0, 1, 0)
  if (m.sets || m.chip) s.backgroundColor = C.chip
  else { s.borderColor = C.chip; s.borderWidth = 1.5 }
  // coppe: andata e ritorno nella stessa casella ("2-0 · 1-0", "1-2 · rig. 2-4", "2-0 · 21/10")
  const t = s.addText(m.chip || (m.sets ? `${m.sets[0]} - ${m.sets[1]}` : shortWhen(m, true)))
  t.font = m.chip ? Font.boldRoundedSystemFont(size - 1) : m.sets ? Font.boldRoundedSystemFont(size) : Font.mediumSystemFont(size - 1)
  t.textColor = m.sets || m.chip ? (m.ufficioso ? C.uff : C.text) : C.sub; t.lineLimit = 1; t.minimumScaleFactor = 0.8
}

// Stile tabellone: una riga per squadra con i set a destra
function scoreboard(stack, m, size, nameSize) {
  const ns = nameSize || size
  const box = stack.addStack(); box.layoutVertically(); box.spacing = 3
  box.setPadding(5, 6, 5, 6); box.cornerRadius = 8; box.backgroundColor = C.stripe
  ;[0, 1].forEach(side => {
    const name = side ? m.away : m.home
    const r = box.addStack(); r.centerAlignContent(); r.spacing = 5
    logo(r, name, size + 5)
    const won = m.sets && m.sets[side] > m.sets[1 - side]
    const t = txt(r, name, ns, isMine(name) ? C.hlText : (m.sets && !won ? C.sub : C.text), won || isMine(name) ? "bold" : "regular")
    t.minimumScaleFactor = 0.9
    r.addSpacer()
    if (m.sets) txt(r, m.sets[side], size + 1, m.ufficioso ? C.uff : won ? C.text : C.sub, won ? "bold" : "regular")
    // partita da giocare: giorno sulla prima riga, ora sulla seconda
    else txt(r, m.tbd ? (side ? "" : "da definire") : side ? fmtTime(m.ts) : isToday(m.ts) ? "oggi" : `${dayName(m.ts)} ${fmtDate(m.ts)}`, F_SUB, C.sub, "semibold")
  })
}

// ── lock screen ──

function accessoryLayout(w, d, family, view) {
  const me = myStanding(d)
  const leader = d.standings[0]
  const next = upcoming(d).find(m => !TEAM || isMyMatch(m))
  const last = played(d).find(m => !TEAM || isMyMatch(m))
  if (family === "accessoryInline") {
    if (view === "risultati" && last) w.addText(`${ICON} ${last.home} ${last.sets.join("-")} ${last.away}`)
    else if (koStatus(d)) w.addText(`${ICON} ${TEAM} · ${koStatus(d).text}`)
    else w.addText(me ? `${ICON} ${me.pos}° ${me.name} · ${me.pt} pt` : leader ? `${ICON} 1° ${leader.name} · ${leader.pt} pt` : `${ICON} CSI`)
  } else if (family === "accessoryCircular") {
    w.addAccessoryWidgetBackground = true
    const s = me || leader
    const t1 = w.addText(s ? `${s.pos}°` : "–"); t1.font = Font.boldRoundedSystemFont(20); t1.centerAlignText()
    const t2 = w.addText(s ? `${s.pt} pt` : ""); t2.font = Font.systemFont(10); t2.centerAlignText()
  } else {
    const t0 = w.addText(`${ICON} ${d.title}`); t0.font = Font.boldSystemFont(12); t0.lineLimit = 1
    const line = s => { const t = w.addText(s); t.font = Font.systemFont(11); t.lineLimit = 1; t.minimumScaleFactor = 0.7 }
    if (view === "risultati") {
      if (last) line(`${last.home} ${last.sets.join("-")} ${last.away}`)
      if (next) line(`${fmtDate(next.ts)} ${next.home} – ${next.away}`)
    } else if (me || koStatus(d)) {
      line(me ? `${me.pos}° ${me.name} · ${me.pt} pt` : `${TEAM} · ${koStatus(d).text}`)
      if (next) line(`${fmtDate(next.ts)} ${next.home} – ${next.away}`)
    } else {
      d.standings.slice(0, 2).forEach(s => line(`${s.pos}. ${s.name} · ${s.pt} pt`))
    }
  }
  return w
}

function errorWidget(e) {
  const w = new ListWidget()
  w.backgroundColor = C.bg
  w.url = URL_GIRONE
  w.refreshAfterDate = new Date(Date.now() + 15 * 60000)
  txt(w, `${ICON} CSI ${CALCIO ? "Calcio" : "Volley"}`, 13, C.text, "bold")
  w.addSpacer(4)
  txt(w, "Impossibile caricare i dati", 11, C.lose)
  txt(w, String(e.message || e), 9, C.sub).lineLimit = 3
  return w
}

// ───────────────────────── squadre iscritte ─────────────────────────

// "Squadre iscritte": nome, Colori, Giorno e Ora, palestra con indirizzo
function parseTeamsInfo(html, names) {
  const ch = chunks(html)
  const start = ch.findIndex(c => /^squadre iscritte$/i.test(c))
  if (start < 0) return {}
  const byNorm = {}
  names.forEach(n => byNorm[norm(n)] = n)
  const info = {}
  let cur = null, expect = null
  for (let i = start + 1; i < ch.length; i++) {
    const c = ch[i]
    if (/^(centro sportivo italiano|attivit[aà] sportive)/i.test(c)) break
    const nm = byNorm[norm(c)]
    if (nm) { cur = info[nm] = {}; expect = null; continue }
    if (!cur) continue
    let m
    if ((m = c.match(/^colori\s*:?\s*(.*)$/i))) { if (m[1]) cur.colori = m[1]; else expect = "colori"; continue }
    if ((m = c.match(/^giorno e ora\s*:?\s*(.*)$/i))) { if (m[1]) { cur.giorno = m[1]; expect = "palestra" } else expect = "giorno"; continue }
    if (expect) { cur[expect] = c; expect = expect === "giorno" ? "palestra" : null; continue }
  }
  return info
}

// La partita si gioca nella palestra della squadra di casa
// Campo di gioco: quello indicato sulla partita (vale anche per le variazioni), altrimenti la palestra della squadra di casa
function venueOf(d, m) {
  const home = ((d.info || {})[m.home] || {}).palestra || ""
  if (m.variazione || !home) return m.campo || titleCase(m.variazione) || home
  return home
}
function titleCase(s) { return String(s || "").toLowerCase().replace(/(^|[\s.,/'-])([a-zà-ù])/g, (a, b, c) => b + c.toUpperCase()) }
function venueCity(v) {
  const m = v.match(/\b\d{5}\s+(.+)$/)
  if (m) return m[1].trim()
  // senza CAP (campo scritto sulla partita): il paese dopo il numero civico ("Via Scirea. 1 Telgate" → "Telgate")
  const n = v.match(/\b(?:Via|Viale|V\.le|Piazza|P\.zza|Piazzale|Corso|C\.so|Strada)\b.*?\s\d+[a-z]?\s*,?\s+([A-ZÀ-Ý][^\d,]*)$/)
  return n ? n[1].trim() : ""
}
function venueName(v) { return v.split(/\s+(?=(?:Via|Viale|V\.le|Piazza|P\.zza|Piazzale|Corso|C\.so|Loc\.|Localit[aà]|Strada|Vicolo)\b)/i)[0].trim() }
function venueShort(v) { const n = venueName(v), c = venueCity(v); return c && !n.includes(c) ? `${n} · ${c}` : n }
// Percorso con l'app di navigazione predefinita di iPhone (Impostazioni → App → App predefinite → Navigazione).
// Si passa solo l'indirizzo: con il nome della palestra il navigatore farebbe una ricerca con più risultati.
function mapsUrl(v) { return `geo-navigation:///directions?destination=${encodeURIComponent(venueAddress(v))}` }
function venueAddress(v) {
  const clean = String(v || "").replace(/\s*\([^)]*\)\s*$/, "").replace(/^Variazione di campo\.?\s*/i, "").trim()
  const addr = clean.slice(venueName(clean).length).trim()
  return addr || clean
}
function navName() { return "Percorso" }

// ───────────────────────── vista squadra ─────────────────────────

function teamData(d) {
  const mine = d.matches.filter(isMyMatch)
  const pl = mine.filter(m => m.sets).sort((a, b) => b.ts - a.ts)
  // in fondo le partite con data da definire (es. rinviate): compaiono nel calendario ma non sono mai la "prossima"
  const up = upcoming(d).filter(isMyMatch).concat(mine.filter(m => m.tbd && !m.sets))
  return { me: myStanding(d), pl, up, last: pl[0], next: up.find(m => !m.tbd), form: pl.slice(0, 5).map(res) } // forma: la più recente a sinistra
}
function won(m) { return isMine(m.home) ? m.sets[0] > m.sets[1] : m.sets[1] > m.sets[0] }
// esito per la squadra seguita: "V" vittoria, "N" pareggio (solo calcio), "P" sconfitta
function res(m) { return m.sets[0] === m.sets[1] ? "N" : won(m) ? "V" : "P" }
function resColor(r) { return r === "V" ? C.win : r === "N" ? C.draw : C.lose }
// riga dei numeri della squadra: volley con i set, calcio con pareggi e gol
function statLine(me) {
  return CALCIO ? `V ${me.v} · N ${me.n} · P ${me.p} · gol ${me.gf}-${me.gs}` : `G ${me.pg} · V ${me.v} · P ${me.p} · set ${me.sv}-${me.sp}`
}
// data breve di una partita da giocare; "da def." se il sito non l'ha ancora fissata
function shortWhen(m, withTime) {
  if (m.tbd) return "da def."
  return isToday(m.ts) ? fmtTime(m.ts) : withTime ? `${fmtDate(m.ts)} ${fmtTime(m.ts)}` : fmtDate(m.ts)
}
function opp(m) { return isMine(m.home) ? m.away : m.home }
function myScore(m) { return isMine(m.home) ? `${m.sets[0]}-${m.sets[1]}` : `${m.sets[1]}-${m.sets[0]}` } // dal punto di vista della squadra (solo Siri)
function homeAway(m) { return `${m.sets[0]}-${m.sets[1]}` } // convenzione: sempre casa-ospite
// partita già iniziata (o finita) ma senza risultato sul sito: "risultato in arrivo" invece di "prossima · oggi"
function waiting(m) { return !!m && !m.sets && !m.tbd && m.ts <= Date.now() }
function nextLabel(m) { return waiting(m) ? "Oggi · risultato in arrivo" : `Prossima · ${countdown(m.ts)}` }
function countdown(ts) {
  const a = new Date(); a.setHours(0, 0, 0, 0)
  const b = new Date(ts); b.setHours(0, 0, 0, 0)
  const n = Math.round((b - a) / 864e5)
  return n <= 0 ? "oggi" : n === 1 ? "domani" : `tra ${n} giorni`
}

// Ultime 5 partite, la più recente a sinistra: V verde / N grigia / P rossa, caselle vuote finché non si gioca
function formDots(stack, form, size) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 3
  const l = txt(r, "FORMA", 9, C.sub, "semibold")
  r.addSpacer(3)
  for (let i = 0; i < 5; i++) {
    const f = form[i]
    const dot = r.addStack(); dot.size = new Size(size + 4, size + 4); dot.cornerRadius = (size + 4) / 2; dot.centerAlignContent()
    if (f === undefined) { dot.borderColor = C.chip; dot.borderWidth = 1.5; continue }
    dot.backgroundColor = resColor(f)
    const t = dot.addText(f); t.font = Font.boldRoundedSystemFont(size - 3); t.textColor = Color.white()
  }
  return r
}

function teamCard(stack, d, t, logoSize, width, tight) {
  const c = stack.addStack(); c.layoutVertically(); c.spacing = 3
  if (width) c.size = new Size(width, 0)
  const top = c.addStack(); top.centerAlignContent(); top.spacing = 8
  const ring = top.addStack(); ring.size = new Size(logoSize + 6, logoSize + 6); ring.cornerRadius = (logoSize + 6) / 2
  ring.borderColor = C.accent; ring.borderWidth = 2; ring.centerAlignContent()
  logo(ring, TEAM, logoSize)
  const nm = top.addStack(); nm.layoutVertically()
  const n = txt(nm, TEAM, 14, C.text, "bold"); n.minimumScaleFactor = 0.75
  if (t.me) {
    const p = nm.addStack(); p.bottomAlignContent(); p.spacing = 4
    txt(p, `${t.me.pos}°`, 18, C.hlText, "bold")
    txt(p, `${t.me.pt} pt`, 12, C.text, "semibold")
  }
  const ks = koStatus(d)
  if (ks) {
    // eliminata: "Eliminata" grande e il turno nella riga sotto (insieme non ci stanno)
    const out = ks.state === "out" && /^Eliminata/.test(ks.text)
    txt(nm, out ? "Eliminata" : ks.text, 14, koColor(ks), "bold").minimumScaleFactor = 0.75
    const sub = [out || ks.detail ? ks.round : "", ks.detail].filter(Boolean).join(" · ")
    if (sub) txt(c, sub, 10, C.sub).minimumScaleFactor = 0.85
  }
  if (t.me) txt(c, statLine(t.me), 10, C.sub).minimumScaleFactor = 0.85
  formDots(c, t.form, 11)
  if (t.me && d.standings.length > 2) {
    c.addSpacer(4)
    miniTable(c, d, t.me, width, tight)
  }
  return c
}

// La squadra con chi le sta subito sopra e sotto, e il distacco in punti
// tight (solo "La mia squadra" grande): colonnine di posizione e punti e margini più stretti, nomi più lunghi
function miniTable(stack, d, me, width, tight) {
  const s = d.standings, i = s.indexOf(me)
  const from = Math.max(0, Math.min(i - 1, s.length - 3))
  const rows = s.slice(from, from + 3)
  const box = stack.addStack(); box.layoutVertically(); box.spacing = 2
  for (const x of rows) {
    const mine = x === me
    const r = box.addStack(); r.centerAlignContent(); r.spacing = tight ? 3 : 4; r.setPadding(0, 2, 0, tight ? 2 : 4)
    if (width) r.size = new Size(width, 0)
    if (mine) { r.backgroundColor = C.hl; r.cornerRadius = 5 }
    cell(r, x.pos, tight ? 13 : 16, Font.semiboldRoundedSystemFont(F_SUB), x.pos === 1 ? C.accent : C.sub, "center")
    logo(r, x.name, 13)
    // nel medio la colonna è stretta (~10 lettere): i nomi lunghi perdono le sigle iniziali
    const n = txt(r, compactName(x.name, tight ? 16 : 11, true), F_TXT, mine ? C.hlText : C.text, mine ? "bold" : "regular"); n.minimumScaleFactor = 0.8
    r.addSpacer()
    if (!mine) {
      const diff = x.pt - me.pt
      txt(r, diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "=", F_SUB - 1, C.sub)
    }
    cell(r, x.pt, tight ? 14 : 18, ptsFont(x, F_TXT), mine ? C.hlText : C.text, "center")
  }
}

function lastBlock(stack, t, size, d) {
  const m = t.last
  sectionLabel(stack, "Ultima")
  if (!m) { txt(stack, "—", size, C.sub); return }
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 5; r.url = matchUrl(m)
  teamScore(r, m, size)
  logo(r, opp(m), size + 4)
  const o = txt(r, `${isMine(m.home) ? "vs" : "@"} ${opp(m)}`, size, C.text); o.minimumScaleFactor = 0.8
  if (m.parziali.length) txt(stack, m.parziali.map(p => p.join("-")).join(" · "), size - 2, m.ufficioso ? C.uff : C.sub).minimumScaleFactor = 0.75
  if (m.ufficioso) txt(stack, "risultato ufficioso", size - 3, C.uff, "semibold")
}

function nextBlock(stack, d, t, size) {
  const m = t.next
  sectionLabel(stack, waiting(m) ? "Risultato in arrivo" : "Prossima")
  if (!m) { txt(stack, "Nessuna in calendario", size, C.sub); return }
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 5
  logo(r, opp(m), size + 4)
  const o = txt(r, `${isMine(m.home) ? "vs" : "@"} ${opp(m)}`, size, C.text, "semibold"); o.minimumScaleFactor = 0.8
  const when = stack.addStack(); when.spacing = 4
  txt(when, `${dayName(m.ts)} ${fmtDate(m.ts)} · ${fmtTime(m.ts)}`, size - 1, C.text)
  txt(when, countdown(m.ts), size - 1, C.hlText, "semibold")
  const v = venueOf(d, m)
  if (v) {
    const vs = stack.addStack(); vs.spacing = 3; vs.centerAlignContent(); vs.url = mapsUrl(v)
    const pin = symbol("mappin.circle.fill", size - 1)
    if (pin) { const i = vs.addImage(pin); i.imageSize = new Size(size, size); i.tintColor = C.accent }
    const vt = txt(vs, venueShort(v), size - 2, C.sub); vt.minimumScaleFactor = 0.8
  }
}

function teamSmall(w, d) {
  const t = teamData(d)
  smallTeamTop(w, d, t)
  w.addSpacer()
  const fr = w.addStack(); fr.centerAlignContent(); fr.spacing = 6
  txt(fr, "FORMA", 9, C.sub, "semibold")
  dotsOnly(fr, t.form, 9)
  w.addSpacer()
  // coppe senza altre partite: al posto di "Ultima" la sfida intera (andata e ritorno)
  const ks = !t.next && koStatus(d)
  if (ks && ks.tie) { koPath(w, d, INNER_SMALL, 3); return }
  if (t.last && t.next) {
    sectionLabel(w, "Ultima")
    w.addSpacer(2)
    lastRow(w, t.last, false)
    w.addSpacer()
  }
  if (t.next) nextLines(w, t.next)
  else if (t.last) { sectionLabel(w, "Ultima"); w.addSpacer(2); lastRow(w, t.last, false) }
}

function teamMedium(w, d) {
  const t = teamData(d)
  // due colonne alte quanto il widget: gli spazi flessibili distribuiscono i blocchi su tutta l'altezza
  // margini laterali di 11 invece di 14 e stacco di 8 attorno alla linea: le colonne guadagnano ~5 punti
  w.setPadding(12, 11, 12, 11)
  // con la riga rossa "dati delle…" in fondo le colonne sono un po' più basse, così non ci finiscono sopra
  const W = MED.w + 6, H = MED.h - 2 - (d.fromCache ? 12 : 0)
  const row = w.addStack(); row.topAlignContent(); row.spacing = 8; row.size = new Size(W, H)
  const leftW = Math.round((W - 17) / 2), rightW = W - 17 - leftW

  // a sinistra: squadra, numeri e forma, poi chi le sta vicino in classifica
  const l = row.addStack(); l.layoutVertically(); l.size = new Size(leftW, H)
  smallTeamTop(l, d, t)
  l.addSpacer()
  if (t.me) { txt(l, statLine(t.me), F_SUB, C.sub).minimumScaleFactor = 0.85; l.addSpacer(4) }
  if (d.ko) { koPath(l, d, leftW); l.addSpacer() }
  const fr = l.addStack(); fr.centerAlignContent(); fr.spacing = 6
  txt(fr, "FORMA", 9, C.sub, "semibold"); dotsOnly(fr, t.form, 9)
  if (t.me && d.standings.length > 2) { l.addSpacer(); miniTable(l, d, t.me) }

  const sep = row.addStack(); sep.size = new Size(1, H - 8); sep.backgroundColor = C.chip

  // a destra: ULTIMA in alto, PROSSIMA in basso, lo spazio libero in mezzo
  const r = row.addStack(); r.layoutVertically(); r.size = new Size(rightW, H)
  sectionLabel(r, "Ultima"); r.addSpacer(3)
  if (t.last) {
    lastRow(r, t.last, true)
    if (t.last.parziali.length) {
      r.addSpacer(2)
      const p = txt(r, t.last.parziali.map(x => x.join("-")).join("  "), F_SUB, t.last.ufficioso ? C.uff : C.sub); p.minimumScaleFactor = 0.8
    }
  } else txt(r, "—", F_SUB, C.sub)
  r.addSpacer()
  if (t.next) { nextLines(r, t.next); venueLine(r, d, t.next) }
  else { sectionLabel(r, "Prossima"); txt(r, "Nessuna in calendario", F_SUB, C.sub) }
  r.addSpacer()
}

function teamLarge(w, d) {
  const t = teamData(d)
  header(w, d, "La mia squadra", false, true)
  w.addSpacer(10)
  const row = w.addStack(); row.topAlignContent(); row.spacing = 12
  const leftW = Math.round(LRG.w * 0.47)
  teamCard(row, d, t, 40, leftW, true)
  const r = row.addStack(); r.layoutVertically(); r.spacing = 2
  lastBlock(r, t, 11)
  r.addSpacer(6)
  nextBlock(r, d, t, 11)
  w.addSpacer(12)
  sectionLabel(w, "Calendario")
  w.addSpacer(3)
  const list = w.addStack(); list.layoutVertically(); list.spacing = 2
  // righe del calendario: quante ne entrano sotto la scheda (~194 punti), ~23 punti l'una
  const n = Math.max(3, Math.min(8, Math.floor((LRG.h - 194) / 23)))
  const past = Math.min(t.pl.length, t.up.length ? 2 : n)
  const cal = t.pl.slice(0, past).reverse().concat(t.up).slice(0, n)
  cal.forEach((m, i) => calendarRow(list, m, i % 2 === 0, t.next && m.code === t.next.code))
  w.addSpacer()
}

function calendarRow(stack, m, stripe, isNext) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 6
  r.setPadding(3, 6, 3, 6); r.cornerRadius = 7; r.url = matchUrl(m)
  r.backgroundColor = isNext ? C.hl : (stripe ? C.stripe : C.bg)
  cell(r, m.tbd ? "da definire" : `${dayName(m.ts)} ${fmtDate(m.ts)}`, 62, Font.systemFont(10), C.sub, "left")
  cell(r, isMine(m.home) ? "casa" : "fuori", 30, Font.mediumSystemFont(9), C.sub, "center")
  logo(r, opp(m), 15)
  const o = txt(r, opp(m), 11, C.text); o.minimumScaleFactor = 0.85
  r.addSpacer()
  if (m.sets) {
    // ai rigori ("V 4-2 rig.") serve un po' più di posto
    const box = r.addStack(); box.size = new Size(m.dcr ? 74 : 50, 0); box.addSpacer()
    teamScore(box, m, 10)
  } else cell(r, m.tbd ? "–" : fmtTime(m.ts), 50, Font.mediumSystemFont(10), C.text, "center")
}

function noTeamWidget(w) {
  w.backgroundColor = C.bg
  txt(w, `${ICON} Nessuna squadra`, 13, C.text, "bold")
  w.addSpacer(4)
  const t = txt(w, "Scrivi nel parametro: squadra;squadra=Nome squadra", 10, C.sub); t.lineLimit = 3
  return w
}

// ───────────────────────── panoramica nel widget grande ─────────────────────────

// Un po' di tutto: squadra (posizione, forma, ultima e prossima), giornata in corso, classifica in due colonne
function panoramaLarge(w, d) {
  const t = teamData(d)
  const g = currentGiornata(d)
  header(w, d, "Panoramica", false, true)
  let avail = LRG.h - 30 // altezza utile del grande, tolta l'intestazione

  // ── scheda squadra: a sinistra posizione e forma, a destra ultima e prossima ──
  if (TEAM && (t.me || t.last || t.next)) {
    w.addSpacer()
    // due colonne compatte, centrate in verticale e in orizzontale: le colonne sono larghe quanto
    // il loro contenuto e due spaziatori uguali ai lati dividono a metà lo spazio che avanza.
    // La linea sta a metà strada tra le due colonne (gapL prima, gapR dopo).
    const box = w.addStack(); box.centerAlignContent(); box.spacing = 0
    box.size = new Size(LRG.w, 0)
    box.setPadding(8, 2, 8, 2); box.cornerRadius = 12; box.backgroundColor = C.stripe
    const gapL = 20, gapR = 20, SIDE = 10 // SIDE = margine minimo ai lati (spaziatore minimo ~8 + padding 2)
    // limiti di larghezza: oltre questi la colonna si ferma e il testo si adatta, così non si sfora mai
    // stima tarata sugli screenshot del 12 Pro (~0,5 × corpo per carattere); textW resta più prudente
    const est = (str, size) => String(str).length * size * 0.5
    const leftMax = 110
    const leftEst = Math.max(84, 46 + est(TEAM, 13))
    const rightW = LRG.w - 2 * SIDE - Math.min(leftMax, leftEst) - gapL - 1 - gapR - 4
    box.addSpacer()
    const l = box.addStack(); l.layoutVertically(); l.spacing = 6
    if (leftEst > leftMax) l.size = new Size(leftMax, 0)
    const top = l.addStack(); top.centerAlignContent(); top.spacing = 8
    const ring = top.addStack(); ring.size = new Size(38, 38); ring.cornerRadius = 19
    ring.borderColor = C.accent; ring.borderWidth = 2; ring.centerAlignContent()
    logo(ring, TEAM, 30)
    const nm = top.addStack(); nm.layoutVertically(); nm.spacing = 0
    const n = txt(nm, TEAM, 13, C.text, "bold"); n.minimumScaleFactor = 0.7
    if (d.ko) n.lineLimit = 2 // coppe: nome lungo su due righe ("Spartak / Telgate") invece dei puntini
    if (t.me) {
      const p = nm.addStack(); p.bottomAlignContent(); p.spacing = 4
      txt(p, `${t.me.pos}°`, 16, C.hlText, "bold")
      txt(p, `${t.me.pt} pt`, F_TXT, C.sub, "semibold")
    }
    const ks = koStatus(d)
    if (ks) {
      const out = ks.state === "out" && /^Eliminata/.test(ks.text)
      txt(nm, out ? "Eliminata" : ks.text, 11, koColor(ks), "bold").minimumScaleFactor = 0.75
      const sub = [out ? ks.round : "", ks.detail].filter(Boolean).join(" · ")
      if (sub) txt(nm, sub, F_SUB - 1, C.sub, "semibold").minimumScaleFactor = 0.8
    }
    const dr = l.addStack(); dotsOnly(dr, t.form, 9)

    // linea divisoria un po' più corta della colonna destra, centrata in verticale
    box.addSpacer(gapL)
    const sep = box.addStack(); sep.size = new Size(1, 60); sep.backgroundColor = C.chip
    box.addSpacer(gapR)

    const r = box.addStack(); r.layoutVertically(); r.spacing = 2
    const m = t.last, nx0 = t.next
    // accanto a data e ora: palestra completa se entra, altrimenti il paese, altrimenti la sua prima parola
    // ("Scuole Elementari · Cavernago" → "Cavernago"; "Cividate al Piano" → "Cividate"): data e ora restano intere
    const venueLabel = (v, dateStr) => {
      const free = rightW - est(dateStr, F_SUB) - 4 - F_SUB - 2 - 4
      const full = venueShort(v), city = venueCity(v) || venueName(v)
      if (textW(full, F_SUB) <= free) return full
      if (est(city, F_SUB) <= free) return city
      return city.split(/\s+/)[0]
    }
    const nxDate = nx0 ? `${dayName(nx0.ts)} ${fmtDate(nx0.ts)} · ${fmtTime(nx0.ts)}` : ""
    const nxVenue = nx0 && venueOf(d, nx0) ? venueLabel(venueOf(d, nx0), nxDate) : ""
    // la colonna destra si blocca alla larghezza massima solo se una riga rischia di superarla
    const rightEst = Math.max(
      m ? 20 + 5 + 30 + 5 + 13 + 5 + est(`@ ${opp(m)}`, F_TXT) : 0,
      nx0 ? 13 + 5 + est(`vs ${opp(nx0)}`, F_TXT) : 0,
      nx0 ? est(nextLabel(nx0).toUpperCase(), 9) * 1.2 : 0,
      nx0 ? est(nxDate, F_SUB) + 4 + F_SUB + 2 + est(nxVenue, F_SUB) : 0)
    if (rightEst > rightW) r.size = new Size(rightW, 0)
    sectionLabel(r, "Ultima")
    if (m) {
      const lr = r.addStack(); lr.centerAlignContent(); lr.spacing = 5; lr.url = matchUrl(m)
      teamScore(lr, m, F_TXT)
      logo(lr, opp(m), 13)
      // coppe: con "rig." il posto è meno, l'avversario perde le sigle iniziali ("Pol.Sorisolese" → "Sorisolese")
      const on = d.ko ? compactName(opp(m), 10, true) : opp(m)
      const o = txt(lr, `${isMine(m.home) ? "vs" : "@"} ${on}`, F_TXT, C.text, "semibold"); o.minimumScaleFactor = 0.75
    } else txt(r, "—", F_TXT, C.sub)
    r.addSpacer(5) // distanza fissa e moderata tra Ultima e Prossima
    const nx = t.next
    sectionLabel(r, nx ? nextLabel(nx) : "Prossima")
    if (nx) {
      const nr = r.addStack(); nr.centerAlignContent(); nr.spacing = 5; nr.url = matchUrl(nx)
      logo(nr, opp(nx), 13)
      const o = txt(nr, `${isMine(nx.home) ? "vs" : "@"} ${opp(nx)}`, F_TXT, C.text, "semibold"); o.minimumScaleFactor = 0.75
      const when = r.addStack(); when.centerAlignContent(); when.spacing = 4
      const dateStr = `${dayName(nx.ts)} ${fmtDate(nx.ts)} · ${fmtTime(nx.ts)}`
      const dt = txt(when, dateStr, F_SUB, C.sub); dt.minimumScaleFactor = 1
      const v = venueOf(d, nx)
      if (v) {
        const vs = when.addStack(); vs.centerAlignContent(); vs.spacing = 2; vs.url = mapsUrl(v)
        const pin = symbol("mappin.circle.fill", F_SUB)
        if (pin) { const i = vs.addImage(pin); i.imageSize = new Size(F_SUB, F_SUB); i.tintColor = C.accent }
        const vt = txt(vs, nxVenue || venueLabel(v, dateStr), F_SUB, C.sub); vt.minimumScaleFactor = 0.85
      }
    } else txt(r, "Nessuna in calendario", F_TXT, C.sub)
    box.addSpacer() // uguale a quello iniziale: il contenuto resta centrato
    avail -= 90
  }

  // ── classifica in due colonne: se ne calcola l'altezza per lasciare il resto alla giornata ──
  const st = d.standings.slice(0, 14)
  const per = Math.ceil(st.length / 2)
  const standH = 16 + per * 15 + (per - 1) * 2

  if (g.cur) {
    w.addSpacer()
    sectionLabel(w, prettyGiornata(g.cur.label))
    w.addSpacer(4)
    const free = avail - standH - 16
    const fit = Math.max(2, Math.floor((free + 2) / 21))
    // la partita della squadra già mostrata nella scheda sopra (Ultima o Prossima) non si ripete:
    // il posto liberato va alle altre partite della giornata
    const above = TEAM ? [t.last, t.next].filter(Boolean) : []
    const ms = pickMatches(roundList(d, g.cur).filter(m => !above.includes(m) && !(m.legs && m.legs.some(x => above.includes(x)))), fit)
    const list = w.addStack(); list.layoutVertically(); list.spacing = 2
    const lay = rowLayout(ms, LRG.w, F_TXT)
    lay.nameSize = Math.min(lay.nameSize, F_TXT)
    ms.forEach(m => matchRow(list, m, LRG.w, F_TXT, false, true, lay))
    // coppe (niente classifica sotto): nello spazio che resta i turni prima, dal più recente
    if (d.ko) {
      let left = free - ms.length * 21
      const all = giornate(d), i = all.findIndex(x => x.label === g.cur.label)
      for (const x of all.slice(0, Math.max(0, i)).reverse()) {
        const l0 = roundList(d, x).filter(m => !above.includes(m) && !(m.legs && m.legs.some(y => above.includes(y))))
        const n = Math.min(l0.length, Math.floor((left - 22) / 21))
        if (n < 1) break
        left -= 22 + n * 21
        w.addSpacer(6)
        sectionLabel(w, prettyGiornata(x.label))
        w.addSpacer(4)
        const ls = w.addStack(); ls.layoutVertically(); ls.spacing = 2
        const sh = pickMatches(l0, n), ly = rowLayout(sh, LRG.w, F_TXT)
        ly.nameSize = Math.min(ly.nameSize, F_TXT)
        sh.forEach(m => matchRow(ls, m, LRG.w, F_TXT, false, true, ly))
      }
    }
  }

  if (st.length) {
    w.addSpacer()
    sectionLabel(w, "Classifica")
    w.addSpacer(4)
    const row = w.addStack(); row.topAlignContent(); row.spacing = 8
    const colW = (LRG.w - 8) / 2
    const arrows = !!TREND && st.some(x => TREND[x.name] && TREND[x.name] !== x.pos)
    for (const part of [st.slice(0, per), st.slice(per)]) {
      const c = row.addStack(); c.layoutVertically(); c.spacing = 2
      for (const x of part) largeStandingRow(c, x, colW, arrows)
    }
  }
  w.addSpacer()
}

// ── panoramica piccola: la squadra, chi le sta sopra e sotto in classifica, la prossima partita ──
function panoramaSmall(w, d) {
  const t = teamData(d)
  smallTeamTop(w, d, t)
  w.addSpacer()
  if (t.me && d.standings.length > 2) {
    const s = d.standings, i = s.indexOf(t.me)
    const from = Math.max(0, Math.min(i - 1, s.length - 3))
    const rows = s.slice(from, from + 3)
    const col = w.addStack(); col.layoutVertically(); col.spacing = 2
    const ns = rowNameSize(rows, INNER_SMALL)
    for (const x of rows) panoStandingRow(col, x, ns)
    w.addSpacer()
  }
  const ks = !t.next && koStatus(d)
  if (ks && ks.tie) { koPath(w, d, INNER_SMALL, 4); w.addSpacer(); return }
  if (t.last) { lastRow(w, t.last, false); w.addSpacer() }
  if (t.next) nextLines(w, t.next)
  else txt(w, "Nessuna in calendario", F_SUB, C.sub)
}

// Intestazione dei piccoli di squadra: logo, nome, posizione e punti, orario a destra
function smallTeamTop(w, d, t, chipMatch) {
  const top = w.addStack(); top.centerAlignContent(); top.spacing = 7
  logo(top, TEAM, 26)
  const nm = top.addStack(); nm.layoutVertically()
  const n = txt(nm, TEAM, 12, C.text, "bold"); n.minimumScaleFactor = 0.85
  const p = nm.addStack(); p.centerAlignContent(); p.spacing = 3
  if (t.me) {
    txt(p, `${t.me.pos}°`, F_SUB, C.hlText, "bold")
    txt(p, `· ${t.me.pt} pt`, F_SUB, C.sub, "semibold")
  }
  const ks = !t.me && koStatus(d)
  if (ks) txt(p, ks.text, F_SUB, koColor(ks), "bold").minimumScaleFactor = 0.7
  if (chipMatch) { p.addSpacer(4); lastChip(p, chipMatch) }
  top.addSpacer()
  return top
}

// Ultimo risultato su una riga: V/P con i set, logo e avversario
function lastRow(stack, m, withLogo) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 4; r.url = matchUrl(m)
  lastChip(r, m)
  if (withLogo) logo(r, opp(m), 13)
  const o = txt(r, `${isMine(m.home) ? "vs" : "@"} ${opp(m)}`, F_TXT, C.text, "semibold"); o.minimumScaleFactor = 0.7
  return r
}

// Prossima partita: etichetta con il conto alla rovescia, avversario, giorno e ora
function nextLines(stack, m) {
  const lb = txt(stack, nextLabel(m).toUpperCase(), 9, C.sub, "semibold"); lb.minimumScaleFactor = 0.8
  stack.addSpacer(2)
  const nr = stack.addStack(); nr.centerAlignContent(); nr.spacing = 4; nr.url = matchUrl(m)
  logo(nr, opp(m), 13)
  const o = txt(nr, `${isMine(m.home) ? "vs" : "@"} ${opp(m)}`, F_TXT, C.text, "semibold"); o.minimumScaleFactor = 0.7
  txt(stack, `${dayName(m.ts)} ${fmtDate(m.ts)} · ${fmtTime(m.ts)}`, F_SUB, C.sub)
}

// ── panoramica media: a sinistra la squadra con ultima e prossima, a destra la classifica ──
function panoramaMedium(w, d) {
  const t = teamData(d)
  // margini laterali di 11 invece di 14 e stacco di 8 attorno alla linea: le colonne guadagnano ~5 punti
  w.setPadding(12, 11, 12, 11)
  // con la riga rossa "dati delle…" in fondo le colonne sono un po' più basse, così non ci finiscono sopra
  const W = MED.w + 6, H = MED.h - 2 - (d.fromCache ? 12 : 0)
  const row = w.addStack(); row.topAlignContent(); row.spacing = 8; row.size = new Size(W, H)
  const leftW = Math.round((W - 17) / 2), rightW = W - 17 - leftW

  // a sinistra: la squadra, l'ultimo risultato e la prossima partita, distribuiti su tutta l'altezza
  const l = row.addStack(); l.layoutVertically(); l.size = new Size(leftW, H)
  smallTeamTop(l, d, t)
  l.addSpacer()
  if (d.ko && !t.next) {
    // coppe, squadra senza altre partite: il suo percorso al posto di ultima e prossima
    koPath(l, d, leftW); l.addSpacer()
  } else {
    if (t.last) { lastRow(l, t.last, false); l.addSpacer() }
    if (t.next) { nextLines(l, t.next); venueLine(l, d, t.next) }
    else txt(l, "Nessuna in calendario", F_SUB, C.sub)
  }

  const sep = row.addStack(); sep.size = new Size(1, H - 8); sep.backgroundColor = C.chip

  // a destra: 5 righe di classifica (le prime o quelle intorno alla tua squadra) su tutta l'altezza
  const r = row.addStack(); r.layoutVertically(); r.size = new Size(rightW, H)
  if (d.ko) {
    // coppe: al posto della classifica le sfide del turno della squadra
    const g = currentGiornata(d)
    sectionLabel(r, g.cur ? roundTitle(g.cur.label) : "Tabellone")
    const ms = pickMatches(roundList(d, g.cur), 4), ab = shortNames(allTeams(d))
    // poche sfide nel turno (es. la finale): sotto il turno prima, con la sua etichetta
    const extra = []
    let left = 4 - ms.length
    for (const x of earlierRounds(d, g.cur)) {
      if (left < 2) break
      const sh = pickMatches(roundList(d, x), left - 1)
      left -= 1 + sh.length
      extra.push([x, sh])
    }
    const rows = ms.length + extra.reduce((n, e) => n + e[1].length, 0)
    const gap = Math.max(3, Math.min(10, (H - 13 - rows * 22 - extra.length * 14) / Math.max(1, rows)))
    for (const m of ms) { r.addSpacer(gap); roundRowSmall(r, m, ab, rightW) }
    for (const [x, sh] of extra) {
      r.addSpacer(gap); sectionLabel(r, roundTitle(x.label))
      for (const m of sh) { r.addSpacer(3); roundRowSmall(r, m, ab, rightW) }
    }
    r.addSpacer()
    return
  }
  sectionLabel(r, "Classifica")
  const s = d.standings, me = myStanding(d), i = me ? s.indexOf(me) : 0
  const from = Math.max(0, Math.min(i - 2, s.length - 5))
  const rows5 = s.slice(from, from + 5), ns = rowNameSize(rows5, rightW)
  // spazio tra le righe: quello che resta, diviso equamente, senza superare 10 punti
  const gap = Math.max(3, Math.min(10, (H - 13 - rows5.length * 14.5) / rows5.length))
  for (const x of rows5) { r.addSpacer(gap); panoStandingRow(r, x, ns) }
  r.addSpacer()
}

// Palestra della partita (tocco: percorso con il navigatore predefinito)
function venueLine(stack, d, m) {
  const v = venueOf(d, m)
  if (!v) return
  const vs = stack.addStack(); vs.centerAlignContent(); vs.spacing = 3; vs.url = mapsUrl(v)
  const pin = symbol("mappin.circle.fill", F_SUB)
  if (pin) { const i = vs.addImage(pin); i.imageSize = new Size(F_SUB, F_SUB); i.tintColor = C.accent }
  const vt = txt(vs, venueShort(v), F_SUB, C.sub); vt.minimumScaleFactor = 0.75
  vs.addSpacer()
}

// Risultato dell'ultima partita: V/P e set, verde o rosso
function lastChip(stack, m) { return teamScore(stack, m, F_TXT) }

// Risultato della squadra seguita: bollino V (verde) o P (rossa) e punteggio sempre casa-ospite,
// con il numero della squadra in grassetto e colorato e quello dell'avversario in grigio.
// Se il risultato non è ancora ufficiale i numeri sono rossi, come sul sito.
function teamScore(stack, m, size) {
  const rs = res(m)
  const g = stack.addStack(); g.centerAlignContent(); g.spacing = 4
  const chip = g.addStack(); chip.setPadding(1, 4, 1, 4); chip.cornerRadius = 4; chip.backgroundColor = resColor(rs)
  const ct = chip.addText(rs); ct.font = Font.boldRoundedSystemFont(size - 1); ct.textColor = Color.white()
  const sc = g.addStack(); sc.centerAlignContent(); sc.spacing = 1
  const mineHome = isMine(m.home)
  const num = (v, mine) => {
    const t = sc.addText(String(v))
    t.font = mine ? Font.boldRoundedSystemFont(size + 0.5) : Font.mediumRoundedSystemFont(size)
    t.textColor = m.ufficioso ? C.uff : mine ? C.hlText : C.sub
  }
  num(m.sets[0], mineHome)
  const dash = sc.addText("-"); dash.font = Font.mediumRoundedSystemFont(size); dash.textColor = m.ufficioso ? C.uff : C.sub
  num(m.sets[1], !mineHome)
  if (m.dcr) txt(g, "rig.", size - 2, C.sub, "semibold")
  return g
}

// Grandezza dei nomi in una lista di classifica: 10,5 se ci stanno, altrimenti un po' meno,
// uguale per tutte le righe del widget (posizione, logo, punti e spazi ≈ 72 pt)
function rowNameSize(rows, width) {
  const longest = Math.max(1, ...rows.map(r => rowName(r).length))
  return Math.max(9, Math.min(F_TXT, Math.floor((width - 72) / (longest * 0.58) * 2) / 2))
}

// Riga di classifica della panoramica: posizione, logo, nome e punti con la stessa scala di caratteri
function panoStandingRow(stack, s, nameSize, width) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 4; r.setPadding(0, 2, 0, 4)
  if (width) r.size = new Size(width, 0)
  const mine = isMine(s.name)
  if (mine) { r.backgroundColor = C.hl; r.cornerRadius = 5 }
  cell(r, s.pos, 16, Font.semiboldRoundedSystemFont(F_SUB), s.pos === 1 ? C.accent : C.sub, "center", true)
  if (TREND) trend(r, s, F_SUB)
  logo(r, s.name, 13)
  const n = txt(r, rowName(s), nameSize, mine ? C.hlText : C.text, mine ? "bold" : "regular"); n.minimumScaleFactor = 0.9
  r.addSpacer()
  cell(r, s.pt, 18, ptsFont(s, F_TXT), ptsColor(s), "center")
}

// Liste strette (piccolo e medio), calcio e volley: i nomi lunghi perdono le sigle iniziali comuni
// ("Or.S.Marco Forest" → "S.Marco Forest", "Pol.Com.Tavernola" → "Tavernola") invece di troncarsi
function rowName(s) { return compactName(s.name, 12) }
function compactName(name, max, more) {
  let x = name
  // sigle societarie comuni, anche puntate: Or., Pol., G.S.O., U.S.D., A.S.D., S.S.D., A.C., C.S., F.C., P.G.S.…
  const SIG = "Or|Orat|Oratorio|Pol|Polisp|Polisportiva|Com|Gso|G\\.S\\.O|Gs|G\\.S|Usd|U\\.S\\.D|Us|U\\.S|Asd|A\\.S\\.D|As|A\\.S|Ssd|S\\.S\\.D|Ss|S\\.S|Acd|A\\.C\\.D|Ac|A\\.C|Cs|C\\.S|Csi|Fc|F\\.C|Pgs|P\\.G\\.S|Asdc|Calcio|Team"
  const PRE = new RegExp(`^(${SIG}${more ? "|Nova|Virtus|Real|St|Sant" : ""})[.\\s]+`, "i")
  // una volta iniziato si tolgono tutte le sigle iniziali ("Pol.Com.Tavernola" → "Tavernola", mai "Com.Tavernola")
  let cut = false
  while ((cut || x.length > max) && PRE.test(x)) { x = x.replace(PRE, ""); cut = true }
  return x || name
}

// Solo i pallini della forma (ultime 5: V verde, P rossa, vuoti da giocare), senza etichetta
function dotsOnly(stack, form, size) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 4
  for (let i = 0; i < 5; i++) {
    const f = form[i]
    const dot = r.addStack(); dot.size = new Size(size + 4, size + 4); dot.cornerRadius = (size + 4) / 2; dot.centerAlignContent()
    if (f === undefined) { dot.borderColor = C.chip; dot.borderWidth = 1.5; continue }
    dot.backgroundColor = resColor(f)
    const tt = dot.addText(f); tt.font = Font.boldRoundedSystemFont(size - 2); tt.textColor = Color.white()
  }
  return r
}

// ───────────────────────── vista "ultima": l'ultima partita della squadra ─────────────────────────

// Pagina della partita sul sito CSI: cronaca (calcio: gol, ammonizioni, fine tempo) e precedenti.
// Si scarica solo per i widget "ultima"; senza rete si usa l'ultima copia salvata.
async function getMatchInfo(m) {
  const fm = FileManager.local()
  const p = fm.joinPath(fm.cacheDirectory(), `csi-gara-${m.code}.json`)
  try {
    const info = parseMatchPage(await fetchHTML(m.href), m)
    fm.writeString(p, JSON.stringify(info))
    return info
  } catch (e) {
    try { if (fm.fileExists(p)) return JSON.parse(fm.readString(p)) } catch (x) {}
    return { events: [], prev: [] }
  }
}

function parseMatchPage(html, m) {
  // cronaca: righe "event-row" e intestazioni "event-header" (dalla più recente alla più vecchia)
  const out = { events: [], prev: [] }
  const tl = (html.split(/Card timing/i)[1] || "").split(/classifica_unico_girone|Storico gare/i)[0]
  const list = []
  for (const c of tl.split(/(?=<div class="event-(?:row|header)")/i).slice(1)) {
    if (/^<div class="event-header"/i.test(c)) { list.push({ type: "fine", text: strip(c) }); continue }
    const det = (c.match(/<div class="event-details([^"]*)">([\s\S]*?)<\/div>/i) || [])
    const side = /left/.test(det[1] || "") ? "home" : /right/.test(det[1] || "") ? "away" : ""
    const inner = det[2] || ""
    const score = strip((inner.match(/<h6[^>]*>([\s\S]*?)<\/h6>/i) || [])[1] || "").replace(/\s+/g, "")
    const num = ((inner.match(/<sup[^>]*>([\s\S]*?)<\/sup>/i) || [])[1] || "").replace(/\D/g, "")
    const name = strip(inner.replace(/<h6[\s\S]*?<\/h6>|<sup[\s\S]*?<\/sup>/gi, ""))
    const min = parseInt(strip((c.match(/<div class="event-time">([\s\S]*?)<\/div>/i) || [])[1] || "")) || 0
    const icon = (c.match(/<div class="event-icon">([\s\S]*?)<\/div>/i) || [])[1] || ""
    const type = /futbol/i.test(icon) ? "gol" : /rectangle/i.test(icon) ? (/danger/i.test(icon) ? "rosso" : "giallo") : "altro"
    list.push({ type, side, min, score, name, num })
  }
  // in ordine di tempo: dal fondo verso l'alto; "Fine primo tempo" separa i due tempi
  let half = 1, last = "0-0"
  for (const e of list.reverse()) {
    if (e.type === "fine") {
      if (/primo tempo/i.test(e.text)) { out.events.push({ type: "fine", text: "Fine 1° tempo", score: last }); half = 2 }
      continue
    }
    if (e.type === "gol" && e.score) last = e.score
    out.events.push(Object.assign(e, { half }))
  }
  // precedenti tra le due squadre (anche stagioni passate), esclusa questa partita
  const st = (html.split(/Storico gare/i)[1] || "").split(/hero-campionato/i)[0]
  let season = ""
  for (const c of st.split(/(?=<label>|<a\b)/i)) {
    if (/^<label>/i.test(c)) { season = strip(c.match(/<label>([\s\S]*?)<\/label>/i)[1]); continue }
    if (!/btn-gara/i.test(c)) continue
    const code = (c.match(/\((\d{7}[A-Z]{1,3}\d{3,})\)/) || [])[1] || ""
    if (code && m.code.endsWith(code)) continue
    const names = [...c.matchAll(/class="nome-squadra">([\s\S]*?)<\/span>/gi)].map(x => strip(x[1]))
    const dm = strip(c).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2})[:.](\d{2})/)
    if (names.length < 2 || !dm) continue
    let y = +dm[3]; if (y < 100) y += 2000
    const fin = c.slice(c.lastIndexOf('class="vr"'))
    const nums = (strip(fin).match(/\d+/g) || []).map(Number)
    out.prev.push({ season, ts: new Date(y, +dm[2] - 1, +dm[1], +dm[4], +dm[5]).getTime(), home: names[0], away: names[1], sets: nums.length >= 2 ? nums.slice(-2) : null })
  }
  out.prev.sort((a, b) => b.ts - a.ts)
  return out
}

// testo di un evento della cronaca: "⚽︎ 1-1 Rossi M." · "🟨 Pezzotti A. (7)"
function eventText(e) {
  const who = e.name ? `${e.name}${e.num ? ` (${e.num})` : ""}` : ""
  if (e.type === "gol") return [`⚽︎ ${e.score}`, who].filter(Boolean).join("  ")
  if (e.type === "giallo") return `🟨 ${who}`
  if (e.type === "rosso") return `🟥 ${who}`
  return who
}
// minuto della partita: nel secondo tempo il sito conta da zero, qui si aggiunge il primo tempo (23' → 68')
function absMin(e) { return (e.min || 0) + (e.half === 2 && e.min && e.min <= 45 ? 45 : 0) }
function minText(e) { return e.min ? `${absMin(e)}'` : "" }

// Andamento dei set: una barra per set divisa in proporzione ai punti (in arancione la squadra seguita),
// con i punti ai lati e il set vinto in grassetto. center: ogni riga centrata nella larghezza disponibile
function setBars(stack, m, PW, BW, H, size, spacing, center) {
  const box = stack.addStack(); box.layoutVertically(); box.spacing = spacing
  for (const p of m.parziali) {
    const row = box.addStack(); if (center) row.addSpacer()
    const s = row.addStack(); s.centerAlignContent(); s.spacing = 4
    const hw = p[0] > p[1]
    cell(s, p[0], PW, hw ? Font.boldSystemFont(size) : Font.systemFont(size), hw ? C.text : C.sub, "center")
    const bar = s.addStack(); bar.size = new Size(BW, H); bar.cornerRadius = H / 2
    const a = Math.max(3, Math.round(BW * p[0] / Math.max(1, p[0] + p[1])))
    const L = bar.addStack(); L.size = new Size(a, H); L.backgroundColor = isMine(m.home) ? C.accent : C.chip
    const R = bar.addStack(); R.size = new Size(BW - a, H); R.backgroundColor = isMine(m.away) ? C.accent : C.chip
    cell(s, p[1], PW, hw ? Font.systemFont(size) : Font.boldSystemFont(size), hw ? C.sub : C.text, "center")
    if (center) row.addSpacer()
  }
  return box
}

// tabellone: stemma · punteggio · stemma, nomi sotto
// names: nomi da mostrare (nei formati stretti le abbreviazioni dei risultati piccoli, es. "Tavernola")
function lastScoreboard(stack, m, logoSize, scoreSize, nameSize, width, names) {
  const box = stack.addStack(); box.layoutVertically(); box.spacing = 3
  if (width) box.size = new Size(width, 0)
  const top = box.addStack(); top.centerAlignContent()
  const half = width ? Math.floor((width - scoreSize * 2.8) / 2) : 0
  // niente spaziatori (iOS ne riserva una larghezza minima): logo e nome stanno al centro della loro metà
  const side = (name, mine) => {
    const s = top.addStack(); s.layoutVertically(); s.spacing = 3
    if (half) s.size = new Size(half, 0)
    const l = s.addStack(); if (half) l.size = new Size(half, 0); logo(l, name, logoSize)
    if (!nameSize) return // solo stemmi (piccolo del volley, dove servono le righe dei set)
    const n = s.addStack(); if (half) n.size = new Size(half, 0)
    const t = txt(n, (names && names[name]) || name, nameSize, mine ? C.hlText : C.text, mine ? "bold" : "semibold"); t.minimumScaleFactor = 0.75; t.centerAlignText()
  }
  side(m.home, isMine(m.home))
  const sc = top.addStack(); sc.centerAlignContent()
  if (width) sc.size = new Size(width - 2 * half, 0)
  // ai rigori: il risultato della partita (contato dalla cronaca) e sotto quello dei rigori
  const sv = m.real || m.sets
  if (m.dcr) sc.layoutVertically()
  const sr = m.dcr ? sc.addStack() : sc
  if (m.dcr && width) { sr.size = new Size(width - 2 * half, 0); sr.centerAlignContent() }
  const s = txt(sr, `${sv[0]} - ${sv[1]}`, scoreSize, m.ufficioso ? C.uff : C.text, "bold")
  s.font = Font.boldRoundedSystemFont(scoreSize)
  if (m.dcr) {
    const pr = sc.addStack(); if (width) { pr.size = new Size(width - 2 * half, 0); pr.centerAlignContent() }
    txt(pr, m.real ? `rig. ${m.sets[0]}-${m.sets[1]}` : "ai rigori", Math.max(8, scoreSize * 0.42), C.sub, "semibold").minimumScaleFactor = 0.7
  }
  side(m.away, isMine(m.away))
  return box
}

function noLastWidget(w, d, compact) {
  header(w, d, "Ultima partita", compact, !compact)
  w.addSpacer()
  txt(w, "Nessuna partita giocata", F_TXT, C.sub)
  w.addSpacer()
}

function lastSmall(w, d, t, info) {
  const m = t.last
  if (!m) return noLastWidget(w, d, true)
  w.url = m.href
  header(w, d, "Ultima partita", true)
  w.addSpacer()
  // nomi corti: abbreviazioni dei risultati piccoli, e senza sigle iniziali se ancora lunghi ("Or.Cividate" → "Cividate")
  const ab = shortNames(allTeams(d)), nm = {}
  for (const n of [m.home, m.away]) nm[n] = compactName(ab[n] || n, 9, true)
  const lines = []
  if (!CALCIO) {
    // volley: stemmi e punteggio, poi l'andamento dei set con i punti ai lati (i nomi qui non entrerebbero)
    lastScoreboard(w, m, 24, 18, 0, INNER_SMALL)
    if (m.parziali.length) { w.addSpacer(5); setBars(w, m, 16, INNER_SMALL - 16 - 2 * 16 - 8, 5, 8.5, 1.5, true) }
  } else {
    lastScoreboard(w, m, 28, 18, 9.5, INNER_SMALL, nm)
    // calcio: la linea del tempo dei gol, poi i marcatori della squadra (se ci sono) e il primo tempo
    const ev = (info && info.events) || []
    const side = isMine(m.home) ? "home" : "away"
    const goals = ev.filter(e => e.type === "gol")
    if (goals.length) {
      w.addSpacer(6)
      const img = goalTimeline(goals, side, INNER_SMALL - 16, 12)
      if (img) { const rw = w.addStack(); rw.addSpacer(); const i = rw.addImage(img); i.imageSize = new Size(INNER_SMALL - 16, 12); rw.addSpacer() }
    }
    const mine = goals.filter(e => e.side === side && e.name)
    if (mine.length) lines.push("⚽︎ " + mine.map(e => `${e.name.split(/\s+/)[0]} ${absMin(e)}'`).join(" · "))
    const ht = ev.find(e => e.type === "fine")
    if (ht) lines.push(`1° tempo ${ht.score}`)
  }
  if (lines.length) {
    w.addSpacer(6)
    for (const l of lines) {
      const r = w.addStack(); r.addSpacer()
      const tt = txt(r, l, 9, m.ufficioso ? C.uff : C.sub, "semibold"); tt.minimumScaleFactor = 0.75
      r.addSpacer()
    }
  }
  w.addSpacer()
  const b = w.addStack(); b.centerAlignContent(); b.spacing = 5
  b.addSpacer()
  const rs = res(m), chip = b.addStack(); chip.setPadding(1, 4, 1, 4); chip.cornerRadius = 4; chip.backgroundColor = resColor(rs)
  const ct = chip.addText(rs); ct.font = Font.boldRoundedSystemFont(F_SUB); ct.textColor = Color.white()
  // ufficioso: lo dice già il punteggio in rosso; in fondo anche la giornata ("G1", "Rit. G3")
  const gn = (String(m.giornata).match(/(\d+)\s*$/) || [])[1]
  const gl = gn ? ` · ${/ritorno/i.test(m.giornata) ? "Rit. " : ""}G${gn}` : ""
  const dt = txt(b, `${dayName(m.ts)} ${fmtDate(m.ts)}${gl}`, F_SUB, m.ufficioso ? C.uff : C.sub); dt.minimumScaleFactor = 0.85
  b.addSpacer()
}

// Linea del tempo dei gol (immagine): base grigia, tacca a metà per l'intervallo, pallini sui minuti
function goalTimeline(goals, side, width, height) {
  try {
    const ctx = new DrawContext()
    ctx.size = new Size(width, height); ctx.opaque = false; ctx.respectScreenScale = true
    const y = height / 2, R = Math.min(4, height / 2 - 1), pad = R + 1, L = width - 2 * pad
    const grey = new Color("#94A3B8")
    ctx.setFillColor(new Color("#94A3B8", 0.35)); ctx.fillRect(new Rect(pad, y - 1, L, 2))
    ctx.setFillColor(new Color("#94A3B8", 0.8)); ctx.fillRect(new Rect(pad + L / 2 - 0.5, y - 4, 1, 8))
    // la linea è la partita (90'): il primo tempo a sinistra della tacca, il secondo a destra
    const xOf = e => pad + Math.min(1, absMin(e) / 90) * L
    for (const e of goals.slice().sort((a, b) => (a.side === side) - (b.side === side))) {
      ctx.setFillColor(e.side === side ? C.accent : grey)
      const x = xOf(e)
      ctx.fillEllipse(new Rect(x - R, y - R, 2 * R, 2 * R))
    }
    return ctx.getImage()
  } catch (e) { return null }
}

function lastMedium(w, d, t, info) {
  const m = t.last
  if (!m) return noLastWidget(w, d, true)
  w.url = m.href
  header(w, d, "Ultima partita", true)
  // spazio uguale sopra e sotto: il contenuto è centrato in verticale tra titolo e bordo
  w.addSpacer()
  // tutto il contenuto centrato in orizzontale: due spazi uguali ai lati, colonna destra larga quanto serve
  const row = w.addStack(); row.centerAlignContent(); row.spacing = 0; row.size = new Size(MED.w, 0)
  const leftW = 145, GAP = 12
  const ab = shortNames(allTeams(d))
  row.addSpacer()
  const l = row.addStack(); l.layoutVertically(); l.spacing = 4; l.size = new Size(leftW, 0)
  lastScoreboard(l, m, 26, 18, F_SUB, leftW, ab)
  const when = l.addStack(); when.addSpacer()
  const v = venueOf(d, m)
  txt(when, `${dayName(m.ts)} ${fmtDate(m.ts)}${v ? " · " + (venueCity(v) || venueName(v)) : ""}`, 9, m.ufficioso ? C.uff : C.sub).minimumScaleFactor = 0.8
  when.addSpacer()
  row.addSpacer(GAP)
  const sep = row.addStack(); sep.size = new Size(1, MED.h - 44); sep.backgroundColor = C.chip
  row.addSpacer(GAP)
  const r = row.addStack(); r.layoutVertically(); r.spacing = 2
  // la colonna destra non può superare lo spazio rimasto (margini minimi di 8 ai lati)
  const rightMax = MED.w - leftW - 2 * GAP - 1 - 16
  if (!CALCIO) {
    // andamento come nel grande: una barra per set divisa in proporzione ai punti (in arancione la tua
    // squadra), con i punti ai lati; "SET" centrato sopra le barre
    const PW = 20, BW = 64, SP = 5
    m.parziali.forEach(p => {
      const s = r.addStack(); s.centerAlignContent(); s.spacing = SP
      const hw = p[0] > p[1]
      cell(s, p[0], PW, hw ? Font.boldSystemFont(F_SUB) : Font.systemFont(F_SUB), hw ? C.text : C.sub, "center")
      const bar = s.addStack(); bar.size = new Size(BW, 6); bar.cornerRadius = 3
      const a = Math.max(3, Math.round(BW * p[0] / Math.max(1, p[0] + p[1])))
      const L = bar.addStack(); L.size = new Size(a, 6); L.backgroundColor = isMine(m.home) ? C.accent : C.chip
      const R = bar.addStack(); R.size = new Size(BW - a, 6); R.backgroundColor = isMine(m.away) ? C.accent : C.chip
      cell(s, p[1], PW, hw ? Font.systemFont(F_SUB) : Font.boldSystemFont(F_SUB), hw ? C.sub : C.text, "center")
    })
    if (!m.parziali.length) txt(r, "—", F_TXT, C.sub)
  } else {
    const goals = info.events.filter(e => e.type === "gol")
    // "GOL" centrato sopra la colonna dei punteggi, come "SET" nel volley
    if (goals.length) {
      // la partita come una linea del tempo: due tempi divisi a metà, un pallino per gol
      // (arancione quelli della tua squadra, grigio quelli degli avversari)
      const img = goalTimeline(goals, isMine(m.home) ? "home" : "away", 112, 12)
      if (img) { const i = r.addImage(img); i.imageSize = new Size(112, 12); r.addSpacer(4) }
    }
    if (!goals.length) txt(r, info.events.length ? "nessun gol" : "cronaca non disponibile", F_SUB, C.sub)
    // fino a 5 righe; se i gol sono di più, due per riga
    const per = goals.length > 5 ? 2 : 1
    const whoOf = e => e.name || ab[e.side === "home" ? m.home : m.away] || (e.side === "home" ? m.home : m.away)
    const est = Math.max(0, ...goals.map(e => 38 + 4 + 22 + 4 + String(whoOf(e)).length * 5.5))
    if (per === 2 || est > rightMax) r.size = new Size(rightMax, 0)
    for (let i = 0; i < goals.length && i < 12; i += per) {
      const s = r.addStack(); s.centerAlignContent(); s.spacing = 4
      for (const e of goals.slice(i, i + per)) {
        // colonne fisse: minuto allineato a destra, punteggio centrato, nome che parte sempre dallo stesso punto
        const who = whoOf(e)
        const mine = isMine(e.side === "home" ? m.home : m.away)
        cell(s, minText(e), 38, Font.semiboldSystemFont(9), C.sub, "right")
        cell(s, e.score, 22, mine ? Font.semiboldSystemFont(F_SUB) : Font.systemFont(F_SUB), mine ? C.hlText : C.text, "center")
        if (per === 1) { const g = txt(s, who, F_SUB, mine ? C.hlText : C.text, mine ? "semibold" : "regular"); g.minimumScaleFactor = 0.8 }
      }
    }
  }
  row.addSpacer()
  w.addSpacer()
}

function lastLarge(w, d, t, info) {
  const m = t.last
  if (!m) return noLastWidget(w, d, false)
  w.url = m.href
  header(w, d, "Ultima partita", false, true)
  w.addSpacer(8)
  // scheda della partita
  const box = w.addStack(); box.layoutVertically(); box.spacing = 4
  box.size = new Size(LRG.w, 0); box.setPadding(8, 10, 8, 10); box.cornerRadius = 12; box.backgroundColor = C.stripe
  lastScoreboard(box, m, 36, 26, F_TXT, LRG.w - 20)
  const v = venueOf(d, m)
  const l1 = box.addStack(); l1.addSpacer()
  // risultato non omologato: punteggio in rosso e "ufficioso" in fondo alla riga della data
  txt(l1, `${prettyGiornata(m.giornata)} · ${dayName(m.ts)} ${fmtDate(m.ts)} · ${fmtTime(m.ts)}${m.ufficioso ? " · ufficioso" : ""}`, F_SUB, m.ufficioso ? C.uff : C.sub).minimumScaleFactor = 0.8
  l1.addSpacer()
  if (v) { const l2 = box.addStack(); l2.url = mapsUrl(v); l2.addSpacer(); txt(l2, venueShort(v), 9, C.sub).minimumScaleFactor = 0.8; l2.addSpacer() }
  let avail = LRG.h - 30 - 8 - 92 - (v ? 12 : 0)
  const prev = info.prev.slice(0, CALCIO && info.events.length > 6 ? 2 : 3)
  // altezze misurate sul 12 Pro: precedenti ~16 + 17 a riga, righe della cronaca ~16
  const prevH = prev.length ? 16 + prev.length * 17 + 6 : 0
  w.addSpacer(10)
  if (!CALCIO) {
    sectionLabel(w, "Set"); w.addSpacer(4)
    const tb = w.addStack(); tb.layoutVertically(); tb.spacing = 2
    const n = m.parziali.length, nameW = 120, cw = Math.floor((LRG.w - nameW - 12) / 5)
    const head = tb.addStack(); head.setPadding(0, 6, 0, 6); head.addSpacer(nameW)
    for (let i = 0; i < n; i++) cell(head, `S${i + 1}`, cw, Font.semiboldSystemFont(9), C.sub, "center")
    ;[0, 1].forEach(sd => {
      const name = sd ? m.away : m.home
      const rw = tb.addStack(); rw.centerAlignContent(); rw.setPadding(3, 6, 3, 6); rw.cornerRadius = 7
      rw.backgroundColor = isMine(name) ? C.hl : C.stripe
      const nc = rw.addStack(); nc.size = new Size(nameW, 0); nc.centerAlignContent(); nc.spacing = 5
      logo(nc, name, 14)
      const t1 = txt(nc, name, F_TXT, isMine(name) ? C.hlText : C.text, isMine(name) ? "bold" : "regular"); t1.minimumScaleFactor = 0.8
      nc.addSpacer()
      m.parziali.forEach(p => { const won = p[sd] > p[1 - sd]; cell(rw, p[sd], cw, won ? Font.boldRoundedSystemFont(F_TXT) : Font.systemFont(F_TXT), won ? C.text : C.sub, "center") })
    })
    // andamento: una barra per set, divisa in proporzione ai punti (in colore la squadra seguita)
    if (n) {
      w.addSpacer(10)
      const tot = [0, 1].map(k => m.parziali.reduce((a, p) => a + p[k], 0))
      const hd = w.addStack(); hd.centerAlignContent()
      sectionLabel(hd, "Andamento"); hd.addSpacer()
      txt(hd, `punti ${tot[0]} - ${tot[1]}`, 9, C.sub, "semibold")
      w.addSpacer(4)
      const bars = w.addStack(); bars.layoutVertically(); bars.spacing = 4
      const BW = LRG.w - 2 * 26 - 16
      m.parziali.forEach((p, i) => {
        const rw = bars.addStack(); rw.centerAlignContent(); rw.spacing = 8
        const hw = p[0] > p[1]
        cell(rw, p[0], 26, hw ? Font.boldRoundedSystemFont(F_SUB) : Font.systemFont(F_SUB), hw ? C.text : C.sub, "center")
        const bar = rw.addStack(); bar.size = new Size(BW, 8); bar.cornerRadius = 4
        const a = Math.max(4, Math.round(BW * p[0] / Math.max(1, p[0] + p[1])))
        const L = bar.addStack(); L.size = new Size(a, 8); L.backgroundColor = isMine(m.home) ? C.accent : C.chip
        const R = bar.addStack(); R.size = new Size(BW - a, 8); R.backgroundColor = isMine(m.away) ? C.accent : C.chip
        cell(rw, p[1], 26, !hw ? Font.boldRoundedSystemFont(F_SUB) : Font.systemFont(F_SUB), !hw ? C.text : C.sub, "center")
      })
    }
  } else {
    sectionLabel(w, "Cronaca"); w.addSpacer(4)
    let ev = info.events
    if (!ev.length) txt(w, "Cronaca non disponibile", F_SUB, C.sub)
    const rows = Math.max(2, Math.floor((avail - 10 - 16 - prevH) / 16))
    // troppi eventi: si tolgono le ammonizioni una alla volta (dalle ultime), poi la riga di fine tempo;
    // i gol restano sempre, e solo se non bastano ancora si tengono gli ultimi
    while (ev.length > rows && ev.some(e => e.type === "giallo")) { const i = ev.map(e => e.type).lastIndexOf("giallo"); ev = ev.filter((_, k) => k !== i) }
    if (ev.length > rows) ev = ev.filter(e => e.type !== "fine")
    if (ev.length > rows) ev = ev.slice(-rows)
    const list = w.addStack(); list.layoutVertically(); list.spacing = 2
    const half = Math.floor((LRG.w - 44) / 2)
    for (const e of ev) {
      const rw = list.addStack(); rw.centerAlignContent(); rw.setPadding(1, 6, 1, 6); rw.cornerRadius = 6
      if (e.type === "fine") {
        rw.addSpacer(); txt(rw, `${e.text.toUpperCase()} · ${e.score}`, 9, C.sub, "semibold"); rw.addSpacer(); continue
      }
      const mine = isMine(e.side === "home" ? m.home : m.away)
      rw.backgroundColor = e.type === "gol" && mine ? C.hl : C.stripe
      const L = rw.addStack(); L.size = new Size(half, 0); L.centerAlignContent(); L.addSpacer()
      if (e.side === "home") txt(L, eventText(e), F_SUB, mine && e.type === "gol" ? C.hlText : C.text, e.type === "gol" ? "semibold" : "regular").minimumScaleFactor = 0.8
      cell(rw, minText(e), 32, Font.semiboldRoundedSystemFont(9), C.sub, "center")
      const R = rw.addStack(); R.size = new Size(half, 0); R.centerAlignContent()
      if (e.side === "away") txt(R, eventText(e), F_SUB, mine && e.type === "gol" ? C.hlText : C.text, e.type === "gol" ? "semibold" : "regular").minimumScaleFactor = 0.8
      R.addSpacer()
    }
  }
  w.addSpacer()
  if (prev.length) {
    sectionLabel(w, "Precedenti"); w.addSpacer(4)
    const pl = w.addStack(); pl.layoutVertically(); pl.spacing = 2
    for (const p of prev) {
      const rw = pl.addStack(); rw.centerAlignContent(); rw.spacing = 5; rw.setPadding(2, 6, 2, 6); rw.cornerRadius = 6; rw.backgroundColor = C.stripe
      cell(rw, fmtDate(p.ts) + "/" + String(new Date(p.ts).getFullYear()).slice(2), 52, Font.systemFont(9), C.sub, "left")
      const hw = p.sets && p.sets[0] > p.sets[1], aw = p.sets && p.sets[1] > p.sets[0]
      cell(rw, p.home, "flex", hw ? Font.semiboldSystemFont(F_SUB) : Font.systemFont(F_SUB), isMine(p.home) ? C.hlText : C.text, "right")
      cell(rw, p.sets ? `${p.sets[0]} - ${p.sets[1]}` : "–", 38, Font.boldRoundedSystemFont(F_SUB), C.text, "center")
      cell(rw, p.away, "flex", aw ? Font.semiboldSystemFont(F_SUB) : Font.systemFont(F_SUB), isMine(p.away) ? C.hlText : C.text, "left")
    }
  }
}

// ───────────────────────── widget a tutta pagina ─────────────────────────

// Panoramica: squadra + classifica + giornata. Su iPad in due colonne, su iPhone una sotto l'altra.
function dashboard(w, d) {
  const t = teamData(d)
  const g = currentGiornata(d)
  const wide = Device.isPad()
  header(w, d, "Panoramica")
  w.addSpacer(8)

  const teamBlock = (stack, width) => {
    if (!TEAM || (!t.me && !t.last && !t.next)) return
    const row = stack.addStack(); row.topAlignContent(); row.spacing = 12
    const leftW = Math.round(width * 0.47)
    teamCard(row, d, t, 38, leftW)
    const r = row.addStack(); r.layoutVertically(); r.spacing = 2
    lastBlock(r, t, 11)
    r.addSpacer(6)
    nextBlock(r, d, t, 11)
  }
  const standingsBlock = stack => {
    if (!d.standings.length) return
    sectionLabel(stack, "Classifica")
    stack.addSpacer(3)
    standingsTable(stack, d.standings.slice(0, 14), 11, 2)
  }
  const roundBlock = (stack, width) => {
    if (!g.cur) return
    sectionLabel(stack, prettyGiornata(g.cur.label))
    stack.addSpacer(3)
    const list = stack.addStack(); list.layoutVertically(); list.spacing = 3
    const ms = d.ko ? pickMatches(roundList(d, g.cur), 7) : g.cur.matches.slice(0, 7), lay = rowLayout(ms, width, 11)
    ms.forEach(m => matchRow(list, m, width, 11, false, true, lay))
  }

  if (wide) {
    const cols = w.addStack(); cols.topAlignContent(); cols.spacing = 16
    const colW = (INNER * 2 - 16) / 2
    const l = cols.addStack(); l.layoutVertically()
    standingsBlock(l)
    const r = cols.addStack(); r.layoutVertically()
    teamBlock(r, colW)
    r.addSpacer(10)
    roundBlock(r, colW)
  } else {
    teamBlock(w, INNER)
    w.addSpacer(12)
    roundBlock(w, INNER)
    w.addSpacer(12)
    standingsBlock(w)
  }
  w.addSpacer()
}

// ───────────────────────── calendario e Siri ─────────────────────────

// Modalità "solo calendario": la parola "calendario" in uno qualsiasi degli input di Comandi Rapidi
function wantsCalendar() {
  let all = []
  try {
    for (const v of [args.shortcutParameter, args.plainTexts, args.urls, args.queryParameters && args.queryParameters.mode]) {
      if (v === undefined || v === null) continue
      all = all.concat(Array.isArray(v) ? v : [v])
    }
  } catch (e) {}
  return all.some(v => /calendario/i.test(typeof v === "string" ? v : JSON.stringify(v)))
}

async function syncCalendar(d, silent) {
  const say = async (title, msg) => { if (silent) return; const a = new Alert(); a.title = title; if (msg) a.message = msg; a.addAction("OK"); await a.present() }
  if (!TEAM) return say("Nessuna squadra impostata", "Imposta CONFIG.squadra all'inizio dello script.")
  const mine = d.matches.filter(isMyMatch)
  if (!mine.length) return say("Nessuna partita trovata")
  const cal = await pickCalendar(say, silent)
  if (!cal) return
  if (!cal.allowsContentModifications) {
    await say("Calendario non modificabile", `"${cal.title}" è di sola lettura (es. Festività o un calendario sottoscritto). Riprova scegliendone un altro.`)
    try { Keychain.remove(calKey()) } catch (e) {}
    return
  }
  const from = new Date(Math.min(...mine.map(m => m.ts)) - 60 * 864e5) // (le partite da definire hanno la data della loro giornata)
  const to = new Date(Math.max(...mine.map(m => m.ts)) + 60 * 864e5)
  const byCode = {}
  for (const e of await CalendarEvent.between(from, to, [cal])) {
    const m = (e.notes || "").match(/id:(\S+)/)
    if (m) byCode[m[1]] = e
  }
  let added = 0, updated = 0, errors = 0, lastError = ""
  for (const m of mine) {
    if (m.tbd) continue // data da definire: l'evento resta com'era finché il sito non fissa la nuova data
    const want = {
      title: m.sets ? `${ICON} ${m.home} ${m.sets[0]}-${m.sets[1]} ${m.away}` : `${ICON} ${m.home} – ${m.away}`,
      location: venueOf(d, m),
      notes: [prettyGiornata(m.giornata), m.parziali.length ? "Parziali: " + m.parziali.map(p => p.join("-")).join(", ") : "", m.href, `id:${m.code}`].filter(Boolean).join("\n"),
    }
    const old = byCode[m.code]
    // salva solo se qualcosa è cambiato (orario, luogo, risultato)
    if (old && old.title === want.title && (old.location || "") === want.location && old.notes === want.notes &&
        old.startDate.getTime() === m.ts) continue
    try {
      const e = old || new CalendarEvent()
      if (!old) e.calendar = cal
      e.title = want.title
      e.location = want.location
      e.notes = want.notes
      e.startDate = new Date(m.ts)
      e.endDate = new Date(m.ts + 2 * 3600e3)
      e.save()
      old ? updated++ : added++
    } catch (err) { errors++; lastError = String(err && err.message || err) }
  }
  // pulizia: le partite di QUESTO girone finite in un altro calendario (es. quello di un altro script)
  // si tolgono da lì, perché ora stanno nel calendario scelto. Si riconoscono dal codice partita (id:…)
  let moved = 0
  try {
    const codes = new Set(mine.map(m => m.code))
    for (const e of await CalendarEvent.between(from, to)) {
      const id = ((e.notes || "").match(/id:(\S+)/) || [])[1]
      if (!id || !codes.has(id) || !e.calendar || e.calendar.identifier === cal.identifier) continue
      if (!e.calendar.allowsContentModifications) continue
      try { e.remove(); moved++ } catch (err) {}
    }
  } catch (e) {}
  await say(errors ? "Calendario aggiornato con errori" : "Calendario aggiornato",
    `Calendario "${cal.title}": ${added} partite aggiunte, ${updated} aggiornate.` +
    (moved ? `\n${moved} partite tolte da altri calendari, dove erano finite per errore.` : "") +
    (errors ? `\n${errors} non salvate: ${lastError}` : "\nD'ora in poi si aggiorna da solo (widget o automazione)."))
  return { added, updated, errors, moved }
}

// Scriptable non può creare calendari di eventi: usa "CSI · <squadra>" se esiste,
// altrimenti fa scegliere un calendario la prima volta e lo ricorda
// ogni script (es. "CSI Volley", "CSI Calcio") ricorda il proprio calendario
function scriptName() { try { return Script.name() || "CSI" } catch (e) { return "CSI" } }
function calKey() { return `csi-calendario-${scriptName()}` }

async function pickCalendar(say, silent) {
  // La scelta è salvata nel Portachiavi di Scriptable: è condiviso tra app, widget e Comandi Rapidi
  // (il file in documentsDirectory non è visibile quando lo script gira da un'automazione)
  const KEY = calKey()
  let saved = ""
  try { if (Keychain.contains(KEY)) saved = Keychain.get(KEY) } catch (e) {}
  // versioni precedenti: un'unica scelta per tutti gli script, che resta allo script originale "CSI Volley"
  if (!saved && scriptName() === "CSI Volley") { try { if (Keychain.contains("csi-volley-calendario")) saved = Keychain.get("csi-volley-calendario") } catch (e) {} }
  if (!saved && scriptName() === "CSI Volley") {
    try {
      const fm = FileManager.local(), p = fm.joinPath(fm.documentsDirectory(), "csi-volley-calendario.txt")
      if (fm.fileExists(p)) saved = fm.readString(p)
    } catch (e) {}
  }
  // ricerca per nome ignorando spazi in più e maiuscole
  const key = t => String(t || "").toLowerCase().replace(/\s+/g, " ").trim()
  const wanted = [saved, `CSI · ${TEAM}`].filter(Boolean).map(key)
  try {
    const all = await Calendar.forEvents()
    for (const w of wanted) {
      const c = all.find(x => key(x.title) === w)
      if (c) { try { Keychain.set(KEY, c.title) } catch (e) {} ; return c }
    }
  } catch (e) {}
  if (silent) return null // in automatico non chiede nulla: serve la prima configurazione dall'app
  await say("Scegli il calendario",
    `Nella schermata seguente scegli dove inserire le partite. Se vuoi un calendario dedicato, crealo prima nell'app Calendario con il nome "CSI · ${TEAM}" e verrà usato in automatico.`)
  try {
    const [cal] = await Calendar.presentPicker(false)
    if (cal) { try { Keychain.set(KEY, cal.title) } catch (e) {} }
    // attende che il selettore si chiuda: un avviso aperto subito dopo può restare bloccato
    await new Promise(r => Timer.schedule(700, false, r))
    return cal
  } catch (e) { return null } // scelta annullata
}


function siriText(d) {
  const days = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"]
  const months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
  const when = ts => { const c = countdown(ts), dt = new Date(ts); return (c === "oggi" || c === "domani") ? c : `${days[dt.getDay()]} ${dt.getDate()} ${months[dt.getMonth()]}` }
  const score = m => myScore(m).replace("-", " a ")
  if (!TEAM) {
    const l = d.standings[0]
    return l ? `In testa al girone c'è ${l.name} con ${l.pt} punti.` : "Non ho trovato la classifica."
  }
  const t = teamData(d), out = []
  if (t.me) out.push(`${TEAM} è al ${t.me.pos}° posto con ${t.me.pt} ${t.me.pt === 1 ? "punto" : "punti"}.`)
  const ks = koStatus(d)
  if (ks) out.push(ks.state === "open" ? `Turno in corso: ${ks.round}.`
    : ks.text === "Vincitrice" ? `${TEAM} ha vinto la finale.`
    : /posto/.test(ks.text) ? `${TEAM} ha chiuso al ${ks.text}.`
    : ks.state === "won" ? `${TEAM} ha passato il turno (${ks.round}).`
    : `${TEAM} è stata eliminata (${ks.round}).`)
  if (t.last) out.push(`Ultima partita: ${{ V: "vittoria", N: "pareggio", P: "sconfitta" }[res(t.last)]} ${t.last.dcr ? "ai rigori " : ""}${score(t.last)} ${isMine(t.last.home) ? "in casa contro" : "in trasferta contro"} ${opp(t.last)}.`)
  if (t.next && waiting(t.next)) out.push(`Oggi alle ${fmtTime(t.next.ts)} ${isMine(t.next.home) ? "in casa contro" : "in trasferta contro"} ${opp(t.next)}: il risultato non è ancora pubblicato.`)
  else if (t.next) out.push(`Prossima partita ${when(t.next.ts)} alle ${fmtTime(t.next.ts)}, ${isMine(t.next.home) ? "in casa contro" : "in trasferta contro"} ${opp(t.next)}.`)
  return out.join(" ") || `Non ho trovato partite di ${TEAM}.`
}

// ───────────────────────── scheda partita ─────────────────────────

// Il tap su una partita riapre questo script con ?partita=CODICE
function matchUrl(m) {
  try { return `scriptable:///run/${encodeURIComponent(Script.name())}?partita=${encodeURIComponent(m.code)}` }
  catch (e) { return m.href }
}

async function showMatch(d, m) {
  LOGOS = await loadLogos(d)
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
  const img = n => { try { return "data:image/png;base64," + Data.fromPNG(LOGOS[n] || avatar(n)).toBase64String() } catch (e) { return "" } }
  const st = n => d.standings.find(s => s.name === n)
  const v = venueOf(d, m)
  const hw = m.sets && m.sets[0] > m.sets[1], aw = m.sets && m.sets[1] > m.sets[0]
  const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"]
  const dt = new Date(m.ts)
  const team = (n, win) => {
    const s = st(n)
    return `<div class="team ${win ? "win" : ""} ${isMine(n) ? "mine" : ""}">
      <img src="${img(n)}"><div class="tn">${esc(n)}</div>
      <div class="ts">${s ? `${s.pos}° · ${s.pt} pt` : ""}</div></div>`
  }
  const center = m.sets
    ? `<div class="score ${m.ufficioso ? "uff" : ""}"><span class="${hw ? "w" : ""}">${m.sets[0]}</span><span class="sep">–</span><span class="${aw ? "w" : ""}">${m.sets[1]}</span></div><div class="state ${m.ufficioso ? "uff" : ""}">${m.dcr ? "Dopo i calci di rigore · " : ""}${m.ufficioso ? "Ufficioso" : "Omologato"}</div>`
    : m.tbd ? `<div class="time">–</div><div class="state">Data da definire</div>`
    : `<div class="time">${fmtTime(m.ts)}</div><div class="state">${countdown(m.ts)}</div>`
  const sets = m.parziali.length ? `<div class="card ${m.ufficioso ? "sets-uff" : ""}"><h3>Set</h3><table>
      <tr><th></th>${m.parziali.map((_, i) => `<th>${i + 1}°</th>`).join("")}</tr>
      <tr><td class="tl">${esc(m.home)}</td>${m.parziali.map(p => `<td class="${p[0] > p[1] ? "w" : ""}">${p[0]}</td>`).join("")}</tr>
      <tr><td class="tl">${esc(m.away)}</td>${m.parziali.map(p => `<td class="${p[1] > p[0] ? "w" : ""}">${p[1]}</td>`).join("")}</tr>
    </table></div>` : ""
  const other = d.matches.filter(x => x.code !== m.code && [x.home, x.away].includes(m.home) && [x.home, x.away].includes(m.away))
  const h2h = other.length ? `<div class="card"><h3>${other[0].ts < m.ts ? "Precedente" : "Ritorno"}</h3>${other.map(x =>
      `<div class="row"><span>${x.tbd ? "da definire" : `${days[new Date(x.ts).getDay()].slice(0, 3)} ${fmtDate(x.ts)}`}</span><span>${esc(x.home)} ${x.sets ? `<b>${x.sets[0]}-${x.sets[1]}</b>` : "–"} ${esc(x.away)}</span></div>`).join("")}</div>` : ""
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--uff:#DC2626;--bg:#F4F6FA;--card:#fff;--text:#0F172A;--sub:#64748B;--chip:#E3E9F4;--acc:#F5A524;--hl:#9A5B00;--win:#15803D}
@media (prefers-color-scheme:dark){:root{--bg:#0D1320;--card:#162033;--text:#F1F5F9;--sub:#8B9AB0;--chip:#1E2B42;--hl:#FFC861;--win:#4ADE80;--uff:#FF6B6B}}
*{box-sizing:border-box}body{margin:0;padding:18px 16px 40px;background:var(--bg);color:var(--text);font:15px -apple-system,system-ui}
.top{text-align:center;color:var(--sub);font-size:13px;font-weight:600;letter-spacing:.3px}
.top b{color:var(--text)}
.match{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin:22px 0 18px}
.team{flex:1;text-align:center;opacity:.75}.team.win,.team.mine{opacity:1}
.team img{width:64px;height:64px;border-radius:50%;background:#fff;object-fit:contain}
.tn{margin-top:8px;font-weight:600;font-size:15px}.team.win .tn{font-weight:800}.team.mine .tn{color:var(--hl)}
.ts{color:var(--sub);font-size:12px;margin-top:2px}
.mid{flex:0 0 96px;text-align:center;padding-top:12px}
.score{font-size:38px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--sub)}.score .w{color:var(--text)}.score.uff,.score.uff .w,.state.uff,.sets-uff td.w{color:var(--uff)}
.warn{background:rgba(220,38,38,.1);color:var(--uff);font-weight:600}.sep{margin:0 6px;font-weight:400}
.time{font-size:30px;font-weight:800}.state{color:var(--sub);font-size:12px;font-weight:600;text-transform:uppercase;margin-top:2px}
.card{background:var(--card);border-radius:14px;padding:14px;margin-top:12px}
h3{margin:0 0 10px;font-size:12px;color:var(--sub);text-transform:uppercase;letter-spacing:.5px}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
th{color:var(--sub);font-size:12px;font-weight:600;padding:4px}td{text-align:center;padding:6px 4px;color:var(--sub)}
td.w{color:var(--text);font-weight:800}td.tl{text-align:left;color:var(--text);font-weight:600;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.row{display:flex;justify-content:space-between;gap:10px;padding:4px 0;font-size:14px}.row span:first-child{color:var(--sub)}
.btns{display:flex;gap:10px;margin-top:16px}
.btn{flex:1;display:block;text-align:center;padding:12px;border-radius:12px;background:var(--chip);color:var(--text);text-decoration:none;font-weight:600;font-size:14px}
.btn.acc{background:var(--acc);color:#fff}
.venue{color:var(--sub);font-size:14px;line-height:1.4}
</style></head><body>
<div class="top"><b>${esc(prettyGiornata(m.giornata))}</b> · ${m.tbd ? "data da definire" : `${days[dt.getDay()]} ${dt.getDate()}/${dt.getMonth() + 1} · ${fmtTime(m.ts)}`}</div>
<div class="match">${team(m.home, hw)}<div class="mid">${center}</div>${team(m.away, aw)}</div>
${sets}
${m.variazione ? `<div class="card warn">⚠︎ Variazione di campo: ${esc(titleCase(m.variazione))}</div>` : ""}
${v ? `<div class="card"><h3>Palestra</h3><div class="venue">${esc(v)}</div></div>` : ""}
${h2h}
<div class="btns">${v ? `<a class="btn acc" href="${mapsUrl(v)}">📍 ${navName()}</a>` : ""}<a class="btn" href="${esc(m.href)}">Pagina CSI</a></div>
</body></html>`
  const wv = new WebView()
  wv.shouldAllowRequest = req => {
    if (/^https?:/i.test(req.url)) { Safari.open(req.url); return false }
    return true
  }
  await wv.loadHTML(html)
  await wv.present(false)
}

// ───────────────────────── blocchi grafici ─────────────────────────

function header(w, d, subtitle, compact, fixed) {
  const h = w.addStack(); h.centerAlignContent(); h.spacing = 7
  const ic = h.addStack(); ic.size = new Size(26, 26); ic.cornerRadius = 13
  ic.backgroundColor = C.accent; ic.centerAlignContent()
  const img = symbol(CALCIO ? "soccerball" : "volleyball.fill", 14)
  if (img) { const i = ic.addImage(img); i.imageSize = new Size(15, 15); i.tintColor = Color.white() }
  const tt = h.addStack(); tt.layoutVertically()
  if (compact) {
    // in grande cosa mostra il widget, sotto il girone (dimensioni fisse, uguali in tutti i widget)
    txt(tt, subtitle, 12, C.text, "bold")
    // nel piccolo un titolo lungo accorcia la prima parola ("Dilettanti B · Girone C" → "Dilett. B · Girone C")
    let st = d.title
    if (FAMILY === "small" && st.length > 18) st = st.replace(/^(\S{6})\S{2,}/, "$1.")
    const g = txt(tt, st, F_SUB, C.sub, "semibold"); g.lineLimit = 1; g.minimumScaleFactor = 0.85
    h.addSpacer()
    return h
  }
  // nei grandi (fixed) come nei piccoli e medi: in grande la funzione del widget, sotto il campionato
  const top = fixed ? subtitle : d.title, bottom = fixed ? d.title : subtitle
  const t = txt(tt, top, 13, C.text, "bold"); t.minimumScaleFactor = fixed ? 1 : 0.6
  const s = txt(tt, bottom, 10, C.sub, "semibold"); s.minimumScaleFactor = fixed ? 1 : 0.7
  h.addSpacer()
  return h
}

// Piè di pagina: compare solo se il sito CSI non ha risposto e il widget mostra i dati salvati
function footer(w, d) {
  if (!d.fromCache) return
  const when = isToday(d.fetched) ? fmtTime(d.fetched) : `${fmtDate(d.fetched)} ${fmtTime(d.fetched)}`
  const f = w.addStack(); f.addSpacer()
  txt(f, `⚠︎ dati delle ${when}`, 9, C.lose, "semibold")
  f.addSpacer()
}

function updatedLabel(stack, d) {
  const when = isToday(d.fetched) ? fmtTime(d.fetched) : fmtDate(d.fetched)
  return txt(stack, (d.fromCache ? "⚠︎ " : "") + when, 9, d.fromCache ? C.lose : C.sub)
}

function sectionLabel(stack, s) {
  return txt(stack, s.toUpperCase(), 9, C.sub, "semibold")
}

// Cella a larghezza fissa. Gli spaziatori di iOS hanno una larghezza minima (~8pt),
// quindi si usano solo nelle celle larghe: le strette restano centrate dal frame.
// width = "flex": la cella si allarga a riempire lo spazio libero (diviso in parti uguali tra le celle flex)
function cell(parent, value, width, font, color, align, shrink) {
  const flex = width === "flex"
  const s = parent.addStack(); if (!flex) s.size = new Size(Math.max(8, width), 0); s.centerAlignContent()
  const wide = flex || width > 36
  if (align === "right" && wide) s.addSpacer()
  const t = s.addText(String(value)); t.font = font; t.textColor = color; t.lineLimit = 1
  t.minimumScaleFactor = shrink ? 0.7 : 1
  if (align === "left" && wide) s.addSpacer()
  return { stack: s, text: t }
}

function txt(stack, s, size, color, weight) {
  const t = stack.addText(String(s))
  t.font = weight === "bold" ? Font.boldSystemFont(size) : weight === "semibold" ? Font.semiboldSystemFont(size) : Font.systemFont(size)
  t.textColor = color || C.text
  t.lineLimit = 1
  return t
}

function symbol(name, size) {
  try {
    const s = SFSymbol.named(name) || SFSymbol.named("sportscourt.fill")
    s.applyFont(Font.boldSystemFont(size))
    return s.image
  } catch (e) { return null }
}

// ───────────────────────── app ─────────────────────────

async function appMenu(d, e) {
  if (e) {
    const a = new Alert()
    a.title = "Errore"
    a.message = String(e.message || e)
    a.addAction("Copia HTML pagina (per debug)")
    a.addCancelAction("Chiudi")
    if (await a.presentAlert() === 0) await copyHTML()
    return
  }
  const a = new Alert()
  a.title = d.title
  a.message = `${d.standings.length} squadre · ${d.matches.length} partite (${played(d).length} giocate) · ${Object.keys(d.logos || {}).length} loghi` +
    (TEAM ? `\nSquadra evidenziata: ${TEAM}` : "") +
    (d.fromCache ? `\n⚠︎ Dati dalla cache: ${d.error}` : "")
  const opts = [
    ["Classifica · piccolo", "classifica", "small"], ["Classifica · medio", "classifica", "medium"], ["Classifica · grande", "classifica", "large"],
    ["Risultati · piccolo", "risultati", "small"], ["Risultati · medio", "risultati", "medium"], ["Risultati · grande", "risultati", "large"],
    ["Squadra · piccolo", "squadra", "small"], ["Squadra · medio", "squadra", "medium"], ["Squadra · grande", "squadra", "large"],
    ["Panoramica · piccolo", "panoramica", "small"], ["Panoramica · medio", "panoramica", "medium"], ["Panoramica · grande", "panoramica", "large"],
    ["Ultima partita · piccolo", "ultima", "small"], ["Ultima partita · medio", "ultima", "medium"], ["Ultima partita · grande", "ultima", "large"],
  ]
  if (Device.isPad()) opts.push(["Panoramica · tutta pagina", "", "extraLarge"])
  opts.forEach(o => a.addAction(o[0]))
  a.addAction("Aggiorna Calendario")
  a.addAction("Mostra tutti i dati")
  a.addAction("Copia HTML pagina (per debug)")
  a.addCancelAction("Chiudi")
  const i = await a.presentSheet()
  if (i < 0) return
  if (i < opts.length) {
    const [, view, fam] = opts[i]
    const w = await buildWidget(d, fam, view)
    if (fam === "small") await w.presentSmall()
    else if (fam === "medium") await w.presentMedium()
    else if (fam === "extraLarge") await w.presentExtraLarge()
    else await w.presentLarge()
  } else if (i === opts.length) await syncCalendar(d)
  else if (i === opts.length + 1) await showTable(d)
  else await copyHTML()
}

async function showTable(d) {
  const t = new UITable(); t.showSeparators = true
  const add = (title, sub, header) => { const r = new UITableRow(); r.isHeader = !!header; r.addText(title, sub); t.addRow(r) }
  if (d.standings.length) add("Classifica", undefined, true)
  for (const s of d.standings) add(`${s.pos}. ${s.name} — ${s.pt} pt`, `${CALCIO ? `G ${s.pg} V ${s.v} N ${s.n} P ${s.p} · gol ${s.gf}-${s.gs} · DR ${s.dr}` : `G ${s.pg} V ${s.v} P ${s.p} · set ${s.sv}-${s.sp} · QS ${s.qs}`}${d.logos && d.logos[s.name] ? " · logo ✓" : ""}`)
  let g = null
  for (const m of d.matches) {
    if (m.giornata !== g) { g = m.giornata; add(prettyGiornata(g) || "Partite", undefined, true) }
    const res = m.sets ? `${m.sets[0]}-${m.sets[1]}${m.dcr ? " (rig.)" : ""}` : "–"
    const parz = m.parziali.map(p => p.join("-")).join(", ")
    add(`${m.home}  ${res}  ${m.away}`, `${fmtDate(m.ts)} ${fmtTime(m.ts)}${parz ? " · " + parz : ""}`)
  }
  await t.present(false)
}

async function copyHTML() {
  try {
    Pasteboard.copyString(await fetchHTML(URL_GIRONE))
    const a = new Alert(); a.title = "HTML copiato negli appunti"; a.addAction("OK"); await a.present()
  } catch (e) {
    const a = new Alert(); a.title = "Errore"; a.message = String(e.message || e); a.addAction("OK"); await a.present()
  }
}

// ───────────────────────── utilità ─────────────────────────

function played(d) { return d.matches.filter(m => m.sets).sort((a, b) => b.ts - a.ts) }
function upcoming(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return d.matches.filter(m => !m.sets && m.ts >= today.getTime()).sort((a, b) => a.ts - b.ts)
}
function allTeams(d) { return [...new Set(d.standings.map(s => s.name).concat(d.matches.flatMap(m => [m.home, m.away])))] }

function giornate(d) {
  const g = []
  for (const m of d.matches) {
    let x = g.find(y => y.label === m.giornata)
    if (!x) { x = { label: m.giornata, matches: [] }; g.push(x) }
    x.matches.push(m)
  }
  g.forEach(x => { x.matches.sort((a, b) => a.ts - b.ts); x.first = x.matches[0].ts })
  return g.sort((a, b) => a.first - b.first)
}

// Giornata in corso, costruita attorno alla squadra seguita: è la giornata della sua ultima partita,
// e dal giorno della sua prossima partita diventa quella della prossima (anche se è un recupero
// di una giornata vecchia). Sotto, nel Risultati grande, la prima giornata con partite ancora da giocare.
// Senza squadra (o senza sue partite) vale la regola generale: si segue il calendario del girone.
function currentGiornata(d) {
  const g = giornate(d)
  if (!g.length) return {}
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999)
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0)
  const mine = TEAM ? d.matches.filter(m => isMyMatch(m) && !m.tbd).sort((a, b) => a.ts - b.ts) : []
  // coppe: una squadra eliminata non ha più turni suoi, si segue il tabellone come senza squadra
  const out = d.ko && (koStatus(d) || {}).state === "out"
  if (mine.length && !out) {
    const started = mine.filter(m => m.ts <= endToday.getTime())
    const focus = started.length ? started[started.length - 1] : mine[0]
    const cur = g.find(x => x.label === focus.giornata)
    if (cur) {
      // sotto: la prima giornata (dopo quella mostrata) con partite ancora da giocare
      const open = g.filter(x => x !== cur && x.matches.some(m => !m.sets && !m.tbd && m.ts >= startToday.getTime()))
      return { cur, next: open.find(x => x.first >= cur.first) || open[0] }
    }
  }
  return generalGiornata(g, d, endToday)
}

// Regola generale: giornata dell'ultimo risultato; dal giorno in cui inizia la successiva si passa avanti
// anche se nella precedente manca ancora qualche risultato (es. partita rinviata)
function generalGiornata(g, d, endToday) {
  const last = played(d)[0]
  let i = last ? g.findIndex(x => x.label === last.giornata) : -1
  if (i < 0) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    i = g.findIndex(x => x.matches.some(m => m.ts >= today.getTime()))
    if (i < 0) i = g.length - 1
  }
  while (g[i + 1] && g[i + 1].first > 0 && g[i + 1].first <= endToday.getTime()) i++
  return { cur: g[i], next: g[i + 1] }
}

function prettyGiornata(label, short) {
  const m = String(label || "").match(/^(\S+)\s+(\d+)$/)
  if (!m) return roundTitle(label)
  return short ? `${m[1]} · G${m[2]}` : `${m[1]} · Giornata ${m[2]}`
}

// ── coppe e fasi finali (turni a eliminazione) ──

// Nome breve del turno: "Finale 1°- 2° Posto" → "Finale", "Finale 3°- 4° Posto" → "Finale 3° posto"
function roundTitle(label) {
  const l = String(label || "").replace(/\s+/g, " ").trim()
  const f = l.match(/^finale\s+(\d)°\s*-\s*(\d)°/i)
  if (f) return f[1] === "1" ? "Finale" : `Finale ${f[1]}° posto`
  return l
}

// Partite dei turni raccolte per sfida: andata e ritorno diventano una riga sola.
// Passa il turno chi compare nel turno dopo; altrimenti decide il risultato (somma dei gol, o i rigori).
function koTies(d) {
  if (d._ties) return d._ties
  const g = giornate(d), out = new Map()
  g.forEach((x, gi) => {
    const later = new Set(g.slice(gi + 1).flatMap(y => y.matches.flatMap(m => [norm(m.home), norm(m.away)])))
    const groups = []
    for (const m of x.matches) {
      const key = [norm(m.home), norm(m.away)].sort().join("|")
      let t = groups.find(y => y.key === key)
      if (!t) { t = { key, legs: [] }; groups.push(t) }
      t.legs.push(m)
    }
    out.set(x.label, groups.map(t => makeTie(t.legs, later)))
  })
  d._ties = out
  return out
}

function makeTie(legs, later) {
  const a = legs[0], H = a.home, A = a.away
  // (se tutte e due giocano ancora, es. finale per il 3° posto, decide il risultato)
  const lh = later.has(norm(H)), la = later.has(norm(A))
  const decided = lh && !la ? H : la && !lh ? A : null
  if (legs.length === 1) {
    a.winner = decided || (a.sets && a.sets[0] !== a.sets[1] ? (a.sets[0] > a.sets[1] ? H : A) : null)
    return a
  }
  // punteggi letti sempre nel verso della riga (squadra di sinistra prima)
  const sc = m => !m.sets ? null : m.home === H ? m.sets.slice() : [m.sets[1], m.sets[0]]
  const parts = legs.map(m => { const x = sc(m); return x ? `${m.dcr ? "rig. " : ""}${x[0]}-${x[1]}` : shortWhen(m) })
  const short = legs.map(m => { const x = sc(m); return x ? `${m.dcr ? "r " : ""}${x[0]}-${x[1]}` : shortWhen(m) })
  const done = legs.every(m => m.sets), any = legs.some(m => m.sets)
  let winner = decided
  if (!winner && done) {
    const dcr = legs.find(m => m.dcr)
    const tot = legs.reduce((t, m) => { const x = sc(m); return [t[0] + x[0], t[1] + x[1]] }, [0, 0])
    const x = dcr ? sc(dcr) : tot
    winner = x[0] > x[1] ? H : x[1] > x[0] ? A : null
  }
  const open = legs.find(m => !m.sets && !m.tbd)
  return {
    tie: true, legs, home: H, away: A, giornata: a.giornata, winner,
    ts: (open || legs[legs.length - 1]).ts, tbd: legs.every(m => m.tbd && !m.sets),
    code: (open || legs[legs.length - 1]).code, href: (open || legs[legs.length - 1]).href,
    sets: any && winner ? (winner === H ? [1, 0] : [0, 1]) : null,
    chip: any ? parts.join(" · ") : null, chipLines: any ? short : null,
    ufficioso: legs.some(m => m.ufficioso), parziali: [], campo: (open || a).campo,
  }
}

// Coppe: i turni prima di quello mostrato, dal più recente (per riempire i widget quando il turno ha poche partite)
function earlierRounds(d, cur) {
  if (!d.ko || !cur) return []
  const all = giornate(d), i = all.findIndex(x => x.label === cur.label)
  return all.slice(0, Math.max(0, i)).reverse()
}

// Partite da mostrare per un turno: nelle coppe una riga per sfida, nei campionati le partite
function roundList(d, g) { return !g ? [] : d.ko ? (koTies(d).get(g.label) || g.matches) : g.matches }

// Dove è arrivata la squadra seguita: "Secondo turno", "Qualificata", "Eliminata · Primo turno", "Finale"…
// detail: andata o totale dal punto di vista della squadra ("andata 0-2", "tot. 1-3", "rig. 4-2")
function koStatus(d) {
  if (!d || !d.ko || !TEAM) return null
  const g = giornate(d), ties = koTies(d)
  for (let i = g.length - 1; i >= 0; i--) {
    const t = (ties.get(g[i].label) || []).find(isMyMatch)
    if (!t) continue
    const name = roundTitle(g[i].label), pl = /^finale\s+(\d)°\s*-\s*(\d)°/i.exec(g[i].label)
    const legs = t.legs || [t], mine = legs.filter(m => m.sets)
    const my = m => isMine(m.home) ? m.sets : [m.sets[1], m.sets[0]]
    const detail = legs.length > 1 ? tieDetail(t) : ""
    if (!t.winner) return { text: name, detail, state: "open", round: name, tie: t }
    if (isMine(t.winner)) return { text: pl ? (pl[1] === "1" ? "Vincitrice" : `${pl[1]}° posto`) : "Qualificata", detail, state: "won", round: name, tie: t }
    return { text: pl ? `${pl[2]}° posto` : `Eliminata · ${name}`, detail, state: "out", round: name, tie: t }
  }
  return null
}
// Dove è arrivata ogni squadra: prima i piazzamenti delle finali, poi le squadre ancora in corsa
// (dal turno più avanti), poi le eliminate (dal turno più avanti). A pari turno, l'ordine del sito.
function koRanking(d) {
  const g = giornate(d), ties = koTies(d), teams = new Map()
  g.forEach((x, gi) => {
    const pl = /^finale\s+(\d)°\s*-\s*(\d)°/i.exec(x.label)
    for (const t of ties.get(x.label) || []) for (const n of [t.home, t.away]) {
      const lost = !!t.winner && t.winner !== n
      const r = { name: n, gi, label: x.label, alive: !lost, won: t.winner === n && !pl, order: teams.has(n) ? teams.get(n).order : teams.size }
      if (pl && t.winner) r.place = +(lost ? pl[2] : pl[1])
      teams.set(n, r)
    }
  })
  // chi ha vinto la sfida ma non ha ancora l'avversario del turno dopo: "Qualificata", subito dopo chi gioca già quel turno
  const key = r => r.place ? 1e6 - r.place : r.won ? r.gi * 2 + 2.5 : r.gi * 2 + (r.alive ? 1 : 0)
  return [...teams.values()].sort((a, b) => key(b) - key(a) || a.order - b.order)
}
// "Primo turno" → "1° turno", "Semifinali" → "Semifinale"; i piazzamenti: "🏆", "2°"
function roundShort(label) {
  const n = { primo: 1, secondo: 2, terzo: 3, quarto: 4, quinto: 5 }
  const t = roundTitle(label), m = t.match(/^(primo|secondo|terzo|quarto|quinto)\s+turno$/i)
  if (m) return `${n[m[1].toLowerCase()]}° turno`
  return t.replace(/^Semifinali$/i, "Semifinale").replace(/^Finale \d° posto$/i, "Finale")
}
function koRankText(r) { return r.place ? (r.place === 1 ? "🏆" : `${r.place}°`) : r.won ? "Qualificata" : roundShort(r.label) }
function pickRanking(list, n) {
  const i = list.findIndex(r => isMine(r.name))
  return i >= n ? list.slice(0, n - 1).concat(list[i]) : list.slice(0, n)
}
// Riga del tabellone: logo, nome e a destra il turno (arancione chi è in corsa, grigio chi è uscito)
function koRankRow(stack, r, width, size, nameMax, names) {
  const row = stack.addStack(); row.centerAlignContent(); row.spacing = 4; row.setPadding(0, 3, 0, 3)
  if (width) row.size = new Size(width, 0)
  const mine = isMine(r.name)
  if (mine) { row.backgroundColor = C.hl; row.cornerRadius = 5 }
  logo(row, r.name, size + 3)
  const label = names ? names[r.name] || r.name : nameMax ? compactName(r.name, nameMax) : r.name
  // tutti i nomi della stessa grandezza: se uno è troppo lungo si accorcia con i puntini, non si rimpicciolisce
  txt(row, label, size, mine ? C.hlText : r.alive || r.place ? C.text : C.sub, mine || r.place === 1 ? "bold" : "regular")
  row.addSpacer()
  const st = txt(row, koRankText(r), size - 1, r.place === 1 || (r.alive && !r.place) ? C.hlText : C.sub, r.alive || r.place ? "semibold" : "regular")
  st.minimumScaleFactor = 0.8
}
function koRankSmall(w, d) {
  header(w, d, "Tabellone", true)
  w.addSpacer(6)
  const rows = pickRanking(koRanking(d), 5)
  const col = w.addStack(); col.layoutVertically()
  col.spacing = Math.max(2, Math.min(10, (WIDE * 0.467 - 58 - rows.length * 16) / Math.max(1, rows.length - 1)))
  // nel piccolo i nomi brevi dei risultati ("Excelsior", "Chiuduno", "Spartak")
  const ab = shortNames(allTeams(d))
  for (const r of rows) koRankRow(col, r, INNER_SMALL, F_SUB, 11, ab)
  w.addSpacer()
}
function koRankMedium(w, d) {
  header(w, d, "Tabellone", true)
  w.addSpacer()
  const s = pickRanking(koRanking(d), 12), per = Math.ceil(s.length / 2)
  const row = w.addStack(); row.topAlignContent(); row.spacing = 12
  const gap = Math.max(1, Math.min(10, (MED.h - 30 - per * 14) / Math.max(1, per - 1)))
  for (const part of [s.slice(0, per), s.slice(per)]) {
    const c = row.addStack(); c.layoutVertically(); c.spacing = gap
    for (const x of part) koRankRow(c, x, (INNER - 12) / 2, F_SUB, 12)
  }
  w.addSpacer()
}
function koRankLarge(w, d) {
  header(w, d, "Tabellone", false, true)
  const s = pickRanking(koRanking(d), 30), per = Math.ceil(s.length / 2)
  const size = per > 12 ? 9.5 : F_SUB
  w.addSpacer(8)
  const row = w.addStack(); row.topAlignContent(); row.spacing = 8
  // poche squadre (es. 16 delle fasi finali): righe più distanziate, così riempiono il widget
  const gap = Math.max(1, Math.min(14, (LRG.h - 48 - per * (size + 5)) / Math.max(1, per - 1)))
  for (const part of [s.slice(0, per), s.slice(per)]) {
    const c = row.addStack(); c.layoutVertically(); c.spacing = gap
    for (const x of part) koRankRow(c, x, (LRG.w - 8) / 2, size, 16)
  }
  w.addSpacer()
}

// Risultato di una sfida dal punto di vista della squadra: "tot. 3-1", "rig. 4-2", "andata 0-2", "1-3"
function tieDetail(t) {
  const legs = t.legs || [t], mine = legs.filter(m => m.sets)
  const my = m => isMine(m.home) ? m.sets : [m.sets[1], m.sets[0]]
  if (!mine.length) return ""
  if (legs.length === 1) return `${my(mine[0]).join("-")}${mine[0].dcr ? " rig." : ""}`
  const dcr = mine.find(m => m.dcr)
  if (dcr) return `rig. ${my(dcr).join("-")}`
  if (mine.length === 1) return `andata ${my(mine[0]).join("-")}`
  return `tot. ${mine.reduce((s, m) => [s[0] + my(m)[0], s[1] + my(m)[1]], [0, 0]).join("-")}`
}

// Il cammino della squadra in coppa: un turno per riga, con avversario ed esito (medio "La mia squadra")
function koPath(stack, d, width, maxRows) {
  const g = giornate(d), ties = koTies(d), rows = []
  for (const x of g) { const t = (ties.get(x.label) || []).find(isMyMatch); if (t) rows.push([x.label, t]) }
  if (!rows.length) return
  const ab = shortNames(allTeams(d)) // nomi brevi come nei risultati piccoli
  sectionLabel(stack, "Percorso")
  stack.addSpacer(3)
  const box = stack.addStack(); box.layoutVertically(); box.spacing = 3
  const shown = rows.slice(-(maxRows || 4))
  // nel piccolo etichette brevi ("Semi", "1° t."), così il nome dell'avversario entra intero
  const lab = l => width < 150 ? roundShort(l).replace(/^Semifinale$/, "Semi").replace(/ turno$/, " t.") : roundShort(l)
  // colonna del turno larga quanto l'etichetta più lunga (+ i ~8 punti che iOS tiene per lo spaziatore)
  const RW = Math.ceil(Math.max(...shown.map(([l]) => lab(l).length)) * 9 * 0.52) + 10
  for (const [label, t] of shown) {
    const r = box.addStack(); r.centerAlignContent(); r.spacing = 4; r.size = new Size(width, 0)
    r.url = matchUrl(t.legs ? t.legs[t.legs.length - 1] : t)
    // colonne fisse: turno, avversario (senza logo, così il nome entra), esito a destra
    // testi semplici, senza celle a larghezza fissa: nelle celle iOS riserva ~8 punti a ogni spaziatore
    // e i nomi si tagliavano ("1° turno" e "2° turno" sono lunghi uguali, quindi restano allineati)
    cell(r, lab(label), RW, Font.semiboldSystemFont(9), C.sub, "left")
    const o = isMine(t.home) ? t.away : t.home
    txt(r, ab[o] || o, F_SUB, C.text).minimumScaleFactor = 0.85
    r.addSpacer()
    const det = tieDetail(t), next = (t.legs || [t]).find(m => !m.sets && !m.tbd)
    const won = t.winner && isMine(t.winner), lost = t.winner && !won
    const right = det && !/^andata/.test(det) ? det.replace(/^tot\. /, "") : next ? shortWhen(next) : det
    txt(r, right || "–", 9, won ? C.win : lost ? C.lose : C.sub, "semibold")
  }
}

function koColor(st) { return st.state === "won" ? C.win : st.state === "out" ? C.lose : C.hlText }

function myStanding(d) { return TEAM ? d.standings.find(s => isMine(s.name)) : null }
function pickStandings(d, n) {
  const s = d.standings, me = myStanding(d)
  return me && me.pos > n ? s.slice(0, n - 1).concat(me) : s.slice(0, n)
}
function isMine(name) { return !!TEAM && norm(name) === norm(TEAM) }
function isMyMatch(m) { return isMine(m.home) || isMine(m.away) }

// Parametro libero, parti separate da virgola o punto e virgola:
//   "risultati"   "panoramica, Pcq 1971"   "<link del girone>, Nome squadra"   "squadra=Pcq 1971"
function parseParams(str) {
  const p = {}
  if (!str) return p
  const KEYS = { url: "url", link: "url", girone: "url", squadra: "squadra", team: "squadra", vista: "vista", titolo: "titolo", parziali: "parziali", prossima: "prossima" }
  for (const raw of String(str).split(/[;,\n]+/)) {
    const v = raw.trim()
    if (!v) continue
    const link = v.match(/https?:\/\/\S+/i)
    const kv = v.match(/^([a-z]+)\s*[=:]\s*(.+)$/i)
    if (link) p.url = link[0]
    else if (kv && KEYS[kv[1].toLowerCase()]) p[KEYS[kv[1].toLowerCase()]] = kv[2].trim()
    else if (/^(classifica|risultati|squadra|panoramica|ultima)$/i.test(v)) p.vista = v.toLowerCase()
    else if (/^semplice$/i.test(v)) { p.parziali = "no"; p.prossima = "no" }
    else if (/^diagnosi$/i.test(v)) p.vista = "diagnosi"
    else p.squadra = v
  }
  if (p.vista) p.vista = p.vista.toLowerCase()
  return p
}

// testi dei singoli elementi, nell'ordine della pagina
function chunks(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .split(/<[^>]*>/).map(s => decode(s).replace(/\s+/g, " ").trim()).filter(Boolean)
}
function strip(html) {
  return decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ").trim()
}
function decode(s) {
  return s.replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
}
function absUrl(u) {
  if (/^https?:/.test(u)) return u
  if (u.startsWith("//")) return "https:" + u
  return "https://live.centrosportivoitaliano.it" + (u.startsWith("/") ? "" : "/") + u
}
function num(s) { return parseFloat(String(s || "0").replace(",", ".")) || 0 }
function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "") }
function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h).toString(36) }
function pad(n) { return String(n).padStart(2, "0") }
function fmtDate(ts) { const d = new Date(ts); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` }
function fmtTime(ts) { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
function dayName(ts) { return ["dom", "lun", "mar", "mer", "gio", "ven", "sab"][new Date(ts).getDay()] }
function isToday(ts) { return new Date(ts).toDateString() === new Date().toDateString() }

}
