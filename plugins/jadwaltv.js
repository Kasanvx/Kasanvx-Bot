//kasanvx

const axios = require('axios')
const cheerio = require('cheerio')

const BASE_URL = 'https://www.jadwaltv.net'

const CHANNEL_LIST = {
  rcti:      'RCTI',
  sctv:      'SCTV',
  transtv:   'Trans TV',
  trans7:    'Trans7',
  mnctv:     'MNCTV',
  gtv:       'GTV',
  indosiar:  'Indosiar',
  tvone:     'tvOne',
  metrotv:   'Metro TV',
  antv:      'ANTV',
  nettv:     'NET TV',
  kompastv:  'Kompas TV'
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  Referer: 'https://www.jadwaltv.net/'
}

function getTanggalHariIni() {
  return new Date().toISOString().split('T')[0]
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isDateString(s = '') {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s).trim())
}

function normalizeChannelName(input = '') {
  const q = String(input || '').toLowerCase().trim().replace(/[\s_-]+/g, '')

  if (CHANNEL_LIST[q]) return q

  const aliases = {
    transtv:  'transtv',
    transv:   'transtv',
    trans7:   'trans7',
    metrotv:  'metrotv',
    metro:    'metrotv',
    nettv:    'nettv',
    net:      'nettv',
    kompastv: 'kompastv',
    kompas:   'kompastv',
    tvone:    'tvone',
    tvo:      'tvone',
    rcti:     'rcti',
    sctv:     'sctv',
    mnctv:    'mnctv',
    mnc:      'mnctv',
    gtv:      'gtv',
    indosiar: 'indosiar',
    antv:     'antv',
  }

  return aliases[q] || null
}

async function fetchJadwalChannel(slug) {
  const url = `${BASE_URL}/${slug}/`

  try {
    const resp = await axios.get(url, { headers: HEADERS, timeout: 15000 })
    const $ = cheerio.load(resp.data)
    const programs = []

    $('tr.jklIv').each((_, row) => {
      const cols = $(row).find('td')
      if (cols.length < 2) return

      // td[0] = waktu (e.g. "05:30WIB"), td[1] = judul
      const waktuRaw = $(cols[0]).text().trim()
      const judul    = $(cols[1]).text().trim()

      if (!waktuRaw || !judul) return

      // Pisahkan waktu dan timezone: "05:30WIB" → "05:30" & "WIB"
      const match    = waktuRaw.match(/^(\d{2}:\d{2})(.*)$/)
      const waktu    = match ? match[1] : waktuRaw
      const timezone = match ? match[2].trim() : ''

      programs.push({ waktu, timezone, judul })
    })

    return programs
  } catch {
    return []
  }
}

async function scrapeSemuaChannel(channels = null) {
  channels = channels || Object.keys(CHANNEL_LIST)

  const hasil = {
    tanggal:      getTanggalHariIni(),
    sumber:       'jadwaltv.net',
    diambil_pada: new Date().toISOString(),
    channels:     {}
  }

  for (const slug of channels) {
    const nama = CHANNEL_LIST[slug] || slug.toUpperCase()
    const programs = await fetchJadwalChannel(slug)

    hasil.channels[nama] = {
      slug,
      total_program: programs.length,
      jadwal: programs
    }

    await sleep(400)
  }

  return hasil
}

function parseArgs(args = []) {
  let channels = []

  for (const raw of args) {
    const a = String(raw || '').trim()
    if (!a || isDateString(a)) continue

    const ch = normalizeChannelName(a)
    if (ch) channels.push(ch)
  }

  const unique = [...new Set(channels)]
  return {
    channels: unique.length ? unique : null
  }
}

function buildCaption(data) {
  const names = Object.keys(data.channels)
  const totalProgram = Object.values(data.channels).reduce((sum, ch) => sum + ch.total_program, 0)

  let txt = `📺 *JADWAL TV INDONESIA*\n`
  txt += `📅 Tanggal: ${data.tanggal}\n`
  txt += `📡 Channel: ${names.length}\n`
  txt += `📦 Total program: ${totalProgram}\n`
  txt += `━━━━━━━━━━━━━━━\n`

  if (!names.length) {
    txt += `Tidak ada data channel yang ditemukan.`
    return txt
  }

  for (const [nama, info] of Object.entries(data.channels)) {
    txt += `\n📺 *${nama}*\n`

    if (!info.jadwal.length) {
      txt += `Tidak ada jadwal ditemukan.\n`
      txt += `━━━━━━━━━━━━━━━\n`
      continue
    }

    for (const item of info.jadwal.slice(0, 15)) {
      txt += `${item.waktu} - ${item.judul}\n`
    }

    if (info.jadwal.length > 15) {
      txt += `... dan ${info.jadwal.length - 15} program lainnya\n`
    }

    txt += `━━━━━━━━━━━━━━━\n`
  }

  return txt.trim()
}

let handler = async (m, { args, usedPrefix, command }) => {
  try {
    const parsed = parseArgs(args)

    // Kalau tidak ada args → tampilkan menu pilihan channel
    if (!parsed.channels) {
      const channelNames = Object.values(CHANNEL_LIST).join(' | ')
      return m.reply(
`📺 *JADWAL TV INDONESIA*
━━━━━━━━━━━━━━━
Ketik nama channel yang ingin dicek:

${channelNames}

*Contoh:*
${usedPrefix + command} rcti
${usedPrefix + command} sctv
${usedPrefix + command} rcti sctv transtv
━━━━━━━━━━━━━━━`)
    }

    await m.reply(`⏳ Mengambil jadwal ${parsed.channels.map(s => CHANNEL_LIST[s]).join(', ')}...`)

    const data = await scrapeSemuaChannel(parsed.channels)
    const txt  = buildCaption(data)

    // Kirim per-channel kalau teks terlalu panjang
    if (txt.length > 4000) {
      for (const [nama, info] of Object.entries(data.channels)) {
        let bagian = `📺 *${nama}* — ${data.tanggal}\n━━━━━━━━━━━━━━━\n`

        if (!info.jadwal.length) {
          bagian += `Tidak ada jadwal ditemukan.`
        } else {
          for (const item of info.jadwal.slice(0, 15)) {
            bagian += `${item.waktu} - ${item.judul}\n`
          }
          if (info.jadwal.length > 15) {
            bagian += `... dan ${info.jadwal.length - 15} lainnya`
          }
        }

        await m.reply(bagian.trim())
        await sleep(300)
      }
    } else {
      await m.reply(txt)
    }

  } catch {
    await m.reply(
`❌ Gagal mengambil jadwal TV.

Contoh penggunaan:
${usedPrefix + command}
${usedPrefix + command} rcti
${usedPrefix + command} rcti sctv
${usedPrefix + command} transtv trans7`
    )
  }
}

handler.help = [
  'jadwaltv',
  'jadwaltv <channel>',
  'jadwaltv <channel1> <channel2>',
]
handler.tags = ['tools']
handler.command = /^(jadwaltv)$/i

module.exports = handler