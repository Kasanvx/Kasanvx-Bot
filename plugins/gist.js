// credits : kasan

const axios = require('axios')

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    return m.reply(`🐙 *GET GITHUB GIST*\n━━━━━━━━━━━━━━━━━\n\nMasukkan link Gist Github yang ingin diambil kodenya!\n\n📌 *Contoh:*\n${usedPrefix + command} https://gist.github.com/username/1a2b3c4d5e6f7g8h9i0j`)
  }

  let url = args[0]
  
  // Regex untuk ngambil Gist ID dari link web atau link raw
  let match = url.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]+)/i) || url.match(/([a-f0-9]{20,32})/i)
  
  if (!match) return m.reply('❌ Link atau ID Gist tidak valid!')

  let gistId = match[1] || match[0]

  await m.reply('⏳ *Mengambil kode dari Gist...*')

  try {
    const { data } = await axios.get(`https://api.github.com/gists/${gistId}`)
    if (!data || !data.files) throw 'Data Gist tidak ditemukan atau kosong.'

    let files = Object.values(data.files)
    let text = `🐙 *GITHUB GIST*\n━━━━━━━━━━━━━━━━━\n👤 *Owner:* ${data.owner ? data.owner.login : 'Anonim'}\n📝 *Deskripsi:* ${data.description || '-'}\n📁 *Total File:* ${files.length}\n━━━━━━━━━━━━━━━━━\n\n`

    for (let file of files) {
      // Batasi panjang teks biar pesan WA gak error kepanjangan
      let content = file.content
      if (content.length > 30000) {
        content = content.substring(0, 30000) + '\n\n... [Kode dipotong karena terlalu panjang]'
      }

      let lang = file.language ? file.language.toLowerCase() : ''
      
      text += `📄 *File:* ${file.filename}\n💻 *Bahasa:* ${file.language || 'Tidak diketahui'}\n\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`
    }

    await conn.sendMessage(m.chat, { text: text.trim() }, { quoted: m })

  } catch (err) {
    let errMsg = err?.response?.data?.message || err.message || err
    m.reply(`❌ Gagal mengambil data Gist.\nPastikan link bersifat publik (bukan secret tanpa akses).\n\n_Error: ${errMsg}_`)
  }
}

handler.command = /^(getgist|gist)$/i
handler.tags = ['tools']
handler.help = ['getgist <link>']
handler.register = true

module.exports = handler