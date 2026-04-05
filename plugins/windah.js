//code made by kasan

let axios = require('axios')

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('Contoh:\n.windah HaloHalooo')

  let url = 'https://wudysoft.xyz/api/sound/windah?prompt=' + encodeURIComponent(text)

  let res = await axios.get(url, {
    responseType: 'arraybuffer'
  })

  let buffer = Buffer.from(res.data)

  await conn.sendMessage(m.chat, {
    document: buffer,
    mimetype: 'audio/mpeg',
    fileName: 'windah.mp3'
  }, { quoted: m })
}

handler.command = /^windah$/i
module.exports = handler