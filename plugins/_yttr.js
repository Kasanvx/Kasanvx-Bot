// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const GROUP_WM = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

let handler = async (m, { conn, args, command, usedPrefix }) => {
  if (!args.length) {
    return m.reply(
      `📝 *YT TRANSCRIBE*\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Ambil transkrip teks dari video YouTube.\n\n` +
      `📌 Format:\n` +
      `${usedPrefix}${command} <link youtube>\n\n` +
      `📋 Contoh:\n` +
      `${usedPrefix}${command} https://youtu.be/xxxxx`
    )
  }

  const url = args[0]

  if (!url.match(/youtube\.com|youtu\.be/i)) {
    return m.reply(`❌ Link tidak valid! Harus berupa link YouTube.`)
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
    await m.reply(`⏳ Mengambil transkrip video...\nMohon tunggu sebentar.`)

    const res  = await fetch(`https://api.nexray.web.id/tools/yt-transcribe?url=${encodeURIComponent(url)}`)
    const data = await res.json()

    if (!data.status || !data.data?.transcript) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return m.reply(failText('gagal mengambil transkrip'))
    }

    const transcript = data.data.transcript
    const maxLen     = 3500
    const header     = `📝 *TRANSKRIP VIDEO YOUTUBE*\n━━━━━━━━━━━━━━━━━━\n🔗 ${url}\n━━━━━━━━━━━━━━━━━━\n\n`

    if (transcript.length <= maxLen) {
      await m.reply(header + transcript)
    } else {
      const chunks = []
      for (let i = 0; i < transcript.length; i += maxLen) {
        chunks.push(transcript.slice(i, i + maxLen))
      }
      for (let i = 0; i < chunks.length; i++) {
        await m.reply(
          `📝 *TRANSKRIP* [${i + 1}/${chunks.length}]\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          chunks[i]
        )
      }
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('yttranscribe error:', e)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    m.reply(failText('lagi error: ' + e.message))
  }
}

handler.help    = ['yttranscribe <url>', 'yttr <url>']
handler.tags    = ['tools']
handler.command = /^(yttranscript|yttr)$/i
handler.limit   = true
handler.premium = false
handler.register = true

module.exports = handler