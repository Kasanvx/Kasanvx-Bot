// ────────── code made by kasan ──────────

const axios = require('axios')

let handler = async (m, { conn }) => {
  try {
    let { data } = await axios.get('https://api.siputzx.my.id/api/sticker/combot-search?q=jomok&page=1')

    if (!data.status) throw 'Sticker tidak ditemukan.'

    let pack = data.data.results[0]
    if (!pack || !pack.sticker_urls.length) throw 'Sticker kosong.'

    let random = pack.sticker_urls[Math.floor(Math.random() * pack.sticker_urls.length)]

    await conn.sendMessage(m.chat, {
      sticker: { url: random }
    }, { quoted: m })

  } catch (e) {
    throw 'Terjadi kesalahan saat mengambil sticker.'
  }
}

handler.help = ['sjomok', 'jomok']
handler.tags = ['sticker']
handler.command = /^(sjomok|jomok)$/i

module.exports = handler