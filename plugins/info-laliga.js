// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const GROUP_WM = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

const ESPN_URL = 'https://www.espn.com/soccer/standings/_/league/esp.1'

async function fetchKlasemen() {
  const axios = require('axios')
  const cheerio = require('cheerio')

  const res = await axios.get(ESPN_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.google.com/'
    },
    timeout: 15000
  })

  const $ = cheerio.load(res.data)

  const teams = []
  $('.Table__TD .hide-mobile').each((_, el) => {
    const name = $(el).text().trim()
    if (name) teams.push(name)
  })

  const stats = []
  $('.Table__TR--sm').each((_, el) => {
    const cols = $(el).find('td').map((_, td) => $(td).text().trim()).get()
    if (cols.length > 3) stats.push(cols)
  })

  if (!teams.length || !stats.length) return null

  return stats.map((row, i) => ({
    pos: i + 1,
    team: teams[i] || '???',
    gp:  row[0] || '-',
    w:   row[1] || '-',
    d:   row[2] || '-',
    l:   row[3] || '-',
    f:   row[4] || '-',
    a:   row[5] || '-',
    gd:  row[6] || '-',
    pts: row[7] || '-'
  }))
}

function getZona(pos) {
  if (pos <= 4)  return '[UCL ]'
  if (pos === 5) return '[UEL ]'
  if (pos === 6) return '[UECL]'
  if (pos >= 18) return '[DEG ]'
  return '      '
}

function shortName(name) {
  const map = {
    'Barcelona': 'Barcelona',
    'Real Madrid': 'Real Madrid',
    'Atlético Madrid': 'Atletico',
    'Villarreal': 'Villarreal',
    'Real Betis': 'R. Betis',
    'Celta Vigo': 'Celta Vigo',
    'Espanyol': 'Espanyol',
    'Real Sociedad': 'R. Sociedad',
    'Getafe': 'Getafe',
    'Athletic Club': 'Ath. Club',
    'Osasuna': 'Osasuna',
    'Valencia': 'Valencia',
    'Rayo Vallecano': 'Rayo',
    'Sevilla': 'Sevilla',
    'Girona': 'Girona',
    'Alavés': 'Alaves',
    'Elche': 'Elche',
    'Mallorca': 'Mallorca',
    'Levante': 'Levante',
    'Real Oviedo': 'R. Oviedo',
  }
  return (map[name] || name).slice(0, 11)
}

function r(val, len) { return String(val).padStart(len) }
function l(val, len) { return String(val).padEnd(len) }

function renderRow(d) {
  const zona = getZona(d.pos)
  const pos  = r(d.pos, 2)
  const team = l(shortName(d.team), 11)
  const pts  = r(d.pts, 3)
  const gp   = r(d.gp, 2)
  const w    = r(d.w, 2)
  const dr   = r(d.d, 2)
  const lv   = r(d.l, 2)
  const gd   = r(d.gd, 4)
  return `${zona} ${pos} ${team} ${pts} ${gp} ${w} ${dr} ${lv} ${gd}`
}

function formatKlasemen(data) {
  const now = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const sep = '─'.repeat(44)
  const thin = '┄'.repeat(44)

  const header = `Zona    No Tim         Pts GP  W  D  L   GD`

  const ucl  = data.filter(d => d.pos <= 4).map(renderRow).join('\n')
  const uel  = data.filter(d => d.pos === 5).map(renderRow).join('\n')
  const uecl = data.filter(d => d.pos === 6).map(renderRow).join('\n')
  const mid  = data.filter(d => d.pos >= 7 && d.pos <= 17).map(renderRow).join('\n')
  const deg  = data.filter(d => d.pos >= 18).map(renderRow).join('\n')

  const tabel = [
    sep,
    header,
    sep,
    ucl,
    thin,
    uel,
    uecl,
    thin,
    mid,
    thin,
    deg,
    sep,
  ].join('\n')

  return `🏆 *LA LIGA 2024/25* 🇪🇸
*Klasemen Sementara*

\`\`\`
${tabel}
\`\`\`

🔵 UCL  🟠 UEL  🟡 UECL  🔴 Degradasi
📋 Pts=Poin | GP=Main | W=Menang | D=Seri | L=Kalah | GD=Selisih Gol
🕐 ${now} WIB  •  _Sumber: ESPN_`
}

// Handler utama
let handler = async (m, { conn }) => {
  try {
    await m.reply('⏳ Mengambil klasemen La Liga...')

    const data = await fetchKlasemen()
    if (!data) return m.reply(failText('gagal ambil data klasemen'))

    await m.reply(formatKlasemen(data))

  } catch (error) {
    console.error('laliga handler error:', error)
    m.reply(failText('lagi error: ' + error.message))
  }
}

handler.command = /^laliga$/i
handler.tags = ['info']
handler.help = ['laliga']

module.exports = handler