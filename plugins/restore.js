// credits : kasan
const uploadImage = require('../lib/uploadImage')
const axios       = require('axios')

const failText = () =>
  `Yahh fiturnya lagi error 😿\n\nSilakan lapor ke group:\nhttps://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t`

async function restorePhoto(url) {
  const prompt = 'photorealistic restoration of old damaged photograph, vibrant natural colors, enhanced details, sharp focus, remove scratches and noise, clear skin, high quality, 8k'
  const { data } = await axios.post('https://api.betabotz.eu.org/api/maker/imgedit', {
    text: prompt,
    url,
    apikey: global.lann
  })
  return data.result
}

let handler = async (m, { conn, usedPrefix, command }) => {
  const q    = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || q.mediaType || ''

  if (!/image/g.test(mime) || /webp/g.test(mime)) {
    return m.reply(
      `✨ *AI PHOTO RESTORE*\n\n` +
      `Kirim gambar dengan caption *${usedPrefix + command}*\n` +
      `atau reply gambar dengan *${usedPrefix + command}*`
    )
  }

  await m.reply(wait)

  try {
    const img   = await q.download?.()
    const url   = await uploadImage(img)
    const start = Date.now()

    const result = await restorePhoto(url)

    await conn.sendMessage(m.chat, {
      image:   { url: result },
      caption:
        `✨ *PHOTO RESTORE SUCCESS*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✅ Perbaikan & Pewarnaan selesai!\n` +
        `⏱️ Waktu: ${Date.now() - start} ms`
    }, { quoted: m })

  } catch (e) {
    m.reply(failText())
  }
}

handler.help    = ['restore']
handler.tags    = ['maker']
handler.command = /^(restore|perbaiki|recolor)$/i
handler.limit   = true

module.exports = handler