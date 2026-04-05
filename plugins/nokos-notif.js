// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const GROUP_WM = 'https://chat.whatsapp.com/FDjn5WA234v8J6jMcb0zei?mode=gi_t'
const OWNER = '6287767510608@s.whatsapp.net'
const TARGET_GC = '120363424770471912@g.us'

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

function msgStart() {
  return `📢 *Pemberitahuan Maintenance & Restok Layanan Nokos*

Kami informasikan bahwa akan dilakukan maintenance layanan Nokos dalam rangka proses restok nomor serta peningkatan kualitas layanan.

🕒 *Waktu Maintenance:*
23:00 WIB – 00:20 WIB

Selama proses berlangsung, layanan Nokos mungkin tidak dapat digunakan sementara waktu. Setelah maintenance selesai, layanan akan kembali normal dengan stok yang telah diperbarui.

Mohon maaf atas ketidaknyamanan yang terjadi dan terima kasih atas pengertian Anda. 🙏

— Tim Support`
}

function msgEnd() {
  return `✅ *Maintenance Selesai*

Layanan Nokos sudah kembali normal dan stok sudah diperbarui.

Terima kasih atas pengertian Anda. 🙏

— Tim Support`
}

function getWIBParts() {
  const d = new Date()
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  const parts = dtf.formatToParts(d).reduce((a, p) => {
    a[p.type] = p.value
    return a
  }, {})

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute)
  }
}

function ensureDB() {
  db.data.settings ||= {}
  db.data.settings.nokosMaint ||= {}
  db.data.settings.nokosMaint.auto ||= false
  db.data.settings.nokosMaint.lastStart ||= ''
  db.data.settings.nokosMaint.lastEnd ||= ''
}

async function tick(conn) {
  ensureDB()
  if (!db.data.settings.nokosMaint.auto) return

  const { date, hour, minute } = getWIBParts()

  const startWindow = hour === 23 && minute >= 0 && minute <= 5
  const endWindow = hour === 0 && minute >= 20 && minute <= 25

  if (startWindow && db.data.settings.nokosMaint.lastStart !== date) {
    await conn.sendMessage(TARGET_GC, { text: msgStart() })
    db.data.settings.nokosMaint.lastStart = date
  }

  if (endWindow && db.data.settings.nokosMaint.lastEnd !== date) {
    await conn.sendMessage(TARGET_GC, { text: msgEnd() })
    db.data.settings.nokosMaint.lastEnd = date
  }
}

function ensureScheduler(conn) {
  if (global.__nokosMaintAutoScheduler) return

  global.__nokosMaintAutoScheduler = setInterval(() => {
    tick(conn).catch(() => {})
  }, 15000)
}

function statusText() {
  ensureDB()
  const auto = !!db.data.settings.nokosMaint.auto

  return `📌 *AUTO NOTIF MAINT NOKOS*
━━━━━━━━━━━━━━━━━━
Target GC : ${TARGET_GC}
Jadwal    : 23:00 WIB – 00:20 WIB
Status    : ${auto ? '*AKTIF*' : '*NONAKTIF*'}

Perintah:
.notif on
.notif off
.notif info`
}

let handler = async (m, { conn, args }) => {
  try {
    ensureScheduler(conn)
    ensureDB()

    if (m.sender !== OWNER) return m.reply(failText('khusus owner'))

    const mode = String(args[0] || 'info').toLowerCase()

    if (mode === 'on') {
      db.data.settings.nokosMaint.auto = true
      return m.reply(`✅ Auto notif maintenance diaktifkan.\n\n${statusText()}`)
    }

    if (mode === 'off') {
      db.data.settings.nokosMaint.auto = false
      return m.reply(`✅ Auto notif maintenance dimatikan.\n\n${statusText()}`)
    }

    return m.reply(statusText())
  } catch (e) {
    return m.reply(failText('lagi error'))
  }
}

handler.command = /^(notif)$/i
handler.tags = ['owner']
handler.help = ['notif on', 'notif off', 'notif info']
handler.owner = true

handler.before = async function (m, { conn }) {
  try {
    ensureScheduler(conn)
  } catch {}
}

module.exports = handler