#!/usr/bin/env node
/*
 * Build the Biblical Timeline page FROM events.csv — the single source of truth.
 *
 *   events.csv  +  the metadata below
 *       -> derive era / colour-group / display fields
 *       -> inline JSON  ->  template.html  ->  ../src/public/timeline/index.html
 *
 * Run:  node timeline/build.mjs      (or: yarn timeline / npm run timeline)
 * It also runs automatically as part of `yarn build` and `yarn start`.
 *
 * Edit events.csv to add/change events; edit ERA_META / TITLE below for the
 * section titles, blurbs and page title. See README.md for the column guide.
 *
 * Pure Node (no dependencies) so it runs anywhere the app builds.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const CSV_PATH = join(HERE, 'events.csv')
const TEMPLATE = join(HERE, 'template.html')
const OUT = join(HERE, '..', 'src', 'public', 'timeline', 'index.html')

const TITLE = 'Hebrew Feasts'

// ---- Section names (must match the 'section' column in events.csv) ----
const PP = 'PATRIARCHS & PRIMEVAL HISTORY'
const ATE = 'ABRAHAM TO THE EXODUS'
const EX = 'EXODUS, WILDERNESS & CONQUEST'
const JU = 'JUDGES'
const UM = 'UNITED MONARCHY'
const DM = 'DIVIDED MONARCHY'
const BAB = 'BABYLONIAN CONQUEST & EXILE'
const RET = 'RETURN FROM EXILE & SECOND TEMPLE'
const IT = 'INTERTESTAMENTAL, MACCABEES & ROME'
const LJ = 'LIFE OF JESUS'
const AP = 'APOSTOLIC AGE'
const JHN = 'FALL OF JERUSALEM & THE APOSTLE JOHN'
const PM = 'PROPHETIC MARKERS (interpretive)'
const EZ = "EZEKIEL'S DATED ORACLES"
// ---- Church-history sections (AD 100 -> present). Their 'category' column is "Branch|Type"
// (e.g. "Catholic|Council"); the branch drives the dot colour, the type drives the card's marker. ----
const AN = 'ANTE-NICENE CHURCH'
const IC = 'IMPERIAL CHURCH & COUNCILS'
const BZ = 'BYZANTIUM, ISLAM & THE PAPACY'
const MED = 'MEDIEVAL CHRISTENDOM'
const REF = 'REFORMATION & PROTESTANT AGE'
const CHURCH = new Set([AN, IC, BZ, MED, REF])

const ERA_ORDER = ['primeval', 'exodus', 'judges', 'united', 'divided',
  'exile', 'return', 'between', 'jesus', 'apostolic', 'john',
  'antenicene', 'imperial', 'byzantine', 'medieval', 'reformation']

// ---- Section titles + one-line blurbs (edit these for the on-page headings) ----
const ERA_META = {
  primeval: ['Primeval History & the Patriarchs', 'Creation, the Flood, and the fathers of Israel'],
  exodus: ['Exodus & Conquest', 'Out of Egypt to the Promised Land'],
  judges: ['The Judges', 'Three centuries of deliverers'],
  united: ['United Monarchy', 'Saul, David and Solomon'],
  divided: ['Divided Monarchy', 'Israel and Judah drift apart'],
  exile: ['Conquest & Exile', 'Babylon and the fall of Jerusalem'],
  return: ['Return & Second Temple', 'Restoration under Persia'],
  between: ['Between the Testaments', 'Greece, the Maccabees and Rome'],
  jesus: ['Life of Jesus', 'Incarnation to resurrection'],
  apostolic: ['The Apostolic Age', 'The gospel crosses the empire'],
  john: ['Fall of Jerusalem & John', 'AD 70 and the last apostle'],
  antenicene: ['The Ante-Nicene Church', 'Persecution, apologists and the forming canon'],
  imperial: ['Imperial Church & Councils', 'Constantine, Nicaea and the fall of Rome'],
  byzantine: ['Byzantium, Islam & the Papacy', 'The East, the Caliphate and the Great Schism'],
  medieval: ['Medieval Christendom', 'Crusades, popes and the fall of Constantinople'],
  reformation: ['Reformation & the Protestant Age', 'The church splinters and goes global'],
}

const SECTION_TO_ERA = {
  [PP]: 'primeval', [ATE]: 'primeval', [EX]: 'exodus', [JU]: 'judges', [UM]: 'united', [DM]: 'divided',
  [BAB]: 'exile', [EZ]: 'exile', [RET]: 'return', [IT]: 'between',
  [LJ]: 'jesus', [AP]: 'apostolic', [JHN]: 'john',
  [AN]: 'antenicene', [IC]: 'imperial', [BZ]: 'byzantine', [MED]: 'medieval', [REF]: 'reformation',
}

function eraFor(r) {
  if (r.section === PM) return r.year_signed < 0 ? 'exile' : 'jesus'
  return SECTION_TO_ERA[r.section]
}

function groupOf(name, section, category) {
  const n = name.toLowerCase()
  const has = (...ks) => ks.some(k => n.includes(k))
  // Church-history eras: the dot colour is the BRANCH, taken from the "Branch|Type" category.
  if (CHURCH.has(section)) {
    const branch = (category || '').split('|')[0].trim().toLowerCase()
    return { early: 'early', orthodox: 'orthodox', catholic: 'catholic', protestant: 'protestant', empire: 'empire' }[branch] || 'early'
  }
  // NB: guard with `! of israel/judah` so king rows (e.g. "Zechariah of Israel") don't match a prophet
  // name; "nathan the" (not bare "nathan") so "Jonathan" stays Maccabees; "daniel" omitted so the
  // "FIRST deportation (Daniel & nobility)" reads as judgment like the other deportations.
  if (!has(' of israel', ' of judah') && has('ezekiel', 'haggai', 'zechariah', 'malachi', '70 weeks',
    'isaiah', 'jeremiah', 'elijah', 'elisha', 'hosea', 'amos', 'micah', 'micaiah', 'jonah',
    'nahum', 'habakkuk', 'zephaniah', 'obadiah', 'joel', 'ahijah', 'shemaiah', 'huldah', 'nathan the')) return 'prophet'
  if (n.includes('temple') && has('begun', 'construction', 'finished', 'complet', 'dedicat', 'foundation', 'rebuild')) return 'temple'
  // guarded to the intertestamental section so e.g. "Jonathan" (Saul's son) or "Simon Peter" elsewhere don't match
  if (section === IT && has('hanukkah', 'maccab', 'abomination', 'antiochus', 'judas', 'jonathan', 'simon ', 'mattathias', 'hyrcanus', 'independence', 'aristobulus', 'jannaeus', 'salome', 'antigonus')) return 'maccabees'
  // NB: 'megiddo' intentionally omitted so Josiah's death reads as a reign event, not judgment.
  if (has('deportation', 'siege', 'walls breached', 'gedaliah', 'carchemish', 'fall of samaria', 'sennacherib', 'shishak', "jehu's revolt", 'calves', 'naboth', 'earthquake')) return 'judgment'

  if (section === PP || section === ATE) {
    if (has(' born')) return 'birth'
    if (has(' dies', 'taken')) return 'death'
    return 'covenant'
  }
  if (section === EX) {
    if (has('dies')) return 'death'
    if (has('tabernacle', 'arrival at sinai', 'law')) return 'covenant'
    if (has('jericho', 'promised land', 'spies', 'kadesh')) return 'conquest'
    return 'exodus'
  }
  if (section === JU) {
    if (has('ark', 'eli', 'captured')) return 'judgment'
    return 'deliverer'
  }
  if (section === UM) return has('gilboa', 'absalom', 'idolatry', 'foreign wives') ? 'judgment' : 'kingdom'
  if (section === DM) return 'kingdom'
  if (section === BAB || section === EZ) return 'judgment'
  if (section === RET) return 'restoration'
  if (section === IT && has('pharisee', 'sadducee', 'essene', 'qumran', 'ben sira', 'sirach', 'septuagint', 'synagogue', 'sanhedrin')) return 'covenant'
  if (section === IT) return 'powers'
  if (section === LJ) {
    if (has('pentecost')) return 'church'
    if (has('herod', 'roman province', 'census', 'pilate')) return 'powers'
    return 'messiah'
  }
  if (section === AP) {
    if (has('martyr', 'stephen', 'peter and paul')) return 'martyr'
    if (has('great fire', 'nero', 'jewish-roman war', 'revolt')) return 'powers'
    if (has('council', 'christians', 'cornelius', 'writes', 'epistle', 'gospel', 'letter')) return 'church'
    return 'mission'
  }
  if (section === JHN) {
    if (has('temple', 'masada', 'revolt', 'siege', 'besieges', 'famine', 'triumph', 'domitian', 'persecution')) return 'judgment'
    return 'church'
  }
  if (section === PM) return 'prophet'
  return 'event'
}

const fmtYear = ys => ys < 0 ? `${-ys} BC` : `AD ${ys}`
// CSV gives strings; emit an int for a clean number but keep '' and ranges ('7-10') as strings.
const maybeInt = v => { const s = (v || '').trim(); return /^-?\d+$/.test(s) ? parseInt(s, 10) : v }

// ---- minimal RFC-4180 CSV parser (quotes, embedded commas/newlines, "" escapes) ----
function parseCSV(text) {
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows = []
  let row = [], field = '', quoted = false, i = 0
  while (i < text.length) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        quoted = false; i++; continue
      }
      field += c; i++; continue
    }
    if (c === '"') { quoted = true; i++; continue }
    if (c === ',') { row.push(field); field = ''; i++; continue }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue }
    field += c; i++
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

// ---- read events.csv (the source of truth) ----
const raw = parseCSV(readFileSync(CSV_PATH, 'utf8'))
const header = raw[0]
const rows = raw.slice(1)
  .filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''))
  .map((r, i) => {
    const o = {}
    header.forEach((h, j) => { o[h] = r[j] ?? '' })
    const ys = Number((o.year_signed || '').trim())
    if (!Number.isInteger(ys)) {
      throw new Error(`events.csv row ${i + 2}: 'year_signed' must be a whole number (negative for BC), ` +
        `got ${JSON.stringify(o.year_signed)} for ${JSON.stringify(o.event)}`)
    }
    o.year_signed = ys
    if (!(o.section in SECTION_TO_ERA) && o.section !== PM && o.section !== EZ) {
      throw new Error(`events.csv row ${i + 2}: unknown section ${JSON.stringify(o.section)} for ${JSON.stringify(o.event)}. ` +
        `Use one of the SECTION names defined in build.mjs.`)
    }
    o._i = i
    o.era = eraFor(o)
    o.group = groupOf(o.event, o.section, o.category)
    return o
  })

// ---- build the JSON the page consumes (era-grouped, then chronological) ----
const tl = rows.slice().sort((a, b) =>
  (ERA_ORDER.indexOf(a.era) - ERA_ORDER.indexOf(b.era)) ||
  (a.year_signed - b.year_signed) || (a._i - b._i))

const events = tl.map(r => ({
  era: r.era, group: r.group, section: r.section, event: r.event, date: r.date,
  year: r.year_signed, am: maybeInt(r.AM), hmonth: maybeInt(r.heb_month),
  hmonthname: r.heb_month_name, hday: r.heb_day, precision: r.precision,
  confidence: r.confidence, category: r.category, source: r.source, notes: r.notes,
}))

const eras = ERA_ORDER.map(key => {
  const ev = tl.filter(r => r.era === key)
  const ys = ev.map(e => e.year_signed)
  return {
    key, name: ERA_META[key][0], blurb: ERA_META[key][1], count: ev.length,
    range: ys.length ? `${fmtYear(Math.min(...ys))} – ${fmtYear(Math.max(...ys))}` : '',
  }
})

const TIER_ORDER = ['Scriptural', 'Historical', 'Traditional', 'Relative']
const ysAll = rows.map(r => r.year_signed)
const meta = {
  total: rows.length,
  span: `${fmtYear(Math.min(...ysAll))} – ${fmtYear(Math.max(...ysAll))}`,
  tiers: Object.fromEntries(TIER_ORDER.map(t => [t, rows.filter(r => r.confidence === t).length])),
  hebrew_dated: rows.filter(r => maybeInt(r.heb_month)).length,
}

const data = { meta, eras, events }

// ---- inject into the template and write the standalone page ----
const template = readFileSync(TEMPLATE, 'utf8')
if ((template.match(/__DATA__/g) || []).length !== 1) throw new Error('template.html must contain exactly one __DATA__ placeholder')
if ((template.match(/<\/style>/g) || []).length !== 1) throw new Error('template.html must contain exactly one </style>')

const dataStr = JSON.stringify(data)
const content = template
  .replace('__DATA__', () => dataStr)                                   // fn form: no $-substitution
  .replace('<title>Anno Mundi Timeline</title>', `<title>${TITLE}</title>`)

// The <head> matches the calendar app (src/index.html): same title, description, OG /
// Twitter cards and favicons, so the timeline is not a different-looking page. The
// per-page <title> and the shared color-mode script live in template.html.
const PREAMBLE =
  '<!doctype html>\n' +
  '<html lang="en" data-theme="dark">\n' +   // dark default until the shared-key script runs
  '<head>\n' +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta http-equiv="Content-Security-Policy" content="script-src \'self\' \'unsafe-inline\' https://api.hebrewfeasts.com; style-src \'self\' https://fonts.googleapis.com \'unsafe-inline\'; font-src \'self\' https://fonts.gstatic.com;">\n' +
  '<script>(function(){window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag("js",new Date());if(!/(^|\\.)hebrewfeasts\\.com$/.test(location.hostname))return;var s=document.createElement("script");s.async=true;s.src="https://api.hebrewfeasts.com/sync/gtag/js?id=G-MH4XYVN0M8";document.head.appendChild(s);gtag("config","G-MH4XYVN0M8",{transport_url:"https://api.hebrewfeasts.com/sync"})})();</script>\n' +
  '<meta name="description" content="A calendar for all Jewish Feasts back to 1 AD">\n' +
  '<meta name="author" content="Hebrew Feasts">\n' +
  '<meta name="keywords" content="Hebrew Feasts">\n' +
  '<meta property="og:title" content="Hebrew Feasts">\n' +
  '<meta property="og:description" content="A calendar for all Jewish Feasts back to 1 AD">\n' +
  '<meta property="og:image" content="/og.png">\n' +
  '<meta property="og:image:secure_url" content="/og.png">\n' +
  '<meta property="og:image:width" content="1200">\n' +
  '<meta property="og:image:height" content="630">\n' +
  '<meta property="og:image:type" content="image/png">\n' +
  '<meta property="og:image:alt" content="Hebrew Feasts">\n' +
  '<meta name="twitter:card" content="summary_large_image">\n' +
  '<meta name="twitter:site" content="@Hebrew Feasts">\n' +
  '<meta name="twitter:creator" content="@Hebrew Feasts">\n' +
  '<meta name="twitter:title" content="Hebrew Feasts">\n' +
  '<meta name="twitter:description" content="A calendar for all Jewish Feasts back to 1 AD">\n' +
  '<meta name="twitter:image" content="/og.png">\n' +
  '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n' +
  '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n' +
  '<link rel="icon" type="image/x-icon" href="/favicon.ico">\n'
const RESET = 'html,body{margin:0}[hidden]{display:none!important}img{max-width:100%}\n'
const standalone = PREAMBLE + content.replace('</style>', RESET + '</style>\n</head>\n<body>') + '\n</body>\n</html>\n'

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, standalone)
console.log(`✓ ${events.length} events across ${eras.filter(e => e.count).length} eras (${meta.span}) -> ${OUT}`)
