const axios = require('axios')

const img2toPrompt = async (base64Image, feature = 'image-to-prompt-en', language = 'en') => {
  const r = await axios.post(
    'https://wabpfqsvdkdjpjjkbnok.supabase.co/functions/v1/unified-prompt-dev',
    { feature, language, image: base64Image },
    {
      responseType: 'stream',
      headers: {
        authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYnBmcXN2ZGtkanBqamtibm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjk5MjEsImV4cCI6MjA1Mjk0NTkyMX0.wGGq1SWLIRELdrntLntBz-QH-JxoHUdz8Gq-0ha-4a4',
        'content-type': 'application/json',
        origin: 'https://generateprompt.ai',
        referer: 'https://generateprompt.ai/',
        'user-agent':
          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
      }
    }
  )

  return new Promise((resolve, reject) => {
    let result = ''
    let buffer = ''

    r.data.on('data', (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const raw = line.slice(5).trim()
        try {
          const json = JSON.parse(raw)
          const text = json?.choices?.[0]?.delta?.content || json?.content || json?.text || ''
          result += text
        } catch {}
      }
    })

    r.data.on('end', () => resolve(result.trim()))
    r.data.on('error', reject)
  })
}

let handler = async (m, { conn, usedPrefix, command }) => {
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || ''

  if (!mime.startsWith('image/')) {
    throw `Kirim/reply gambar dengan caption ${usedPrefix + command}`
  }

  await m.reply('*Processing image to prompt...*')

  try {
    const mediaBuffer = await q.download()
    const base64 = `data:${mime};base64,${mediaBuffer.toString('base64')}`

    const result = await img2toPrompt(base64)

    if (!result) throw 'Gagal mendapatkan prompt dari gambar'

    await conn.sendMessage(
      m.chat,
      {
        text: `📷 *Image to Prompt*\n\n${result}`
      },
      { quoted: m }
    )
  } catch (e) {
    throw typeof e === 'string' ? e : (e?.message || 'Terjadi kesalahan')
  }
}

handler.help = ['img2prompt']
handler.tags = ['maker']
handler.command = /^(img2prompt|toprompt)$/i

module.exports = handler