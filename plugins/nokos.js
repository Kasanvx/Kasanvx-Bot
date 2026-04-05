//kasanvx
const axios = require('axios')

const APIKEY         = global.ditz || ''
const PROFIT         = 500
const OTP_TIMEOUT    = 300000
const CHECK_INTERVAL = 10000
const BASE_URL       = 'https://api.jasaotp.id/v2'
const TARGET_GC      = '120363424770471912@g.us'
const GROUP_WM       = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

function userData(id) {
  global.db.data.users[id] ||= {}
  let user = global.db.data.users[id]
  if (typeof user.saldo !== 'number') user.saldo = 0
  if (!user.nokos) user.nokos = null
  return user
}

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

function maskPhone(phone) {
  const s = String(phone)
  if (s.length <= 5) return s
  return s.slice(0, 3) + '*'.repeat(s.length - 6) + s.slice(-2)
}

function maskOtp(otp) {
  const s = String(otp)
  if (s.length <= 2) return s
  return s[0] + '*'.repeat(s.length - 2) + s[s.length - 1]
}

// GET dengan api_key (untuk endpoint yang butuh auth)
async function apiGet(path, params = {}) {
  const res = await axios.get(`${BASE_URL}${path}`, {
    params: { api_key: APIKEY, ...params },
    timeout: 30000
  })
  return res.data
}

// GET tanpa api_key (untuk /negara.php & /layanan.php & /operator.php)
async function apiGetNoAuth(path, params = {}) {
  const res = await axios.get(`${BASE_URL}${path}`, {
    params,
    timeout: 30000
  })
  return res.data
}

function resetSession(conn, jid) {
  conn.nokosSession ||= {}
  delete conn.nokosSession[jid]
}

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
  if (!APIKEY) return m.reply('❌ API JasaOTP belum diset.')

  let user = userData(m.sender)
  conn.nokosSession ||= {}

  const action = String(args[0] || '').toLowerCase()

  // ── MENU UTAMA ──
  if (!args.length) {
    try {
      // /negara.php — TANPA api_key sesuai docs
      const res = await apiGetNoAuth('/negara.php')
      if (!res.success || !Array.isArray(res.data)) {
        return m.reply('❌ Gagal mengambil daftar negara.')
      }

      const list = res.data.slice(0, 50)
      const options = {}
      let txt = `Pilih Negara (Wajib balas/reply pesan ini dengan angka):\n\n`
      list.forEach((v, i) => {
        txt += `${i + 1}. ${v.nama_negara}\n`
        options[i + 1] = { id_negara: v.id_negara, nama_negara: v.nama_negara }
      })

      let msg = await m.reply(txt)
      conn.nokosSession[m.sender] = {
        stage: 'NEGARA', id: msg.key.id, options, created: Date.now()
      }
      return
    } catch (e) {
      return m.reply(failText(e.message))
    }
  }

  // ── CEK SALDO ──
  if (action === 'ceksaldo') {
    try {
      // /balance.php — DENGAN api_key
      const res = await apiGet('/balance.php')
      if (!res.success) return m.reply('❌ Gagal cek saldo.')
      return m.reply(
        `💰 *SALDO NOKOS*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👛 Saldo bot    : *${rupiah(user.saldo)}*\n` +
        `🏦 Saldo JasaOTP: *${rupiah(res.data?.saldo)}*`
      )
    } catch (e) {
      return m.reply(failText(e.message))
    }
  }

  // ── ADD SALDO (owner) ──
  if (action === 'addsaldo') {
    if (!isOwner) return m.reply('❌ Khusus owner.')
    let target = m.mentionedJid?.[0]
      ? m.mentionedJid[0]
      : args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null
    let amount = parseInt(args[2])
    if (!target || isNaN(amount)) return m.reply(`Format: ${usedPrefix + command} addsaldo 628xxx nominal`)
    global.db.data.users[target] ||= {}
    if (typeof global.db.data.users[target].saldo !== 'number') global.db.data.users[target].saldo = 0
    global.db.data.users[target].saldo += amount
    return m.reply(`✅ Saldo ${target.split('@')[0]} menjadi ${rupiah(global.db.data.users[target].saldo)}`)
  }

  // ── RESET SALDO (owner) ──
  if (action === 'resetsaldo') {
    if (!isOwner) return m.reply('❌ Khusus owner.')
    let target = m.mentionedJid?.[0]
      ? m.mentionedJid[0]
      : args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null
    if (!target) return m.reply(`Format: ${usedPrefix + command} resetsaldo 628xxx`)
    if (!global.db.data.users[target]) return m.reply('❌ User tidak ditemukan.')
    global.db.data.users[target].saldo = 0
    return m.reply(`✅ Saldo ${target.split('@')[0]} direset ke Rp0.`)
  }

  // ── BATAL ORDER MANUAL ──
  if (action === 'batal') {
    if (user.nokos?.id) {
      try {
        // /cancel.php — DENGAN api_key
        const res = await apiGet('/cancel.php', { id: user.nokos.id })
        const refund = res.data?.refunded_amount || user.nokos.price
        user.saldo += Number(refund)
        await m.reply(
          `✅ *Order Dibatalkan*\n\n` +
          `🆔 Order ID : ${user.nokos.id}\n` +
          `💰 Refund   : ${rupiah(refund)}\n` +
          `👛 Saldo    : ${rupiah(user.saldo)}`
        )
      } catch {
        user.saldo += Number(user.nokos.price || 0)
        await m.reply(`✅ Order dibatalkan. Saldo ${rupiah(user.nokos.price)} dikembalikan.`)
      }
      user.nokos = null
    } else {
      resetSession(conn, m.sender)
      await m.reply('✅ Sesi nokos dibatalkan.')
    }
    return
  }

  // ── HELP ──
  return m.reply(
`*MENU NOKOS*
━━━━━━━━━━━━━━━━━━
${usedPrefix + command}                   — Beli OTP
${usedPrefix + command} ceksaldo          — Cek saldo
${usedPrefix + command} batal             — Batal order/sesi
${usedPrefix + command} addsaldo 628x nom *(owner)*
${usedPrefix + command} resetsaldo 628x   *(owner)*`
  )
}

handler.before = async (m, { conn }) => {
  conn.nokosSession ||= {}
  let session = conn.nokosSession[m.sender]
  if (!session) return
  if (!m.text || isNaN(m.text)) return
  if (!m.quoted || m.quoted.id !== session.id) return

  if (Date.now() - Number(session.created || 0) > 300000) {
    resetSession(conn, m.sender)
    return m.reply('⏰ Sesi kadaluarsa. Silakan ulangi.')
  }

  let choice = parseInt(m.text)
  let selected = session.options[choice]
  if (!selected) return m.reply('❌ Pilihan tidak valid.')

  try {
    // ── NEGARA → LAYANAN ──
    if (session.stage === 'NEGARA') {
      // /layanan.php — TANPA api_key sesuai docs
      const res = await apiGetNoAuth('/layanan.php', { negara: selected.id_negara })
      const data = res?.[selected.id_negara]
      if (!data || !Object.keys(data).length) {
        resetSession(conn, m.sender)
        return m.reply('❌ Tidak ada layanan untuk negara ini.')
      }

      let txt = `*Negara: ${selected.nama_negara}*\nPilih Layanan (balas/reply dengan angka):\n\n`
      const options = {}
      Object.entries(data).forEach(([kode, info], i) => {
        txt += `${i + 1}. ${info.layanan} — ${rupiah(Number(info.harga) + PROFIT)}\n`
        txt += `    Stok: ${info.stok}\n`
        options[i + 1] = {
          kode, layanan: info.layanan,
          harga: Number(info.harga) + PROFIT,
          id_negara: selected.id_negara,
          nama_negara: selected.nama_negara
        }
      })

      let msg = await m.reply(txt)
      conn.nokosSession[m.sender] = {
        stage: 'LAYANAN', id: msg.key.id, options, created: Date.now()
      }
      return
    }

    // ── LAYANAN → OPERATOR ──
    if (session.stage === 'LAYANAN') {
      // /operator.php — TANPA api_key sesuai docs
      const res = await apiGetNoAuth('/operator.php', { negara: selected.id_negara })
      const ops = res?.data?.[selected.id_negara]
      if (!ops?.length) {
        resetSession(conn, m.sender)
        return m.reply('❌ Operator tidak tersedia.')
      }

      let txt = `*Layanan: ${selected.layanan}*\nPilih Operator (balas/reply dengan angka):\n\n`
      const options = {}
      ops.forEach((op, i) => {
        txt += `${i + 1}. ${op}\n`
        options[i + 1] = { ...selected, operator: op }
      })

      let msg = await m.reply(txt)
      conn.nokosSession[m.sender] = {
        stage: 'OPERATOR', id: msg.key.id, options, created: Date.now()
      }
      return
    }

    // ── OPERATOR → ORDER ──
    if (session.stage === 'OPERATOR') {
      let user = userData(m.sender)

      if (user.saldo < selected.harga) {
        resetSession(conn, m.sender)
        return m.reply(
          `❌ *Saldo tidak cukup!*\n\n` +
          `Harga  : ${rupiah(selected.harga)}\n` +
          `Saldo  : ${rupiah(user.saldo)}\n` +
          `Kurang : *${rupiah(selected.harga - user.saldo)}*`
        )
      }

      // /order.php — DENGAN api_key
      const res = await apiGet('/order.php', {
        negara:   selected.id_negara,
        layanan:  selected.kode,
        operator: selected.operator
      })

      if (!res.success || !res.data) {
        resetSession(conn, m.sender)
        return m.reply(`❌ Gagal order.\n${res?.message || ''}`)
      }

      const d = res.data
      user.saldo -= selected.harga
      user.nokos = {
        id:       String(d.order_id),
        price:    selected.harga,
        time:     Date.now(),
        chat:     m.chat,
        phone:    String(d.number || ''),
        service:  selected.layanan,
        country:  selected.nama_negara,
        operator: selected.operator
      }

      resetSession(conn, m.sender)

      await m.reply(
`✅ *Order Sukses!*

🆔 Order ID   : ${d.order_id}
📞 Nomor      : ${d.number}
📱 Layanan    : ${selected.layanan}
🌍 Negara     : ${selected.nama_negara}
📶 Operator   : ${selected.operator}
💰 Harga      : ${rupiah(selected.harga)}
👛 Sisa Saldo : ${rupiah(user.saldo)}

⏳ Menunggu OTP... (Maks 5 menit)
Batalkan: *.nokos batal*`
      )
      return
    }
  } catch (e) {
    resetSession(conn, m.sender)
    return m.reply(failText(e.message))
  }
}

handler.help    = ['nokos', 'nokos ceksaldo', 'nokos batal']
handler.tags    = ['store']
handler.command = /^(nokos)$/i

module.exports = handler

// ── Auto cek OTP tiap 10 detik ──
if (!global.nokosAuto) {
  global.nokosAuto = true

  setInterval(async () => {
    if (!global.conn || !global.db?.data?.users || !APIKEY) return

    for (let jid in global.db.data.users) {
      let user = global.db.data.users[jid]
      if (!user?.nokos?.id) continue

      try {
        // /sms.php — DENGAN api_key
        const res = await axios.get(`${BASE_URL}/sms.php`, {
          params: { api_key: APIKEY, id: user.nokos.id },
          timeout: 30000
        })
        const data = res.data

        if (data.success && data.data?.otp) {
          const otp   = String(data.data.otp)
          const phone = user.nokos.phone
          const tgl   = formatDate(Date.now())

          const notifText =
            `📢 *Transaksi OTP Selesai*\n\n` +
            `📱 *Layanan:* ${user.nokos.service}\n` +
            `🌍 *Negara:* ${user.nokos.country}\n` +
            `📶 *Operator:* ${user.nokos.operator}\n\n` +
            `🆔 *Order ID:* ${user.nokos.id}\n` +
            `📞 *Nomor:* ${maskPhone(phone)}\n` +
            `🔐 *Kode OTP:* ${maskOtp(otp)}\n` +
            `💰 *Harga:* ${rupiah(user.nokos.price)}\n\n` +
            `📆 *Tanggal:* ${tgl}`

          await global.conn.sendMessage(user.nokos.chat, { text: notifText })
          await global.conn.sendMessage(TARGET_GC, { text: notifText })

          user.nokos = null
          continue
        }

        // Timeout 5 menit → auto cancel
        if (Date.now() - Number(user.nokos.time || 0) > OTP_TIMEOUT) {
          try {
            // /cancel.php — DENGAN api_key
            const cancelRes = await axios.get(`${BASE_URL}/cancel.php`, {
              params: { api_key: APIKEY, id: user.nokos.id },
              timeout: 30000
            })
            const refund = cancelRes.data?.data?.refunded_amount || user.nokos.price
            user.saldo += Number(refund)
          } catch {
            user.saldo += Number(user.nokos.price || 0)
          }

          await global.conn.sendMessage(user.nokos.chat, {
            text:
              `⏰ *Waktu Habis*\n\n` +
              `Order *${user.nokos.id}* otomatis dibatalkan.\n` +
              `💰 Saldo ${rupiah(user.nokos.price)} dikembalikan.\n` +
              `👛 Saldo sekarang: ${rupiah(user.saldo)}`
          })

          user.nokos = null
        }
      } catch {}
    }
  }, CHECK_INTERVAL)
}