// ────────── code made by kasan ──────────

const axios = require('axios')

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `Contoh: ${usedPrefix + command} https://vt.tiktok.com/xxxxx/`

  try {
    let api = `https://api.siputzx.my.id/api/d/tiktok/v2?url=${encodeURIComponent(text)}`
    let { data } = await axios.get(api)

    if (!data.status) throw 'Video tidak ditemukan atau link tidak valid.'

    let res = data.data
    let video = res.no_watermark_link_hd || res.no_watermark_link

    if (!video) throw 'Gagal mengambil video.'

    let caption = `🎵 *TIKTOK DOWNLOADER V2*

👤 Author : ${res.author_nickname}
❤️ Likes : ${res.like_count}
💬 Comment : ${res.comment_count}
▶️ Play : ${res.play_count}
🔁 Share : ${res.share_count}
⏳ Durasi : ${Math.floor(res.duration / 1000)} detik`

    await conn.sendMessage(m.chat, {
      video: { url: video },
      caption: caption
    }, { quoted: m })

  } catch (e) {
    throw 'Terjadi kesalahan saat mengambil data.'
  }
}

handler.help = ['tiktok2 <url>', 'tt2 <url>']
handler.tags = ['downloader']
handler.command = /^(tiktok2|tt2)$/i

module.exports = handler