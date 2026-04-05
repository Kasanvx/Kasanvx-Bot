let handler = async (m, { conn, text, usedPrefix, command }) => {

  if (!text)
    return m.reply(`Contoh:
${usedPrefix + command} @user 5000
${usedPrefix + command} 6281234567890 5000`)

  let args = text.trim().split(/\s+/)

  if (args.length < 2)
    return m.reply('Format salah.')

  let amount = args[args.length - 1]
  if (isNaN(amount))
    return m.reply('Nominal harus angka.')

  amount = parseInt(amount)

  // Ambil target
  let target =
    m.mentionedJid[0] ||
    args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'

  if (!target.includes('@s.whatsapp.net'))
    return m.reply('Nomor tidak valid.')

  // Init user jika belum ada
  if (!db.data.users[target])
    db.data.users[target] = { saldo: 0 }

  db.data.users[target].saldo =
    (db.data.users[target].saldo || 0) + amount

  m.reply(
`✅ *TRANSFER SALDO BERHASIL*

👤 Ke: @${target.split('@')[0]}
💰 Nominal: Rp${amount.toLocaleString()}
💳 Saldo sekarang: Rp${db.data.users[target].saldo.toLocaleString()}`,
    null,
    { mentions: [target] }
  )
}

handler.help = ['tfsaldo @user/nomor <nominal>']
handler.tags = ['owner']
handler.command = /^tfsaldo$/i
handler.owner = true

module.exports = handler