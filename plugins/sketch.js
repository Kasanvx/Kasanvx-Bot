// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const uploadImage = require('../lib/uploadImage')
const axios       = require('axios')

const failText = () =>
  `Yahh fiturnya lagi error 😿\n\nSilakan lapor ke group:\nhttps://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t`

async function imageedit(text, url) {
  const { data } = await axios.post('https://api.betabotz.eu.org/api/maker/imgedit', {
    text,
    url,
    apikey: lann
  })
  return data.result
}

let handler = async (m, { conn, usedPrefix, command }) => {
  const q    = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || q.mediaType || ''

  if (!/image/g.test(mime) || /webp/g.test(mime)) {
    return m.reply(
      `🎨 *SKETCH PENSIL*\n\n` +
      `Kirim gambar dengan caption *${usedPrefix + command}*\n` +
      `atau reply gambar dengan *${usedPrefix + command}*`
    )
  }

  await m.reply(wait)

  try {
    const img   = await q.download?.()
    const url   = await uploadImage(img)
    const start = Date.now()

    const result = await imageedit(
      'convert this photo into a realistic pencil sketch drawing, black and white, detailed pencil strokes, artist style',
      url
    )

    await conn.sendMessage(m.chat, {
      image:   { url: result },
      caption:
        `✏️ *SKETCH PENSIL*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✅ Gambar berhasil diubah jadi sketsa!\n` +
        `⏱️ Waktu: ${Date.now() - start} ms`
    }, { quoted: m })

  } catch (e) {
    console.error('sketch error:', e)
    m.reply(failText())
  }
}

handler.help    = ['sketch']
handler.tags    = ['maker']
handler.command = /^(sketch|pensil|sketchpensil)$/i
handler.limit   = true

module.exports = handler