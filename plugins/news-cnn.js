// ────────── code made by kasan ──────────

const axios = require('axios')

let handler = async (m, { conn }) => {
  try {
    let { data } = await axios.get('https://api.siputzx.my.id/api/berita/cnn')

    if (!data.status) throw 'Gagal mengambil berita.'

    let berita = data.data[0]

    let caption = `📰 *${berita.title}*\n`
    caption += `🕒 ${berita.time}\n`
    caption += `🔗 ${berita.link}\n\n`
    caption += `${berita.content}`

    await conn.sendMessage(m.chat, {
      image: { url: berita.image_full || berita.image_thumbnail },
      caption: caption
    }, { quoted: m })

  } catch (e) {
    throw 'Terjadi kesalahan saat mengambil berita.'
  }
}

handler.help = ['cnn']
handler.tags = ['news']
handler.command = /^(cnn)$/i

module.exports = handler