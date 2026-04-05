// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')
const { exec } = require('child_process')

function tmpFile(ext) {
  return path.join('/tmp', `sticker_${Date.now()}.${ext}`)
}

let handler = async (m, { conn, command }) => {
  if (!m.quoted) throw '✳️ Balas sticker'

  const q = m.quoted
  if (!/sticker|webp/.test(q.mediaType || q.mimetype || '')) throw '✳️ Balas sticker'

  await m.reply(wait)

  const media = await q.download()
  if (!media) throw '❌ Gagal download sticker'

  // ── TOIMG / JPG / AIMG ──
  if (/toimg|jpg|aimg/.test(command)) {
    const img = await sharp(media).png().toBuffer()
    await conn.sendFile(m.chat, img, 'image.png', '✅ Sticker → Gambar', m)
    return
  }

  // ── TOGIF ──
  if (/togif/.test(command)) {
    const inFile  = tmpFile('webp')
    const outFile = tmpFile('gif')

    fs.writeFileSync(inFile, media)

    await new Promise((resolve, reject) => {
      exec(`ffmpeg -i ${inFile} -vf "fps=15,scale=320:-1" ${outFile} -y`, (err) => {
        fs.unlinkSync(inFile)
        err ? reject('❌ Gagal konversi ke GIF') : resolve()
      })
    })

    const gifBuf = fs.readFileSync(outFile)
    fs.unlinkSync(outFile)

    await conn.sendMessage(m.chat, {
      video: gifBuf,
      gifPlayback: true,
      caption: '✅ Sticker → GIF'
    }, { quoted: m })
  }
}

handler.help    = ['toimg', 'togif']
handler.tags    = ['sticker']
handler.command = /^(toimg|togif|jpg|aimg)$/i
handler.limit   = true

module.exports = handler