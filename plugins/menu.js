// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const GROUP_WM = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'

const arrayMenu = [
  'all','nokos','main','downloader','ai','rpg','rpgG','sticker','advanced',
  'xp','fun','game','github','group','image','nsfw','info','internet','islam',
  'kerang','maker','payment','owner','voice','quotes','store','stalk',
  'shortlink','tools','anonymous',''
]

const allTags = {
  'nokos':      { label: 'NOKOS',           icon: '💰' },
  'all':        { label: 'SEMUA MENU',      icon: '📋' },
  'ai':         { label: 'AI',              icon: '🤖' },
  'main':       { label: 'UTAMA',           icon: '🏠' },
  'downloader': { label: 'DOWNLOADER',      icon: '📥' },
  'payment':    { label: 'PAYMENT',         icon: '💳' },
  'rpg':        { label: 'RPG',             icon: '⚔️' },
  'rpgG':       { label: 'RPG GUILD',       icon: '🏰' },
  'sticker':    { label: 'CONVERT',         icon: '🖼️' },
  'advanced':   { label: 'ADVANCED',        icon: '⚙️' },
  'xp':         { label: 'EXP',             icon: '✨' },
  'fun':        { label: 'FUN',             icon: '🎉' },
  'game':       { label: 'GAME',            icon: '🎮' },
  'github':     { label: 'GITHUB',          icon: '🐙' },
  'group':      { label: 'GROUP',           icon: '👥' },
  'image':      { label: 'IMAGE',           icon: '🖼️' },
  'nsfw':       { label: 'NSFW',            icon: '🔞' },
  'info':       { label: 'INFO',            icon: '📊' },
  'internet':   { label: 'INTERNET',        icon: '🌐' },
  'islam':      { label: 'ISLAMI',          icon: '☪️' },
  'kerang':     { label: 'KERANG AJAIB',    icon: '🐚' },
  'maker':      { label: 'MAKER',           icon: '🛠️' },
  'news':       { label: 'NEWS',            icon: '📰' },
  'owner':      { label: 'OWNER',           icon: '👑' },
  'voice':      { label: 'PENGUBAH SUARA',  icon: '🎙️' },
  'quotes':     { label: 'QUOTES',          icon: '💬' },
  'store':      { label: 'STORE',           icon: '🏪' },
  'stalk':      { label: 'STALK',           icon: '🔍' },
  'shortlink':  { label: 'SHORT LINK',      icon: '🔗' },
  'tools':      { label: 'TOOLS',           icon: '🧰' },
  'anonymous':  { label: 'ANONYMOUS CHAT',  icon: '🎭' },
  '':           { label: 'NO CATEGORY',     icon: '📁' },
}

let handler = async (m, { conn, usedPrefix, args }) => {
  const name = `@${m.sender.split('@')[0]}`
  const teks = (args[0] || '').toLowerCase()

  const help = Object.values(global.plugins)
    .filter(v => !v.disabled)
    .map(v => ({
      help:    Array.isArray(v.help)  ? v.help  : [v.help],
      tags:    Array.isArray(v.tags)  ? v.tags  : [v.tags],
      prefix:  'customPrefix' in v,
      limit:   v.limit,
      premium: v.premium
    }))

  // ── MAIN MENU (tanpa argumen) ──
  if (!teks) {
    const menuList = arrayMenu
      .filter(tag => tag && allTags[tag])
      .map(tag => {
        const { label, icon } = allTags[tag]
        return `│ ${icon} ${usedPrefix}menu ${tag}`
      }).join('\n')

    const txt = `🤖 *Halo,* ${name}!
🌐 live update : bot.snx.biz.id

╔══════════════════╗
║   📋 *DAFTAR MENU*   ║
╚══════════════════╝
${menuList}
└──────────────────

💬 Ketik *${usedPrefix}menu <nama>* untuk lihat isi menu
📩 Butuh bantuan? Gabung: ${GROUP_WM}`

    return conn.sendMessage(m.chat, { text: txt, mentions: [m.sender] }, { quoted: m })
  }

  // ── CEK MENU VALID ──
  if (!(teks in allTags)) return m.reply(`❌ Menu *${teks}* tidak ditemukan.\nKetik *${usedPrefix}menu* untuk lihat daftar menu.`)

  // ── ISI MENU SPESIFIK ──
  const renderSection = (tag) => {
    const { label, icon } = allTags[tag]
    const cmds = help.filter(v => v.tags.includes(tag))
    if (!cmds.length) return ''

    const cmdList = cmds.flatMap(cmd =>
      cmd.help.map(h => {
        const prefix = cmd.prefix ? h : `${usedPrefix}${h}`
        const badge  = cmd.premium ? ' 👑' : cmd.limit ? ' 🔰' : ''
        return `│ ▸ ${prefix}${badge}`
      })
    ).join('\n')

    return `\n╭─ ${icon} *${label}*\n${cmdList}\n╰────────────`
  }

  let txt = `🤖 *Halo,* ${name}!
🌐 live update : bot.snx.biz.id\n`

  if (teks === 'all') {
    for (const tag of arrayMenu) {
      if (tag !== 'all' && allTags[tag]) {
        txt += renderSection(tag)
      }
    }
  } else {
    txt += renderSection(teks)
  }

  txt += `\n\n👑 = Premium  🔰 = Butuh Limit`

  await conn.sendMessage(m.chat, { text: txt, mentions: [m.sender] }, { quoted: m })
}

handler.help    = ['menu']
handler.tags    = ['main']
handler.command = /^(menu|help)$/i

module.exports = handler