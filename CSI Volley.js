// CSI-VOLLEY-SCRIPTABLE — codice del widget CSI Volley per Scriptable
// Questo file viene scaricato dallo script "CSI Volley" (il caricatore): non va copiato in Scriptable.
// https://github.com/FAKKIUZ/csi-volley-widget

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
// impostazioni scritte nello script "CSI Volley" (il caricatore)
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

const C = {
  bg:     Color.dynamic(new Color("#F4F6FA"), new Color("#0D1320")),
  text:   Color.dynamic(new Color("#0F172A"), new Color("#F1F5F9")),
  sub:    Color.dynamic(new Color("#64748B"), new Color("#8B9AB0")),
  stripe: Color.dynamic(new Color("#FFFFFF"), new Color("#162033")),
  chip:   Color.dynamic(new Color("#E3E9F4"), new Color("#1E2B42")),
  accent: new Color("#F5A524"),
  accentSoft: Color.dynamic(new Color("#FDE9C4"), new Color("#3A2A08")),
  hl:     Color.dynamic(new Color("#FFE6AE"), new Color("#47330C")),
  hlText: Color.dynamic(new Color("#9A5B00"), new Color("#FFC861")),
  win:    Color.dynamic(new Color("#15803D"), new Color("#4ADE80")),
  lose:   Color.dynamic(new Color("#B91C1C"), new Color("#F87171")),
  uff:    Color.dynamic(new Color("#DC2626"), new Color("#FF6B6B")), // risultato ufficioso (non ancora omologato)
}

const SCREEN = Device.screenSize()
const WIDE = Math.round(Math.min(SCREEN.width, SCREEN.height) * 0.89) // larghezza widget medio/grande (stima)
const PAD = 14
const INNER = WIDE - PAD * 2
const INNER_SMALL = Math.round(WIDE * 0.467) - PAD * 2
// scala dei caratteri della panoramica: testi 10,5 · dettagli 10 · etichette 9 (sectionLabel)
const F_TXT = 10.5, F_SUB = 10
let LOGOS = {}
let TREND = null // posizioni a fine giornata precedente, per le frecce

// ───────────────────────── main ─────────────────────────

let data = null, err = null
if (params.vista !== "diagnosi") { try { data = await getData(URL_GIRONE) } catch (e) { err = e } }

if ((config.runsInWidget || config.runsInAccessoryWidget) && params.vista === "diagnosi") {
  // widget minimo: dice quale formato iOS sta chiedendo a Scriptable
  const w = new ListWidget()
  w.backgroundColor = new Color("#F4F6FA")
  const add = (s, size, bold) => { const t = w.addText(s); t.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size); t.textColor = new Color("#0F172A") }
  add("🏐 Diagnosi widget", 16, true)
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
  return {
    title: parseTitle(html),
    standings,
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
  }
}

// Ogni partita è un link .../P2026302DA0104/...; testo: "07/10/26 21:15 <cod> Casa <cod> Ospite [parziali...] setCasa setOspite"
function parseMatches(html, teamNames) {
  const heads = []
  const hre = /(Andata|Ritorno)\s+giornata\s+(\d+)/gi
  let m
  while ((m = hre.exec(html))) heads.push({ i: m.index, label: `${m[1]} ${m[2]}` })

  const out = [], seen = new Set()
  const are = /<a\b[^>]*?href\s*=\s*["']([^"']*\/(P\d{5,}[A-Z]{1,3}\d{3,})\/[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  while ((m = are.exec(html))) {
    const code = m[2]
    if (seen.has(code)) continue
    const t = strip(m[3])
    const dm = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2})[:.](\d{2})\s+(.*)$/)
    if (!dm) continue
    seen.add(code)
    let y = +dm[3]; if (y < 100) y += 2000
    const ts = new Date(y, +dm[2] - 1, +dm[1], +dm[4], +dm[5]).getTime()
    // ogni dato sta nel suo elemento: squadre e punteggi restano separati
    let home, away, nums
    const parts = chunks(m[3])
      .map(c => c.replace(/^\d{7,9}\s+/, "").replace(/\s+\d{7,9}$/, ""))
      .filter(c => !/^\d{7,9}$/.test(c))
      .filter(c => !/^\d{1,2}\/\d{1,2}\/\d{2,4}(\s+\d{1,2}[:.]\d{2})?$/.test(c) && !/^\d{1,2}[:.]\d{2}$/.test(c))
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
    if (nums.length >= 2) {
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
    out.push({ code, ts, home, away, sets, parziali, ufficioso, campo, variazione: variaz ? variaz.trim() : "", giornata: h ? h.label : "", href: absUrl(decode(m[1])) })
  }
  return out.sort((a, b) => a.ts - b.ts)
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
  // formati oltre il grande (extra large su iPad, verticale alto di iOS 27…): panoramica
  if (!["small", "medium", "large"].includes(family)) { dashboard(w, d); return w }
  if (view === "panoramica") {
    // senza squadra la panoramica piccola e media ripiegano sulla classifica
    const noTeam = !TEAM || (!myStanding(d) && !d.matches.some(isMyMatch))
    const fs = noTeam ? [standingsSmall, standingsMedium, panoramaLarge] : [panoramaSmall, panoramaMedium, panoramaLarge]
    fs[family === "small" ? 0 : family === "medium" ? 1 : 2](w, d)
    return w
  }
  if (view === "squadra" && !myStanding(d) && !d.matches.some(isMyMatch)) return noTeamWidget(w)
  layouts[family === "small" ? 0 : family === "medium" ? 1 : 2](w, d)
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
  const ns = Math.min(F_TXT, fitNames(rows, INNER_SMALL, F_TXT, 13))
  for (const s of rows) panoStandingRow(col, s, ns)
  w.addSpacer()
}

function standingsMedium(w, d) {
  header(w, d, "Classifica")
  w.addSpacer(7)
  const s = d.standings.slice(0, 12)
  const per = Math.ceil(s.length / 2)
  const row = w.addStack(); row.topAlignContent(); row.spacing = 12
  const colW = (INNER - 12) / 2
  // altezza del widget medio ≈ 0,47 × larghezza; le righe si distribuiscono su quella disponibile
  const logoSize = per > 5 ? 14 : 16, rowH = logoSize + 1.5
  const avail = WIDE * 0.47 - 54
  const gap = Math.max(1, Math.min(10, (avail - per * rowH) / Math.max(1, per - 1)))
  const nameSize = Math.min(11.5, fitNames(s, colW, 11, logoSize) + 0.5)
  for (const part of [s.slice(0, per), s.slice(per)]) {
    const c = row.addStack(); c.layoutVertically(); c.spacing = gap
    for (const x of part) standingRowCompact(c, x, colW, 11, logoSize, nameSize)
  }
  w.addSpacer()
}

function standingsLarge(w, d) {
  header(w, d, "Classifica")
  w.addSpacer(8)
  const rows = d.standings.slice(0, 14)
  standingsTable(w, rows, rows.length > 11 ? 11 : 12, 3)
  w.addSpacer()
  const last = played(d)[0]
  if (last && last.giornata) {
    const f = w.addStack(); f.addSpacer()
    txt(f, `Aggiornata a: ${prettyGiornata(last.giornata)}`, 9, C.sub)
    f.addSpacer()
  }
}

function standingsTable(w, rows, size, vpad) {
  const cols = [["PT", "pt"], ["G", "pg"], ["V", "v"], ["P", "p"], ["SV", "sv"], ["SP", "sp"]]
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
    cols.forEach(([, k], j) => cell(r, s[k], cw, j === 0 ? ptsFont(s, size + 1) : Font.systemFont(size - 1), j === 0 ? ptsColor(s) : C.sub, "center"))
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
  let list, sub
  if (TEAM) {
    const last = played(d).find(isMyMatch)
    const next = upcoming(d).find(isMyMatch)
    list = [last, next].filter(Boolean)
    sub = TEAM
  } else {
    list = g.cur ? g.cur.matches.slice().sort((a, b) => (b.sets ? 1 : 0) - (a.sets ? 1 : 0) || a.ts - b.ts).slice(0, 2) : []
    sub = g.cur ? prettyGiornata(g.cur.label, true) : "Risultati"
  }
  header(w, d, sub, true)
  w.addSpacer(6)
  const longest = Math.max(1, ...list.flatMap(m => [m.home.length, m.away.length]))
  const ns = Math.max(8.5, Math.min(F_TXT, Math.floor((INNER_SMALL - 52) / (longest * 0.55) * 2) / 2))
  list.forEach((m, i) => {
    if (i) w.addSpacer(6)
    scoreboard(w, m, F_TXT, ns)
  })
  if (!list.length) txt(w, "Nessuna partita", F_TXT, C.sub)
  w.addSpacer()
}

function resultsMedium(w, d) {
  const g = currentGiornata(d)
  header(w, d, g.cur ? prettyGiornata(g.cur.label) : "Risultati")
  w.addSpacer(5)
  const list = w.addStack(); list.layoutVertically(); list.spacing = 3
  const ms = g.cur ? g.cur.matches : []
  list.spacing = 2
  const shown = ms.slice(0, 6), lay = rowLayout(shown, INNER, ms.length > 5 ? 10 : 11)
  shown.forEach(m => matchRow(list, m, INNER, ms.length > 5 ? 10 : 11, false, true, lay))
  if (!ms.length) txt(list, "Nessuna partita", 11, C.sub)
  w.addSpacer()
}

function resultsLarge(w, d) {
  const g = currentGiornata(d)
  header(w, d, "Risultati")
  w.addSpacer(8)
  let budget = WIDE * 1.05 - 38
  if (g.cur) {
    sectionLabel(w, prettyGiornata(g.cur.label))
    w.addSpacer(3)
    const list = w.addStack(); list.layoutVertically(); list.spacing = 3
    const lay = rowLayout(g.cur.matches, INNER, 11)
    const withP = params.parziali !== "no"
    for (const m of g.cur.matches) {
      matchRow(list, m, INNER, 11, withP, false, lay)
      budget -= m.parziali.length ? 37 : 25
    }
    budget -= 22
  }
  if (g.next && budget > 45 && params.prossima !== "no") {
    w.addSpacer(8)
    sectionLabel(w, prettyGiornata(g.next.label))
    w.addSpacer(3)
    const list = w.addStack(); list.layoutVertically(); list.spacing = 3
    const nx = g.next.matches.slice(0, Math.floor((budget - 22) / 25)), lay = rowLayout(nx, INNER, 11)
    nx.forEach(m => matchRow(list, m, INNER, 11, true, false, lay))
  }
  w.addSpacer()
}

// Partita su una riga: Casa [logo] [punteggio] [logo] Ospite (+ parziali sotto)
// Un'unica dimensione per tutti i nomi della lista, scelta sul nome più lungo,
// e chip stretto se nessuna partita deve mostrare la data
function rowLayout(list, width, size) {
  const needsDate = list.some(m => !m.sets && !isToday(m.ts))
  const L = size + 4, sW = size * (needsDate ? 5.4 : 3.8)
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
  if (m.sets) s.backgroundColor = C.chip
  else { s.borderColor = C.chip; s.borderWidth = 1.5 }
  const t = s.addText(m.sets ? `${m.sets[0]} - ${m.sets[1]}` : isToday(m.ts) ? fmtTime(m.ts) : `${fmtDate(m.ts)} ${fmtTime(m.ts)}`)
  t.font = m.sets ? Font.boldRoundedSystemFont(size) : Font.mediumSystemFont(size - 1)
  t.textColor = m.sets ? (m.ufficioso ? C.uff : C.text) : C.sub; t.lineLimit = 1; t.minimumScaleFactor = 0.8
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
  })
  if (!m.sets) {
    const when = box.addStack(); when.addSpacer()
    txt(when, `${isToday(m.ts) ? "oggi" : `${dayName(m.ts)} ${fmtDate(m.ts)}`} · ${fmtTime(m.ts)}`, F_SUB, C.sub)
    when.addSpacer()
  }
}

// ── lock screen ──

function accessoryLayout(w, d, family, view) {
  const me = myStanding(d)
  const leader = d.standings[0]
  const next = upcoming(d).find(m => !TEAM || isMyMatch(m))
  const last = played(d).find(m => !TEAM || isMyMatch(m))
  if (family === "accessoryInline") {
    if (view === "risultati" && last) w.addText(`🏐 ${last.home} ${last.sets.join("-")} ${last.away}`)
    else w.addText(me ? `🏐 ${me.pos}° ${me.name} · ${me.pt} pt` : leader ? `🏐 1° ${leader.name} · ${leader.pt} pt` : "🏐 CSI")
  } else if (family === "accessoryCircular") {
    w.addAccessoryWidgetBackground = true
    const s = me || leader
    const t1 = w.addText(s ? `${s.pos}°` : "–"); t1.font = Font.boldRoundedSystemFont(20); t1.centerAlignText()
    const t2 = w.addText(s ? `${s.pt} pt` : ""); t2.font = Font.systemFont(10); t2.centerAlignText()
  } else {
    const t0 = w.addText(`🏐 ${d.title}`); t0.font = Font.boldSystemFont(12); t0.lineLimit = 1
    const line = s => { const t = w.addText(s); t.font = Font.systemFont(11); t.lineLimit = 1; t.minimumScaleFactor = 0.7 }
    if (view === "risultati") {
      if (last) line(`${last.home} ${last.sets.join("-")} ${last.away}`)
      if (next) line(`${fmtDate(next.ts)} ${next.home} – ${next.away}`)
    } else if (me) {
      line(`${me.pos}° ${me.name} · ${me.pt} pt`)
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
  txt(w, "🏐 CSI Volley", 13, C.text, "bold")
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
function venueCity(v) { const m = v.match(/\b\d{5}\s+(.+)$/); return m ? m[1].trim() : "" }
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
  const up = upcoming(d).filter(isMyMatch)
  return { me: myStanding(d), pl, up, last: pl[0], next: up[0], form: pl.slice(0, 5).reverse().map(won) }
}
function won(m) { return isMine(m.home) ? m.sets[0] > m.sets[1] : m.sets[1] > m.sets[0] }
function opp(m) { return isMine(m.home) ? m.away : m.home }
function myScore(m) { return isMine(m.home) ? `${m.sets[0]}-${m.sets[1]}` : `${m.sets[1]}-${m.sets[0]}` } // dal punto di vista della squadra (solo Siri)
function homeAway(m) { return `${m.sets[0]}-${m.sets[1]}` } // convenzione: sempre casa-ospite
function countdown(ts) {
  const a = new Date(); a.setHours(0, 0, 0, 0)
  const b = new Date(ts); b.setHours(0, 0, 0, 0)
  const n = Math.round((b - a) / 864e5)
  return n <= 0 ? "oggi" : n === 1 ? "domani" : `tra ${n} giorni`
}

// Ultime 5 partite: V verde / P rossa, caselle vuote finché non si gioca
function formDots(stack, form, size) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 3
  const l = txt(r, "FORMA", 9, C.sub, "semibold")
  r.addSpacer(3)
  for (let i = 0; i < 5; i++) {
    const f = form[i]
    const dot = r.addStack(); dot.size = new Size(size + 4, size + 4); dot.cornerRadius = (size + 4) / 2; dot.centerAlignContent()
    if (f === undefined) { dot.borderColor = C.chip; dot.borderWidth = 1.5; continue }
    dot.backgroundColor = f ? C.win : C.lose
    const t = dot.addText(f ? "V" : "P"); t.font = Font.boldRoundedSystemFont(size - 3); t.textColor = Color.white()
  }
  return r
}

function teamCard(stack, d, t, logoSize, width) {
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
  if (t.me) txt(c, `G ${t.me.pg} · V ${t.me.v} · P ${t.me.p} · set ${t.me.sv}-${t.me.sp}`, 10, C.sub)
  formDots(c, t.form, 11)
  if (t.me && d.standings.length > 2) {
    c.addSpacer(4)
    miniTable(c, d, t.me, width)
  }
  return c
}

// La squadra con chi le sta subito sopra e sotto, e il distacco in punti
function miniTable(stack, d, me, width) {
  const s = d.standings, i = s.indexOf(me)
  const from = Math.max(0, Math.min(i - 1, s.length - 3))
  const rows = s.slice(from, from + 3)
  const box = stack.addStack(); box.layoutVertically(); box.spacing = 1
  for (const x of rows) {
    const mine = x === me
    const r = box.addStack(); r.centerAlignContent(); r.spacing = 4; r.setPadding(1, 3, 1, 3)
    if (width) r.size = new Size(width, 0)
    if (mine) { r.backgroundColor = C.hl; r.cornerRadius = 4 }
    cell(r, x.pos, 14, Font.boldRoundedSystemFont(9), x.pos === 1 ? C.accent : C.sub, "center")
    logo(r, x.name, 11)
    const n = txt(r, x.name, 10, mine ? C.hlText : C.text, mine ? "bold" : "regular"); n.minimumScaleFactor = 0.8
    r.addSpacer()
    if (!mine) {
      const diff = x.pt - me.pt
      txt(r, diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "=", 9, C.sub)
    }
    cell(r, x.pt, 18, Font.boldRoundedSystemFont(10), mine ? C.hlText : C.text, "center")
  }
}

function lastBlock(stack, t, size, d) {
  const m = t.last
  if (d) {
    // nel medio non c'è l'intestazione: l'orario dell'aggiornamento va sulla riga "Ultima"
    const h = stack.addStack(); h.centerAlignContent()
    sectionLabel(h, "Ultima")
    h.addSpacer()
    updatedLabel(h, d)
  } else sectionLabel(stack, "Ultima")
  if (!m) { txt(stack, "—", size, C.sub); return }
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 5; r.url = matchUrl(m)
  const w = won(m)
  const chip = r.addStack(); chip.setPadding(1, 5, 1, 5); chip.cornerRadius = 5; chip.backgroundColor = w ? C.win : C.lose
  const ct = chip.addText(`${w ? "V" : "P"} ${homeAway(m)}`); ct.font = Font.boldRoundedSystemFont(size); ct.textColor = Color.white()
  logo(r, opp(m), size + 4)
  const o = txt(r, `${isMine(m.home) ? "vs" : "@"} ${opp(m)}`, size, C.text); o.minimumScaleFactor = 0.8
  if (m.parziali.length) txt(stack, m.parziali.map(p => p.join("-")).join(" · "), size - 2, m.ufficioso ? C.uff : C.sub).minimumScaleFactor = 0.75
  if (m.ufficioso) txt(stack, "risultato ufficioso", size - 3, C.uff, "semibold")
}

function nextBlock(stack, d, t, size) {
  const m = t.next
  sectionLabel(stack, "Prossima")
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
  const row = w.addStack(); row.topAlignContent(); row.spacing = 12
  const leftW = Math.round(INNER * 0.47)
  teamCard(row, d, t, 38, leftW)
  const r = row.addStack(); r.layoutVertically(); r.spacing = 2
  lastBlock(r, t, 11, d)
  r.addSpacer(6)
  nextBlock(r, d, t, 11)
  w.addSpacer()
}

function teamLarge(w, d) {
  const t = teamData(d)
  header(w, d, "La mia squadra")
  w.addSpacer(10)
  const row = w.addStack(); row.topAlignContent(); row.spacing = 12
  const leftW = Math.round(INNER * 0.47)
  teamCard(row, d, t, 40, leftW)
  const r = row.addStack(); r.layoutVertically(); r.spacing = 2
  lastBlock(r, t, 11)
  r.addSpacer(6)
  nextBlock(r, d, t, 11)
  w.addSpacer(12)
  sectionLabel(w, "Calendario")
  w.addSpacer(3)
  const list = w.addStack(); list.layoutVertically(); list.spacing = 2
  // altezza del grande ≈ 1,05 × larghezza: le righe del calendario sono quante ne entrano
  const n = Math.max(3, Math.min(8, Math.floor((WIDE * 1.05 - 222) / 24)))
  const past = Math.min(t.pl.length, t.up.length ? 2 : n)
  const cal = t.pl.slice(0, past).reverse().concat(t.up).slice(0, n)
  cal.forEach((m, i) => calendarRow(list, m, i % 2 === 0, t.next && m.code === t.next.code))
  w.addSpacer()
}

function calendarRow(stack, m, stripe, isNext) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 6
  r.setPadding(3, 6, 3, 6); r.cornerRadius = 6; r.url = matchUrl(m)
  r.backgroundColor = isNext ? C.hl : (stripe ? C.stripe : C.bg)
  cell(r, `${dayName(m.ts)} ${fmtDate(m.ts)}`, 62, Font.systemFont(10), C.sub, "left")
  cell(r, isMine(m.home) ? "casa" : "fuori", 30, Font.mediumSystemFont(9), C.sub, "center")
  logo(r, opp(m), 15)
  const o = txt(r, opp(m), 11, C.text); o.minimumScaleFactor = 0.85
  r.addSpacer()
  if (m.sets) {
    const wn = won(m)
    const chip = r.addStack(); chip.size = new Size(44, 0); chip.cornerRadius = 5; chip.setPadding(1, 0, 1, 0)
    chip.backgroundColor = wn ? C.win : C.lose; chip.centerAlignContent()
    const ct = chip.addText(`${wn ? "V" : "P"} ${homeAway(m)}`); ct.font = Font.boldRoundedSystemFont(10); ct.textColor = Color.white()
  } else cell(r, fmtTime(m.ts), 44, Font.mediumSystemFont(10), C.text, "center")
}

function noTeamWidget(w) {
  w.backgroundColor = C.bg
  txt(w, "🏐 Nessuna squadra", 13, C.text, "bold")
  w.addSpacer(4)
  const t = txt(w, "Scrivi nel parametro: squadra;squadra=Nome squadra", 10, C.sub); t.lineLimit = 3
  return w
}

// ───────────────────────── panoramica nel widget grande ─────────────────────────

// Un po' di tutto: squadra (posizione, forma, ultima e prossima), giornata in corso, classifica in due colonne
function panoramaLarge(w, d) {
  const t = teamData(d)
  const g = currentGiornata(d)
  header(w, d, "Panoramica")
  let avail = WIDE * 1.05 - 24 - 30 // altezza utile del grande, tolta l'intestazione

  // ── scheda squadra: a sinistra posizione e forma, a destra ultima e prossima ──
  if (TEAM && (t.me || t.last || t.next)) {
    w.addSpacer()
    const box = w.addStack(); box.centerAlignContent(); box.spacing = 10
    box.size = new Size(INNER, 0)
    box.setPadding(6, 10, 6, 10); box.cornerRadius = 12; box.backgroundColor = C.stripe
    const l = box.addStack(); l.layoutVertically(); l.spacing = 4
    const top = l.addStack(); top.centerAlignContent(); top.spacing = 7
    const ring = top.addStack(); ring.size = new Size(34, 34); ring.cornerRadius = 17
    ring.borderColor = C.accent; ring.borderWidth = 2; ring.centerAlignContent()
    logo(ring, TEAM, 27)
    const nm = top.addStack(); nm.layoutVertically(); nm.spacing = 0
    const n = txt(nm, TEAM, 13, C.text, "bold"); n.minimumScaleFactor = 0.7
    if (t.me) {
      const p = nm.addStack(); p.bottomAlignContent(); p.spacing = 4
      txt(p, `${t.me.pos}°`, 16, C.hlText, "bold")
      txt(p, `${t.me.pt} pt`, F_TXT, C.sub, "semibold")
    }
    const dr = l.addStack(); dotsOnly(dr, t.form, 9); dr.addSpacer()

    const sep = box.addStack(); sep.size = new Size(1, 50); sep.backgroundColor = C.chip

    const r = box.addStack(); r.layoutVertically(); r.spacing = 1
    const m = t.last
    sectionLabel(r, "Ultima")
    if (m) {
      const lr = r.addStack(); lr.centerAlignContent(); lr.spacing = 5; lr.url = matchUrl(m)
      const wn = won(m)
      const chip = lr.addStack(); chip.setPadding(1, 5, 1, 5); chip.cornerRadius = 5; chip.backgroundColor = wn ? C.win : C.lose
      const ct = chip.addText(`${wn ? "V" : "P"} ${homeAway(m)}`); ct.font = Font.boldRoundedSystemFont(F_TXT); ct.textColor = Color.white()
      logo(lr, opp(m), 13)
      const o = txt(lr, `${isMine(m.home) ? "vs" : "@"} ${opp(m)}`, F_TXT, C.text, "semibold"); o.minimumScaleFactor = 0.75
    } else txt(r, "—", F_TXT, C.sub)
    r.addSpacer(3)
    const nx = t.next
    sectionLabel(r, nx ? `Prossima · ${countdown(nx.ts)}` : "Prossima")
    if (nx) {
      const nr = r.addStack(); nr.centerAlignContent(); nr.spacing = 5; nr.url = matchUrl(nx)
      logo(nr, opp(nx), 13)
      const o = txt(nr, `${isMine(nx.home) ? "vs" : "@"} ${opp(nx)}`, F_TXT, C.text, "semibold"); o.minimumScaleFactor = 0.75
      const when = r.addStack(); when.centerAlignContent(); when.spacing = 4
      const dt = txt(when, `${dayName(nx.ts)} ${fmtDate(nx.ts)} · ${fmtTime(nx.ts)}`, F_SUB, C.sub); dt.minimumScaleFactor = 1
      const v = venueOf(d, nx)
      if (v) {
        const vs = when.addStack(); vs.centerAlignContent(); vs.spacing = 2; vs.url = mapsUrl(v)
        const pin = symbol("mappin.circle.fill", F_SUB)
        if (pin) { const i = vs.addImage(pin); i.imageSize = new Size(F_SUB, F_SUB); i.tintColor = C.accent }
        // se lo spazio non basta si rimpicciolisce il paese, mai data e ora
        const vt = txt(vs, venueCity(v) || venueName(v), F_SUB, C.sub); vt.minimumScaleFactor = 0.75
      }
    } else txt(r, "Nessuna in calendario", F_TXT, C.sub)
    box.addSpacer()
    avail -= 80
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
    const ms = g.cur.matches.slice(0, fit)
    const list = w.addStack(); list.layoutVertically(); list.spacing = 2
    const lay = rowLayout(ms, INNER, F_TXT)
    lay.nameSize = Math.min(lay.nameSize, F_TXT)
    ms.forEach(m => matchRow(list, m, INNER, F_TXT, false, true, lay))
  }

  if (st.length) {
    w.addSpacer()
    sectionLabel(w, "Classifica")
    w.addSpacer(4)
    const row = w.addStack(); row.topAlignContent(); row.spacing = 12
    const colW = (INNER - 12) / 2
    const nameSize = Math.min(F_TXT, fitNames(st, colW, F_TXT, 13))
    for (const part of [st.slice(0, per), st.slice(per)]) {
      const c = row.addStack(); c.layoutVertically(); c.spacing = 2
      for (const x of part) panoStandingRow(c, x, nameSize)
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
    const ns = Math.min(F_TXT, fitNames(rows, INNER_SMALL, F_TXT, 13))
    const col = w.addStack(); col.layoutVertically(); col.spacing = 2
    for (const x of rows) panoStandingRow(col, x, ns)
    w.addSpacer()
  } else if (t.last) { lastRow(w, t.last, false); w.addSpacer() }
  if (t.next) nextLines(w, t.next)
  else txt(w, "Nessuna in calendario", F_SUB, C.sub)
}

// Intestazione dei piccoli di squadra: logo, nome, posizione e punti, orario a destra
function smallTeamTop(w, d, t) {
  const top = w.addStack(); top.centerAlignContent(); top.spacing = 7
  logo(top, TEAM, 26)
  const nm = top.addStack(); nm.layoutVertically()
  const n = txt(nm, TEAM, 12, C.text, "bold"); n.minimumScaleFactor = 0.7
  const p = nm.addStack(); p.centerAlignContent(); p.spacing = 3
  if (t.me) {
    txt(p, `${t.me.pos}°`, F_SUB, C.hlText, "bold")
    txt(p, `· ${t.me.pt} pt`, F_SUB, C.sub, "semibold")
  }
  p.addSpacer()
  updatedLabel(p, d)
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
  const lb = txt(stack, `PROSSIMA · ${countdown(m.ts).toUpperCase()}`, 9, C.sub, "semibold"); lb.minimumScaleFactor = 0.8
  stack.addSpacer(2)
  const nr = stack.addStack(); nr.centerAlignContent(); nr.spacing = 4; nr.url = matchUrl(m)
  logo(nr, opp(m), 13)
  const o = txt(nr, `${isMine(m.home) ? "vs" : "@"} ${opp(m)}`, F_TXT, C.text, "semibold"); o.minimumScaleFactor = 0.7
  txt(stack, `${dayName(m.ts)} ${fmtDate(m.ts)} · ${fmtTime(m.ts)}`, F_SUB, C.sub)
}

// ── panoramica media: a sinistra la squadra con ultima e prossima, a destra la classifica ──
function panoramaMedium(w, d) {
  const t = teamData(d)
  const row = w.addStack(); row.topAlignContent(); row.spacing = 10
  const leftW = Math.round((INNER - 21) / 2), rightW = INNER - 21 - leftW

  const l = row.addStack(); l.layoutVertically(); l.size = new Size(leftW, 0)
  const top = l.addStack(); top.centerAlignContent(); top.spacing = 6
  const ring = top.addStack(); ring.size = new Size(30, 30); ring.cornerRadius = 15
  ring.borderColor = C.accent; ring.borderWidth = 2; ring.centerAlignContent()
  logo(ring, TEAM, 24)
  const nm = top.addStack(); nm.layoutVertically()
  const n = txt(nm, TEAM, 12, C.text, "bold"); n.minimumScaleFactor = 0.7
  if (t.me) {
    const p = nm.addStack(); p.bottomAlignContent(); p.spacing = 3
    txt(p, `${t.me.pos}°`, 15, C.hlText, "bold")
    txt(p, `${t.me.pt} pt`, F_SUB, C.sub, "semibold")
  }
  top.addSpacer()
  l.addSpacer(7)
  if (t.last) {
    const m = t.last
    const lr = l.addStack(); lr.centerAlignContent(); lr.spacing = 4; lr.url = matchUrl(m)
    lastChip(lr, m)
    logo(lr, opp(m), 13)
    const o = txt(lr, `${isMine(m.home) ? "vs" : "@"} ${opp(m)}`, F_SUB, C.text, "semibold"); o.minimumScaleFactor = 0.7
    lr.addSpacer()
    l.addSpacer(7)
  }
  const nx = t.next
  const lb = txt(l, nx ? `PROSSIMA · ${countdown(nx.ts).toUpperCase()}` : "PROSSIMA", 9, C.sub, "semibold"); lb.minimumScaleFactor = 0.8
  l.addSpacer(2)
  if (nx) {
    const nr = l.addStack(); nr.centerAlignContent(); nr.spacing = 4; nr.url = matchUrl(nx)
    logo(nr, opp(nx), 13)
    const o = txt(nr, `${isMine(nx.home) ? "vs" : "@"} ${opp(nx)}`, F_TXT, C.text, "semibold"); o.minimumScaleFactor = 0.7
    nr.addSpacer()
    const when = l.addStack(); when.centerAlignContent(); when.spacing = 4
    const dt = txt(when, `${dayName(nx.ts)} ${fmtDate(nx.ts)} · ${fmtTime(nx.ts)}`, F_SUB, C.sub); dt.minimumScaleFactor = 1
    const v = venueOf(d, nx)
    if (v) {
      when.url = mapsUrl(v)
      const pin = symbol("mappin.circle.fill", F_SUB)
      if (pin) { const i = when.addImage(pin); i.imageSize = new Size(F_SUB, F_SUB); i.tintColor = C.accent }
    }
    when.addSpacer()
  } else txt(l, "Nessuna in calendario", F_SUB, C.sub)

  const sep = row.addStack(); sep.size = new Size(1, 120); sep.backgroundColor = C.chip

  const r = row.addStack(); r.layoutVertically(); r.spacing = 2; r.size = new Size(rightW, 0)
  const hr = r.addStack(); hr.centerAlignContent()
  sectionLabel(hr, "Classifica"); hr.addSpacer(); updatedLabel(hr, d)
  r.addSpacer(2)
  // 5 righe: le prime, o quelle intorno alla tua squadra se è più in basso
  const s = d.standings, me = myStanding(d), i = me ? s.indexOf(me) : 0
  const from = Math.max(0, Math.min(i - 2, s.length - 5))
  const rows = s.slice(from, from + 5)
  const nameSize = Math.min(F_TXT, fitNames(rows, rightW, F_TXT, 13))
  for (const x of rows) panoStandingRow(r, x, nameSize)
  w.addSpacer()
}

// Risultato dell'ultima partita: V/P e set, verde o rosso
function lastChip(stack, m) {
  const wn = won(m)
  const chip = stack.addStack(); chip.setPadding(1, 5, 1, 5); chip.cornerRadius = 5; chip.backgroundColor = wn ? C.win : C.lose
  const ct = chip.addText(`${wn ? "V" : "P"} ${homeAway(m)}`); ct.font = Font.boldRoundedSystemFont(F_SUB); ct.textColor = Color.white()
  return chip
}

// Riga di classifica della panoramica: posizione, logo, nome e punti con la stessa scala di caratteri
function panoStandingRow(stack, s, nameSize) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 4; r.setPadding(0, 2, 0, 4)
  const mine = isMine(s.name)
  if (mine) { r.backgroundColor = C.hl; r.cornerRadius = 5 }
  cell(r, s.pos, 16, Font.semiboldRoundedSystemFont(F_SUB), s.pos === 1 ? C.accent : C.sub, "center", true)
  if (TREND) trend(r, s, F_SUB)
  logo(r, s.name, 13)
  const n = txt(r, s.name, nameSize, mine ? C.hlText : C.text, mine ? "bold" : "regular"); n.minimumScaleFactor = 0.85
  r.addSpacer()
  cell(r, s.pt, 18, ptsFont(s, F_TXT), ptsColor(s), "center")
}

// Solo i pallini della forma (ultime 5: V verde, P rossa, vuoti da giocare), senza etichetta
function dotsOnly(stack, form, size) {
  const r = stack.addStack(); r.centerAlignContent(); r.spacing = 4
  for (let i = 0; i < 5; i++) {
    const f = form[i]
    const dot = r.addStack(); dot.size = new Size(size + 4, size + 4); dot.cornerRadius = (size + 4) / 2; dot.centerAlignContent()
    if (f === undefined) { dot.borderColor = C.chip; dot.borderWidth = 1.5; continue }
    dot.backgroundColor = f ? C.win : C.lose
    const tt = dot.addText(f ? "V" : "P"); tt.font = Font.boldRoundedSystemFont(size - 2); tt.textColor = Color.white()
  }
  return r
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
    sectionLabel(stack, "Classifica")
    stack.addSpacer(3)
    standingsTable(stack, d.standings.slice(0, 14), 11, 2)
  }
  const roundBlock = (stack, width) => {
    if (!g.cur) return
    sectionLabel(stack, prettyGiornata(g.cur.label))
    stack.addSpacer(3)
    const list = stack.addStack(); list.layoutVertically(); list.spacing = 3
    const ms = g.cur.matches.slice(0, 7), lay = rowLayout(ms, width, 11)
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
    try { Keychain.remove("csi-volley-calendario") } catch (e) {}
    return
  }
  const from = new Date(Math.min(...mine.map(m => m.ts)) - 60 * 864e5)
  const to = new Date(Math.max(...mine.map(m => m.ts)) + 60 * 864e5)
  const byCode = {}
  for (const e of await CalendarEvent.between(from, to, [cal])) {
    const m = (e.notes || "").match(/id:(\S+)/)
    if (m) byCode[m[1]] = e
  }
  let added = 0, updated = 0, errors = 0, lastError = ""
  for (const m of mine) {
    const want = {
      title: m.sets ? `🏐 ${m.home} ${m.sets[0]}-${m.sets[1]} ${m.away}` : `🏐 ${m.home} – ${m.away}`,
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
  await say(errors ? "Calendario aggiornato con errori" : "Calendario aggiornato",
    `Calendario "${cal.title}": ${added} partite aggiunte, ${updated} aggiornate.` +
    (errors ? `\n${errors} non salvate: ${lastError}` : "\nD'ora in poi si aggiorna da solo (widget o automazione)."))
  return { added, updated, errors }
}

// Scriptable non può creare calendari di eventi: usa "CSI · <squadra>" se esiste,
// altrimenti fa scegliere un calendario la prima volta e lo ricorda
async function pickCalendar(say, silent) {
  // La scelta è salvata nel Portachiavi di Scriptable: è condiviso tra app, widget e Comandi Rapidi
  // (il file in documentsDirectory non è visibile quando lo script gira da un'automazione)
  const KEY = "csi-volley-calendario"
  let saved = ""
  try { if (Keychain.contains(KEY)) saved = Keychain.get(KEY) } catch (e) {}
  if (!saved) {
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
  if (t.last) out.push(`Ultima partita: ${won(t.last) ? "vittoria" : "sconfitta"} ${score(t.last)} ${isMine(t.last.home) ? "in casa contro" : "in trasferta contro"} ${opp(t.last)}.`)
  if (t.next) out.push(`Prossima partita ${when(t.next.ts)} alle ${fmtTime(t.next.ts)}, ${isMine(t.next.home) ? "in casa contro" : "in trasferta contro"} ${opp(t.next)}.`)
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
    ? `<div class="score ${m.ufficioso ? "uff" : ""}"><span class="${hw ? "w" : ""}">${m.sets[0]}</span><span class="sep">–</span><span class="${aw ? "w" : ""}">${m.sets[1]}</span></div><div class="state ${m.ufficioso ? "uff" : ""}">${m.ufficioso ? "Ufficioso" : "Omologato"}</div>`
    : `<div class="time">${fmtTime(m.ts)}</div><div class="state">${countdown(m.ts)}</div>`
  const sets = m.parziali.length ? `<div class="card ${m.ufficioso ? "sets-uff" : ""}"><h3>Set</h3><table>
      <tr><th></th>${m.parziali.map((_, i) => `<th>${i + 1}°</th>`).join("")}</tr>
      <tr><td class="tl">${esc(m.home)}</td>${m.parziali.map(p => `<td class="${p[0] > p[1] ? "w" : ""}">${p[0]}</td>`).join("")}</tr>
      <tr><td class="tl">${esc(m.away)}</td>${m.parziali.map(p => `<td class="${p[1] > p[0] ? "w" : ""}">${p[1]}</td>`).join("")}</tr>
    </table></div>` : ""
  const other = d.matches.filter(x => x.code !== m.code && [x.home, x.away].includes(m.home) && [x.home, x.away].includes(m.away))
  const h2h = other.length ? `<div class="card"><h3>${other[0].ts < m.ts ? "Precedente" : "Ritorno"}</h3>${other.map(x =>
      `<div class="row"><span>${days[new Date(x.ts).getDay()].slice(0, 3)} ${fmtDate(x.ts)}</span><span>${esc(x.home)} ${x.sets ? `<b>${x.sets[0]}-${x.sets[1]}</b>` : "–"} ${esc(x.away)}</span></div>`).join("")}</div>` : ""
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
<div class="top"><b>${esc(prettyGiornata(m.giornata))}</b> · ${days[dt.getDay()]} ${dt.getDate()}/${dt.getMonth() + 1} · ${fmtTime(m.ts)}</div>
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

function header(w, d, subtitle, compact) {
  const h = w.addStack(); h.centerAlignContent(); h.spacing = 7
  const ic = h.addStack(); ic.size = new Size(26, 26); ic.cornerRadius = 13
  ic.backgroundColor = C.accent; ic.centerAlignContent()
  const img = symbol("volleyball.fill", 14)
  if (img) { const i = ic.addImage(img); i.imageSize = new Size(15, 15); i.tintColor = Color.white() }
  const tt = h.addStack(); tt.layoutVertically()
  if (compact) {
    // nei piccoli il titolo ha tutta la riga; l'orario va a destra del sottotitolo
    const t = txt(tt, d.title, 12, C.text, "bold"); t.minimumScaleFactor = 0.75
    const sr = tt.addStack(); sr.centerAlignContent()
    const s = txt(sr, subtitle, F_SUB, C.sub, "semibold"); s.minimumScaleFactor = 0.7
    sr.addSpacer()
    updatedLabel(sr, d)
    return
  }
  const t = txt(tt, d.title, 13, C.text, "bold"); t.minimumScaleFactor = 0.6
  const s = txt(tt, subtitle, 10, C.sub, "semibold"); s.minimumScaleFactor = 0.7
  h.addSpacer()
  updatedLabel(h, d)
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
  add("Classifica", undefined, true)
  for (const s of d.standings) add(`${s.pos}. ${s.name} — ${s.pt} pt`, `G ${s.pg} V ${s.v} P ${s.p} · set ${s.sv}-${s.sp} · QS ${s.qs}${d.logos && d.logos[s.name] ? " · logo ✓" : ""}`)
  let g = null
  for (const m of d.matches) {
    if (m.giornata !== g) { g = m.giornata; add(prettyGiornata(g) || "Partite", undefined, true) }
    const res = m.sets ? `${m.sets[0]}-${m.sets[1]}` : "–"
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

// Giornata in corso = quella dell'ultimo risultato; se è conclusa e la successiva è già iniziata, passa avanti
function currentGiornata(d) {
  const g = giornate(d)
  if (!g.length) return {}
  const last = played(d)[0]
  let i = last ? g.findIndex(x => x.label === last.giornata) : -1
  if (i < 0) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    i = g.findIndex(x => x.matches.some(m => m.ts >= today.getTime()))
    if (i < 0) i = g.length - 1
  } else if (g[i + 1] && g[i].matches.every(m => m.sets) && g[i + 1].first <= Date.now()) i++
  return { cur: g[i], next: g[i + 1] }
}

function prettyGiornata(label, short) {
  const m = String(label || "").match(/^(\S+)\s+(\d+)$/)
  if (!m) return label || ""
  return short ? `${m[1]} · G${m[2]}` : `${m[1]} · Giornata ${m[2]}`
}

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
    else if (/^(classifica|risultati|squadra|panoramica)$/i.test(v)) p.vista = v.toLowerCase()
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
