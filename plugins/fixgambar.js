const uploadImage = require('../lib/uploadImage')
const axios = require('axios')

let handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (/image/g.test(mime) && !/webp/g.test(mime)) {
        await conn.reply(m.chat, wait, m)
        try {
            let img = await q.download?.()
            let url = await uploadImage(img)
            let startTime = new Date()

            let result = await imageedit('fix and enhance this image, upscale resolution, sharpen details, remove blur and noise', url)

            await conn.sendMessage(m.chat, {
                image: { url: result },
                caption: `✨ *Fix Gambar*\n✅ Gambar berhasil diperbaiki!\n⏳ *Waktu:* ${new Date() - startTime} ms`
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            m.reply('[ ! ] Terjadi kesalahan saat memproses gambar.')
        }
    } else {
        m.reply(`Kirim gambar dengan caption *${usedPrefix + command}* atau reply gambar.`)
    }
}

handler.help = handler.command = ['fixgambar']
handler.tags = ['maker']
handler.limit = true

module.exports = handler

async function imageedit(text, url) {
    let { data } = await axios.post('https://api.betabotz.eu.org/api/maker/imgedit', {
        text,
        url,
        apikey: lann
    })
    return data.result
}