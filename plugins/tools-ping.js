// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const { totalmem, freemem } = require('os')
const os          = require('os')
const osu         = require('node-os-utils')
const { performance } = require('perf_hooks')
const { sizeFormatter } = require('human-readable')

const format = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
})

function clockString(ms) {
  const d = isNaN(ms) ? '--' : Math.floor(ms / 86400000)
  const h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24
  const m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  const s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return `${String(d).padStart(2,'0')}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`
}

function progressBar(used, total, len = 12) {
  const pct   = Math.round((used / total) * len)
  const filled = '█'.repeat(pct)
  const empty  = '░'.repeat(len - pct)
  const pctNum = ((used / total) * 100).toFixed(1)
  return `${filled}${empty} ${pctNum}%`
}

let handler = async (m, { conn }) => {
  const chats      = Object.entries(conn.chats).filter(([id, data]) => id && data.isChats)
  const groupsIn   = chats.filter(([id]) => id.endsWith('@g.us'))
  const personalIn = chats.length - groupsIn.length

  const used = process.memoryUsage()
  const cpus = os.cpus().map(cpu => {
    cpu.total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
    return cpu
  })
  const cpu = cpus.reduce((last, cpu, _, { length }) => {
    last.total      += cpu.total
    last.speed      += cpu.speed / length
    last.times.user += cpu.times.user
    last.times.nice += cpu.times.nice
    last.times.sys  += cpu.times.sys
    last.times.idle += cpu.times.idle
    last.times.irq  += cpu.times.irq
    return last
  }, { speed: 0, total: 0, times: { user:0, nice:0, sys:0, idle:0, irq:0 } })

  // Uptime
  let _muptime
  if (process.send) {
    process.send('uptime')
    _muptime = await new Promise(resolve => {
      process.once('message', resolve)
      setTimeout(resolve, 1000)
    }) * 1000
  }
  const muptime = clockString(_muptime)

  // Ping
  const old   = performance.now()
  const neww  = performance.now()
  const ping  = Math.round(neww - old)

  // RAM
  const ramUsed  = totalmem() - freemem()
  const ramTotal = totalmem()
  const ramBar   = progressBar(ramUsed, ramTotal)

  // Heap
  const heapUsed  = used.heapUsed
  const heapTotal = used.heapTotal
  const heapBar   = progressBar(heapUsed, heapTotal)

  // Waktu WIB
  const now   = new Date(Date.now() + 3600000 * 7)
  const locale = 'id'
  const times  = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dates  = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // CPU usage
  const cpuUsage = ((1 - cpu.times.idle / cpu.total) * 100).toFixed(1)
  const cpuBar   = progressBar(parseFloat(cpuUsage), 100)

  const txt =
`╔══════════════════════════╗
║   🏓  *P I N G  &  S T A T S*  ║
╚══════════════════════════╝

⚡ *RESPONSE*
┣ Ping     : *${ping} ms*
┣ Uptime   : *${muptime}*
┗ Waktu    : ${times} WIB

━━━━━━━━━━━━━━━━━━━━━━

💬 *CHATS*
┣ 👥 Group   : *${groupsIn.length}*
┣ 👤 Personal : *${personalIn}*
┗ 📊 Total    : *${chats.length}*

━━━━━━━━━━━━━━━━━━━━━━

🖥️ *SERVER*
┣ OS       : ${os.platform()} (${os.arch()})
┣ Host     : ${os.hostname()}
┗ Tanggal  : ${dates}

━━━━━━━━━━━━━━━━━━━━━━

🧠 *MEMORY*
┣ RAM
┃  ${ramBar}
┃  ${format(ramUsed)} / ${format(ramTotal)}
┃
┣ Heap (Node.js)
┃  ${heapBar}
┗  ${format(heapUsed)} / ${format(heapTotal)}

━━━━━━━━━━━━━━━━━━━━━━

⚙️ *CPU* (${cpus.length} Core)
┣ Model : ${cpus[0]?.model?.trim() || 'Unknown'}
┣ Speed : ${Math.round(cpu.speed)} MHz
┣ Usage
┃  ${cpuBar}
┗  user ${((100*cpu.times.user/cpu.total)).toFixed(1)}%  sys ${((100*cpu.times.sys/cpu.total)).toFixed(1)}%  idle ${((100*cpu.times.idle/cpu.total)).toFixed(1)}%

━━━━━━━━━━━━━━━━━━━━━━`

  conn.relayMessage(m.chat, {
    extendedTextMessage: {
      text: txt,
      contextInfo: {
        externalAdReply: {
          title: 'Xyon Bot — System Stats',
          mediaType: 1,
          previewType: 0,
          renderLargerThumbnail: true,
          thumbnailUrl: 'https://telegra.ph/file/ec8cf04e3a2890d3dce9c.jpg',
          sourceUrl: ''
        }
      },
      mentions: [m.sender]
    }
  }, {})
}

handler.help    = ['ping', 'speed']
handler.tags    = ['info']
handler.command = /^(ping|speed|pong|ingfo)$/i

module.exports = handler