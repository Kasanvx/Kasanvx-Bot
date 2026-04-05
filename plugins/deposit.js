// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const axios = require('axios')

const GROUP_WM  = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'
const MP_KEY    = global.mp || ''
const MP_URL    = 'https://mustikapayment.com'
const MIN_DEP   = 10000
const CHECK_INTERVAL = 15000

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

function rupiah(x) {
  return 'Rp' + Number(x || 0).toLocaleString('id-ID')
}

function formatDate(ts) {
  return new Date(ts).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function userData(id) {
  global.db.data.users[id] ||= {}
  const u = global.db.data.users[id]
  if (typeof u.saldo !== 'number') u.saldo = 0
  if (!u.depositMP) u.depositMP = null
  return u
}

async function createQRIS(amount, name) {
  const res = await axios.post(`${MP_URL}/api/createpay`,
    new URLSearchParams({
      amount,
      product_name:  'Deposit Saldo Bot',
      customer_name: name || 'Pelanggan'
    }),
    { headers: { 'X-Api-Key': MP_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  )
  return res.data
}

async function cekStatus(ref_no) {
  const res = await axios.get(`${MP_URL}/api/cekpay`, {
    params: { ref_no },
    headers: { 'X-Api-Key': MP_KEY },
    timeout: 15000
  })
  return res.data
}

// ── Watcher otomatis ──
if (!global.mpDepositWatcher) {
  global.mpDepositWatcher = true

  setInterval(async () => {
    if (!global.conn || !global.db?.data?.users || !MP_KEY) return

    for (const jid in global.db.data.users) {
      const u = global.db.data.users[jid]
      if (!u?.depositMP?.ref_no) continue

      // Skip kalau expired (15 menit)
      if (Date.now() - u.depositMP.created > 15 * 60 * 1000) {
        await global.conn.sendMessage(u.depositMP.chat, {
          text:
            `⏰ *DEPOSIT EXPIRED*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🆔 Ref: ${u.depositMP.ref_no}\n` +
            `💰 Nominal: ${rupiah(u.depositMP.amount)}\n\n` +
            `Silakan buat deposit baru.`
        })
        u.depositMP = null
        continue
      }

      try {
        const st = await cekStatus(u.depositMP.ref_no)
        if (String(st?.status || '').toLowerCase() !== 'success') continue

        // Cek double claim
        global.db.data.mpClaims ||= {}
        if (global.db.data.mpClaims[u.depositMP.ref_no]) {
          u.depositMP = null
          continue
        }

        global.db.data.mpClaims[u.depositMP.ref_no] = true
        u.saldo += Number(u.depositMP.amount)

        // Hapus pesan QRIS
        try {
          if (u.depositMP.msgKey) {
            await global.conn.sendMessage(u.depositMP.chat, { delete: u.depositMP.msgKey })
          }
        } catch {}

        await global.conn.sendMessage(u.depositMP.chat, {
          text:
            `╔══════════════════════╗\n` +
            `║  💰 *DEPOSIT BERHASIL*  ║\n` +
            `╚══════════════════════╝\n\n` +
            `🆔 Ref        : ${u.depositMP.ref_no}\n` +
            `💵 Nominal    : ${rupiah(u.depositMP.amount)}\n` +
            `👛 Saldo baru : *${rupiah(u.saldo)}*\n\n` +
            `📆 ${formatDate(Date.now())}`
        })

        u.depositMP = null
      } catch {}
    }
  }, CHECK_INTERVAL)
}

// ── Handler utama ──
let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    global.db.data.mpClaims ||= {}
    const user = userData(m.sender)
    const name = m.pushName || 'Pelanggan'

    // ── CEK STATUS MANUAL ──
    if (String(args[0] || '').toLowerCase() === 'cek') {
      const ref = args[1] || user.depositMP?.ref_no
      if (!ref) return m.reply(`❌ Tidak ada deposit pending.\nFormat: *.deposit cek <ref_no>*`)

      await m.reply(`⏳ Mengecek status...`)
      const st = await cekStatus(ref)
      const ok = String(st?.status || '').toLowerCase() === 'success'

      if (ok) {
        if (global.db.data.mpClaims[ref]) {
          return m.reply(`✅ Deposit *${ref}* sudah pernah diklaim.`)
        }

        global.db.data.mpClaims[ref] = true
        const amount = user.depositMP?.amount || 0
        user.saldo += amount

        try {
          if (user.depositMP?.msgKey) {
            await conn.sendMessage(user.depositMP.chat || m.chat, { delete: user.depositMP.msgKey })
          }
        } catch {}

        user.depositMP = null
        return m.reply(
          `╔══════════════════════╗\n` +
          `║  💰 *DEPOSIT BERHASIL*  ║\n` +
          `╚══════════════════════╝\n\n` +
          `🆔 Ref        : ${ref}\n` +
          `💵 Nominal    : ${rupiah(amount)}\n` +
          `👛 Saldo baru : *${rupiah(user.saldo)}*\n\n` +
          `📆 ${formatDate(Date.now())}`
        )
      }

      return m.reply(
        `📋 *STATUS DEPOSIT*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🆔 Ref    : ${ref}\n` +
        `📌 Status : ⏳ ${st?.status || 'Pending'}\n\n` +
        `_Saldo akan otomatis masuk setelah pembayaran terverifikasi._`
      )
    }

    // ── DEPOSIT PENDING ──
    if (user.depositMP?.ref_no) {
      return m.reply(
        `⚠️ *Kamu masih punya deposit pending!*\n\n` +
        `🆔 Ref     : ${user.depositMP.ref_no}\n` +
        `💰 Nominal : ${rupiah(user.depositMP.amount)}\n\n` +
        `Selesaikan dulu atau ketik:\n` +
        `*.deposit cek* untuk cek statusnya.`
      )
    }

    // ── VALIDASI NOMINAL ──
    const nominal = parseInt(args[0])
    if (!nominal || isNaN(nominal)) {
      return m.reply(
        `💳 *DEPOSIT SALDO*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `📌 Format:\n` +
        `${usedPrefix}${command} <nominal>\n\n` +
        `📋 Contoh:\n` +
        `${usedPrefix}${command} 50000\n\n` +
        `💵 Minimal deposit: ${rupiah(MIN_DEP)}`
      )
    }

    if (nominal < MIN_DEP) {
      return m.reply(`❌ Minimal deposit *${rupiah(MIN_DEP)}*`)
    }

    await m.reply(`⏳ Membuat QRIS...`)

    const res = await createQRIS(nominal, name)

    if (res.status !== 'success') {
      return m.reply(failText('gagal buat QRIS'))
    }

    // Kirim QR image
    const sent = await conn.sendMessage(m.chat, {
      image: { url: res.qr_url },
      caption:
        `💳 *DEPOSIT QRIS*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💰 Nominal : *${rupiah(res.amount)}*\n` +
        `🆔 Ref     : ${res.ref_no}\n\n` +
        `⏳ QRIS berlaku *15 menit*\n` +
        `✅ Saldo masuk otomatis setelah bayar\n\n` +
        `📋 Cek manual: *.deposit cek*`
    }, { quoted: m })

    user.depositMP = {
      ref_no:  res.ref_no,
      amount:  nominal,
      chat:    m.chat,
      msgKey:  sent?.key || null,
      created: Date.now()
    }

  } catch (e) {
    console.error('depositMP error:', e)
    m.reply(failText('lagi error: ' + e.message))
  }
}

handler.command = /^(deposit)$/i
handler.tags    = ['store']
handler.help    = ['deposit <nominal>', 'deposit cek']

module.exports = handler