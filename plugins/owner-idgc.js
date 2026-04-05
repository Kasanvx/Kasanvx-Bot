//kasanvx
let handler = async (m, { conn }) => {
  let groups = await conn.groupFetchAllParticipating()
  let entries = Object.entries(groups || {})

  if (!entries.length) {
    return m.reply('Bot belum ada di group manapun.')
  }

  let teks = `*LIST ID GROUP BOT*\n\nTotal Group: ${entries.length}\n\n`

  teks += entries.map(([id, data], i) => {
    let subject = data.subject || 'Tanpa Nama'
    let owner = data.owner || '-'
    let members = Array.isArray(data.participants) ? data.participants.length : 0

    return `${i + 1}. ${subject}
ID: ${id}
Owner: ${owner}
Member: ${members}`
  }).join('\n\n')

  m.reply(teks)
}

handler.help = ['listidgc', 'listgcid', 'idgcbot']
handler.tags = ['owner']
handler.command = /^(listidgc|listgcid|idgcbot)$/i
handler.rowner = true

module.exports = handler