// credits : kasan

const axios = require('axios')

function formatPercent(percent) {
  let p = Number(percent)
  if (isNaN(p)) return '-'
  let used = 100 - p
  if (used < 0) used = 0
  if (used > 100) used = 100
  return used.toFixed(2) + '%'
}

let handler = async (m) => {
  let num = m.sender.split('@')[0]
  let localNum = num.startsWith('62') ? '0' + num.slice(2) : num

  const allowedPrefixes = ['0817', '0818', '0819', '0859', '0877', '0878', '0831', '0832', '0833', '0838']
  let isAllowed = allowedPrefixes.some(prefix => localNum.startsWith(prefix))

  if (!isAllowed) {
    return m.reply('❌ Maaf, fitur ini khusus kartu XL/AXIS saja.')
  }

  try {
    await m.reply('⏳ Memeriksa kuota...')

    const { data } = await axios.get(
      'https://api.alwayscodex.my.id/api/tools/simdopul',
      {
        params: { nomor: localNum },
        timeout: 60000
      }
    )

    if (!data || !data.status || !data.result) {
      return m.reply('❌ Gagal mengambil data kuota.')
    }

    const r = data.result || {}
    const provider = String(r.provider || '-').toUpperCase()

    const sim = r.info_pelanggan || {}
    const paketAktif = Array.isArray(r.info_paket?.paket_aktif) ? r.info_paket.paket_aktif : []

    let txt = `*INFORMASI KUOTA*\n\n`
    txt += `Nomor      : ${r.nomor_asli || localNum}\n`
    txt += `Provider   : ${provider}\n`
    txt += `Jaringan   : ${sim.jenis_jaringan || '-'}\n`
    txt += `Masa Aktif : ${sim.tanggal_kedaluwarsa || '-'}\n`
    txt += `──────────────\n`

    if (!paketAktif.length) {
      txt += `\nTidak ada kuota aktif saat ini.`
    } else {
      for (let i = 0; i < paketAktif.length; i++) {
        const pk = paketAktif[i] || {}
        const quotas = Array.isArray(pk.quotas) ? pk.quotas : []

        txt += `\n*${pk.name || 'Paket Tidak Diketahui'}*\n`
        txt += `Exp: ${pk.expiry || '-'}\n`

        if (!quotas.length) {
          txt += `▸ Detail kuota tidak tersedia\n`
          continue
        }

        for (let q of quotas) {
          txt += `▸ ${q.name || 'Kuota'}\n`
          txt += `  Sisa  : ${q.remaining || '-'}\n`
          txt += `  Total : ${q.total || '-'}\n`
        }
      }
    }

    await m.reply(txt.trim())
  } catch (e) {
    await m.reply('❌ Terjadi kesalahan saat memeriksa data.')
  }
}

handler.help = ['cekkuota']
handler.tags = ['tools']
handler.command = /^cekkuota$/i

module.exports = handler