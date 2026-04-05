//kasanvx

const axios = require('axios')
const cheerio = require('cheerio')

const BASE_URL = 'https://www.bola.net/jadwal-pertandingan/'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  Referer: 'https://www.bola.net/'
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchJadwalBola() {
  try {
    const resp = await axios.get(BASE_URL, { headers: HEADERS, timeout: 15000 })
    const $ = cheerio.load(resp.data)
    const hasil = []

    // Setiap ul.ligaList = satu liga
    $('ul.ligaList').each((_, ul) => {
      // Nama liga ada di li pertama atau th
      const namaLiga = $(ul).find('li.ligaList_item').first().find('table.main-table--jadwal thead th').first().text().trim()
        || $(ul).closest('.table-scroll').prev('h3.ligaList_title').text().trim()
        || 'Unknown'

      // Ambil nama liga dari th kolom pertama tabel
      const ligaLabel = $(ul).find('table.main-table--jadwal thead tr th').first().text().trim()

      const pertandingan = []

      $(ul).find('table.main-table--jadwal tbody tr').each((_, row) => {
        const teams = $(row).find('.clubBox-name').map((_, el) => $(el).text().trim()).get()
        const waktuRaw = $(row).find('td').eq(1).text().trim()

        if (teams.length < 2 || !waktuRaw) return

        const match = waktuRaw.match(/^(\d{2}:\d{2})\s*(.*)$/)
        const waktu    = match ? match[1] : waktuRaw
        const timezone = match ? match[2].trim() : ''

        pertandingan.push({
          waktu,
          timezone: timezone || 'WIB',
          home: teams[0],
          away: teams[1]
        })
      })

      if (pertandingan.length > 0) {
        hasil.push({
          liga: ligaLabel || namaLiga,
          pertandingan
        })
      }
    })

    return hasil
  } catch {
    return []
  }
}

function buildCaption(data, filterLiga = null) {
  if (!data.length) return '❌ Tidak ada jadwal ditemukan.'

  // Filter liga kalau ada keyword
  const filtered = filterLiga
    ? data.filter(d => d.liga.toLowerCase().includes(filterLiga.toLowerCase()))
    : data

  if (!filtered.length) {
    const available = data.map(d => `• ${d.liga}`).join('\n')
    return `❌ Liga *${filterLiga}* tidak ditemukan.\n\nLiga tersedia:\n${available}`
  }

  let txt = `⚽ *JADWAL BOLA*\n`
  txt += `📅 ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`
  txt += `━━━━━━━━━━━━━━━\n`

  for (const liga of filtered) {
    txt += `\n🏆 *${liga.liga}*\n`
    for (const m of liga.pertandingan) {
      txt += `${m.waktu} ${m.timezone} | ${m.home} vs ${m.away}\n`
    }
    txt += `━━━━━━━━━━━━━━━\n`
  }

  return txt.trim()
}

function buildMenu(data) {
  const ligaList = data.map((d, i) => `${i + 1}. ${d.liga} (${d.pertandingan.length} match)`).join('\n')

  return `⚽ *JADWAL BOLA*
━━━━━━━━━━━━━━━
Ketik nama liga yang ingin dicek:

${ligaList}

*Contoh:*
.jadwalbola inggris
.jadwalbola jerman
.jadwalbola champions
.jadwalbola (semua liga)
━━━━━━━━━━━━━━━`
}

let handler = async (m, { args, usedPrefix, command }) => {
  try {
    const keyword = args.join(' ').trim()

    await m.reply('⏳ Mengambil jadwal bola...')

    const data = await fetchJadwalBola()

    if (!data.length) {
      return m.reply('❌ Gagal mengambil jadwal. Coba lagi nanti.')
    }

    // Tidak ada args → tampilkan menu
    if (!keyword) {
      return m.reply(buildMenu(data))
    }

    // Ada keyword "semua" → kirim semua liga
    if (keyword === 'semua') {
      const txt = buildCaption(data)
      if (txt.length > 4000) {
        for (const liga of data) {
          let bagian = `🏆 *${liga.liga}*\n━━━━━━━━━━━━━━━\n`
          for (const m2 of liga.pertandingan) {
            bagian += `${m2.waktu} ${m2.timezone} | ${m2.home} vs ${m2.away}\n`
          }
          await m.reply(bagian.trim())
          await sleep(300)
        }
      } else {
        await m.reply(txt)
      }
      return
    }

    // Ada keyword → filter liga
    const txt = buildCaption(data, keyword)
    await m.reply(txt)

  } catch {
    await m.reply(
`❌ Gagal mengambil jadwal bola.

Contoh penggunaan:
${usedPrefix + command}
${usedPrefix + command} inggris
${usedPrefix + command} champions
${usedPrefix + command} semua`
    )
  }
}

handler.help = [
  'jadwalbola',
  'jadwalbola <liga>',
  'jadwalbola semua'
]
handler.tags = ['tools']
handler.command = /^(jadwalbola|jbola|bolajadwal)$/i

module.exports = handler