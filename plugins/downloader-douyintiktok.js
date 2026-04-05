// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const GROUP_WM = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'
const axios    = require('axios')

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

const isPlatform = (cmd) => {
  if (['tiktok','tt','ttdl','ttnowm','tiktokdl','tiktoknowm'].includes(cmd)) return 'tiktok'
  if (['douyin','douyindl'].includes(cmd)) return 'douyin'
  return null
}

const platformInfo = {
  tiktok: { label: 'TikTok', icon: '🎵', emoji: '乂' },
  douyin: { label: 'Douyin', icon: '🎬', emoji: '乂' },
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const platform = isPlatform(command)
  const info     = platformInfo[platform]

  // ── Validasi ──
  if (!text) {
    return m.reply(
      `❌ *URL tidak boleh kosong!*\n\n` +
      `📌 Contoh:\n` +
      `▸ ${usedPrefix}${command} https://vt.tiktok.com/ZSY8XguF2/`
    )
  }

  if (!text.match(/tiktok|douyin/gi)) {
    return m.reply(`❌ *URL tidak valid!*\nHarus berupa link TikTok atau Douyin.`)
  }

  // ── Proses ──
  try {
    await m.reply(`⏳ Sedang mengunduh ${info.icon} *${info.label}*...\nMohon tunggu sebentar.`)

    const apiUrl  = `https://api.betabotz.eu.org/api/download/${platform}?url=${text}&apikey=${lann}`
    const { data } = await axios.get(apiUrl)
    const { video, title, title_audio, audio } = data.result

    const capt =
      `${info.emoji} *${info.label.toUpperCase()}*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🎬 *Judul* : ${title || '-'}\n` +
      `🎵 *Audio* : ${title_audio || '-'}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `_Powered by ${info.label}_`

    // Kirim video
    if (Array.isArray(video)) {
      for (const v of video) {
        await conn.sendFile(m.chat, v, null, capt, m)
      }
    } else {
      await conn.sendFile(m.chat, video, null, capt, m)
    }

    // Kirim audio
    if (audio?.[0]) {
      await conn.sendMessage(m.chat, {
        audio: { url: audio[0] },
        mimetype: 'audio/mpeg'
      }, { quoted: m })
    }

  } catch (e) {
    console.error('tiktok handler error:', e)
    m.reply(failText('gagal download: ' + (e.message || 'unknown error')))
  }
}

handler.help    = ['tiktok <url>', 'douyin <url>']
handler.command = ['tiktok','tt','ttdl','ttnowm','tiktokdl','tiktoknowm','douyin','douyindl']
handler.tags    = ['downloader']
handler.limit   = true
handler.group   = false
handler.premium = false
handler.owner   = false
handler.admin   = false
handler.botAdmin = false
handler.fail    = null
handler.private = false

module.exports = handler