//code made by kasan

const fetch = require('node-fetch')

let handler = async (m, { conn }) => {

let res = await fetch('https://x.0cd.fun/database/id/quotes-filsuf')
let json = await res.json()

if (!json.status || !json.data) return m.reply('Gagal mengambil quotes')

let { author, quote, category } = json.data

let teks = `“${quote}”

— ${author}
Kategori: ${category}`

await conn.sendMessage(m.chat, { text: teks }, { quoted: m })

}

handler.help = ['filsuf']
handler.tags = ['quotes']
handler.command = /^filsuf$/i

module.exports = handler