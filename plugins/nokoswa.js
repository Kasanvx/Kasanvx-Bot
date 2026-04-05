/**
 * Plugin: Nokos WhatsApp (All-in-One)
 * Channel : snx.biz.id/ch-xsn
 */

const axios = require('axios')

let handler = async (m, { conn }) => {

  if (!global.api)
    return m.reply('❌ API key tidak ditemukan di global.api')

  await m.reply('⏳ Mengambil layanan WhatsApp...')

  try {

    // 1️⃣ Ambil semua service
    const services = await axios({
      method: 'GET',
      url: 'https://www.rumahotp.com/api/v2/services',
      headers: {
        'x-apikey': global.api,
        'Accept': 'application/json'
      }
    }).then(v => v.data)

    if (!services.success)
      return m.reply('❌ Gagal mengambil layanan.')

    // 2️⃣ Cari WhatsApp
    const waService = services.data.find(s =>
      s.service_name.toLowerCase().includes('whatsapp')
    )

    if (!waService)
      return m.reply('❌ Service WhatsApp tidak ditemukan.')

    await m.reply('⏳ Mengambil daftar negara...')

    // 3️⃣ Ambil negara berdasarkan service WA
    const countries = await axios({
      method: 'GET',
      url: `https://www.rumahotp.com/api/v2/countries?service_id=${waService.service_code}`,
      headers: {
        'x-apikey': global.api,
        'Accept': 'application/json'
      }
    }).then(v => v.data)

    if (!countries.success || !countries.data.length)
      return m.reply('❌ Negara tidak tersedia.')

    let teks = `╭─〔 *NOKOS WHATSAPP* 〕\n`
    teks += `│ 🆔 Service ID : ${waService.service_code}\n`
    teks += `│ 📱 Service    : ${waService.service_name}\n`
    teks += `╰────────────────\n\n`

    countries.data.slice(0, 20).forEach(n => {

      let price = n.pricelist?.[0]?.price_format || 'Tidak tersedia'
      let stock = n.pricelist?.[0]?.stock || 0

      teks += `🌍 ${n.name} (${n.prefix})
💰 Harga: ${price}
📦 Stock: ${stock}
🆔 ID Negara: ${n.number_id}

`
    })

    teks += `⚠️ Menampilkan 20 negara pertama`
    teks += `\n\nGunakan:\n.beliwa <id_negara>`

    conn.reply(m.chat, teks.trim(), m)

  } catch (err) {
    console.log(err)
    m.reply('❌ Server error.')
  }
}

handler.help = ['nokoswa']
handler.owner = true
handler.tags = ['tools']
handler.command = /^nokoswa$/i

module.exports = handler