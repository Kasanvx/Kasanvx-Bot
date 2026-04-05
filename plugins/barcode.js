// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const GROUP_WM = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'
const axios    = require('axios')

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

// Format barcode yang didukung
const FORMATS = {
  'code128': 'Code128',
  'code39':  'Code39',
  'ean13':   'EAN13',
  'ean8':    'EAN8',
  'upca':    'UPCA',
  'itf':     'ITF14',
  'qr':      'QRCode',
}

async function generateBarcode(text, format = 'CODE128') {
  // Pakai barcode.tec-it.com — reliable, free
  const url = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(text)}&code=${format}&dpi=150&unit=Fit&imagetype=Png`
  const res  = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://barcode.tec-it.com/'
    }
  })
  return Buffer.from(res.data)
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    const teks   = args.slice(0, -1).join(' ') || args.join(' ')
    const fmt    = String(args[args.length - 1] || '').toLowerCase()
    const format = FORMATS[fmt] || 'CODE128'
    const input  = FORMATS[fmt] ? args.slice(0, -1).join(' ') : args.join(' ')

    if (!input?.trim()) {
      return m.reply(
        `🔲 *GENERATE BARCODE*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `📌 Format:\n` +
        `${usedPrefix}${command} <teks/angka>\n` +
        `${usedPrefix}${command} <teks> <format>\n\n` +
        `📋 Format tersedia:\n` +
        `• \`code128\` — Default (semua teks)\n` +
        `• \`code39\`  — Huruf kapital & angka\n` +
        `• \`ean13\`   — 12 digit angka\n` +
        `• \`ean8\`    — 7 digit angka\n` +
        `• \`qr\`      — QR Code\n\n` +
        `📋 Contoh:\n` +
        `${usedPrefix}${command} Hello World\n` +
        `${usedPrefix}${command} 1234567890123 ean13`
      )
    }

    await m.reply(`⏳ Generating barcode...`)

    const buffer = await generateBarcode(input.trim(), format)

    await conn.sendMessage(m.chat, {
      image: buffer,
      caption:
        `🔲 *BARCODE GENERATED*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📝 Teks   : ${input.trim()}\n` +
        `📋 Format : ${format}`
    }, { quoted: m })

  } catch (e) {
    console.error('barcode error:', e)
    m.reply(failText('lagi error: ' + e.message))
  }
}

handler.command = /^(barcode)$/i
handler.tags    = ['tools']
handler.help    = ['barcode <teks>', 'barcode <teks> <format>']

module.exports = handler