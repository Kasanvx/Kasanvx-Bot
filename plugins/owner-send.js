//kasanvx
const TARGET_GC = '120363424770471912@g.us'

let handler = async (m, { conn, text, isOwner, usedPrefix, command }) => {
  if (!isOwner) return m.reply('Khusus owner.')

  let pesan = text || m.quoted?.text || ''
  if (!pesan) {
    return m.reply(`Format:\n${usedPrefix + command} teksnya\n\nAtau reply teks lalu ketik ${usedPrefix + command}`)
  }

  await conn.sendMessage(TARGET_GC, { text: pesan }, { quoted: m })
  return m.reply(`Berhasil dikirim ke GC:\n${TARGET_GC}`)
}

handler.help = ['send <teks>']
handler.tags = ['owner']
handler.command = /^(send)$/i

module.exports = handler