// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const axios    = require('axios')
const GROUP_WM = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

const TIERS = {
  1: { label: '7 Hari',  days: 7,  harga: 7000,  tier: '7hari'  },
  2: { label: '15 Hari', days: 15, harga: 15000, tier: '15hari' },
  3: { label: '30 Hari', days: 30, harga: 25000, tier: '30hari' },
}

function rupiah(x) {
  return 'Rp' + Number(x || 0).toLocaleString('id-ID')
}

function ensureDB() {
  global.db.data.joinMembers ||= {}
  global.db.data.sewaOrders  ||= {}
}

global.sewaPending = global.sewaPending || {}

function formatDate(ts) {
  const d  = new Date(ts + 7 * 3600000)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yy = d.getUTCFullYear()
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mn = String(d.getUTCMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${mn} WIB`
}

function formatMenu() {
  return (
    `🤖 *SEWA BOT*\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Dengan sewa bot, kamu bisa pakai:\n` +
    `*/join <link group>* — bot join group kamu\n\n` +
    `📦 *Pilih Paket:*\n\n` +
    Object.entries(TIERS).map(([no, t]) =>
      `*${no}.* ${t.label}\n    💰 ${rupiah(t.harga)}`
    ).join('\n\n') +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Balas dengan nomor pilihan\n` +
    `Contoh: *.sewabot 1*`
  )
}

let handler = async (m, { conn, args }) => {
  try {
    ensureDB()

    if (!global.shopee?.apikey) return m.reply('❌ API Key btzpay belum diset.')

    const pilihan = parseInt(args[0])

    if (!args[0] || isNaN(pilihan)) {
      const msg = await m.reply(formatMenu())
      global.sewaPending[m.sender] = {
        stage: 'PILIH', msgId: msg.key.id, chat: m.chat, created: Date.now()
      }
      return
    }

    const tier = TIERS[pilihan]
    if (!tier) return m.reply(`❌ Pilihan tidak valid. Pilih 1, 2, atau 3.`)

    await prosesOrder(m, conn, tier)

  } catch (e) {
    console.error('sewabot error:', e)
    m.reply(failText('lagi error: ' + e.message))
  }
}

async function prosesOrder(m, conn, tier) {
  ensureDB()

  // Bersihkan pending yang sudah expired
  const existing = global.sewaPending[m.sender]
  if (existing?.stage === 'BAYAR') {
    if (Date.now() - existing.created > 15 * 60 * 1000) {
      delete global.sewaPending[m.sender]
    } else {
      return m.reply(`⚠️ *Masih ada order pending!*\nSelesaikan dulu pembayaran sebelumnya.`)
    }
  }

  await m.reply('⏳ Membuat QRIS...')

  const amount = tier.harga
  const fee    = Math.ceil(amount * 0.009)
  const total  = amount + fee

  try {
    const { data } = await axios.post(
      'https://web.btzpay.my.id/api/qris/create',
      {
        apikey:   global.shopee.apikey,
        amount, fee,
        notes:    `Sewa Bot ${tier.label} - ${m.sender}`,
        timeout:  15 * 60 * 1000,
        metadata: { sender: m.sender, tier: tier.tier }
      },
      { timeout: 15000 }
    )

    if (!data.success) return m.reply('❌ Gagal membuat QRIS.')

    const trx     = data.data
    const expDt   = new Date(new Date(trx.expiredAt).getTime() + 7 * 3600000)
    const dd      = String(expDt.getUTCDate()).padStart(2, '0')
    const mm      = String(expDt.getUTCMonth() + 1).padStart(2, '0')
    const yyyy    = expDt.getUTCFullYear()
    const hh      = String(expDt.getUTCHours()).padStart(2, '0')
    const mn      = String(expDt.getUTCMinutes()).padStart(2, '0')
    const invoice = 'INV-' + trx.transactionId.slice(-6).toUpperCase()

    const caption =
      `// credits : kasan\n\n` +
      `=======================\n` +
      `🤖 *Sewa Bot ${tier.label}*\n` +
      `🏢 *Merchant* : Khasan\n` +
      `📝 *Invoice* : ${invoice}\n` +
      `🆔 *Ref ID* : ${trx.transactionId}\n` +
      `💳 *Metode* : QRIS\n` +
      `⏳ *Status* : PENDING\n` +
      `=======================\n` +
      `*Rincian:*\n` +
      `Paket        : ${tier.label}\n` +
      `Harga        : ${rupiah(amount)}\n` +
      `Biaya (0.9%) : ${rupiah(fee)}\n` +
      `*TOTAL BAYAR  : ${rupiah(total)}*\n` +
      `=======================\n` +
      `⚠️ *Segera lunasi sebelum:*\n` +
      `🗓️ ${dd}/${mm}/${yyyy}  Jam : ${hh}:${mn} WIB\n\n` +
      `> jika ada masalah silahkan ketik /owner`

    const imageBuffer = trx.qrisImage
      ? Buffer.from(trx.qrisImage.split(',')[1], 'base64')
      : null

    const msg = await conn.sendMessage(m.chat, {
      image:   imageBuffer || { url: trx.paymentUrl },
      caption
    }, { quoted: m })

    global.sewaPending[m.sender] = {
      stage:   'BAYAR',
      id:      trx.transactionId,
      key:     trx.accessKey,
      msgId:   msg.key.id,
      chat:    m.chat,
      tier:    tier.tier,
      days:    tier.days,
      label:   tier.label,
      amount:  total,
      created: Date.now()
    }

    startSewaPolling(conn, m.sender)

  } catch (e) {
    m.reply(failText('gagal buat QRIS: ' + e.message))
  }
}

handler.before = async (m, { conn }) => {
  const sesi = global.sewaPending?.[m.sender]
  if (!sesi || sesi.stage !== 'PILIH') return
  if (!m.quoted || m.quoted.id !== sesi.msgId) return
  if (!m.text || isNaN(m.text)) return

  delete global.sewaPending[m.sender]

  const pilihan = parseInt(m.text.trim())
  const tier    = TIERS[pilihan]
  if (!tier) return m.reply(`❌ Pilihan tidak valid. Ketik 1, 2, atau 3.`)

  await prosesOrder(m, conn, tier)
}

function startSewaPolling(conn, sender) {
  const interval = setInterval(async () => {
    const sesi = global.sewaPending[sender]
    if (!sesi || sesi.stage !== 'BAYAR') return clearInterval(interval)

    // Auto cancel expired 15 menit
    if (Date.now() - sesi.created > 15 * 60 * 1000) {
      try {
        await axios.post('https://web.btzpay.my.id/api/qris/cancel/' + sesi.id,
          { key: sesi.key }, { timeout: 10000 })
      } catch {}
      await conn.sendMessage(sesi.chat, {
        text:
          `⏰ *ORDER SEWA EXPIRED*\n\n` +
          `🧾 ${sesi.id}\n` +
          `💰 ${rupiah(sesi.amount)}\n\n` +
          `Transaksi dibatalkan otomatis.\n` +
          `Silakan order lagi: *.sewabot*`
      })
      await deleteMsg(conn, sesi.chat, sesi.msgId)
      delete global.sewaPending[sender]
      return clearInterval(interval)
    }

    try {
      const { data } = await axios.get(
        'https://web.btzpay.my.id/api/qris/transaction/' + sesi.id + '?key=' + sesi.key,
        { timeout: 10000 }
      )

      if (!data.success) return
      const status = data.data.status

      if (status === 'sukses') {
        clearInterval(interval)
        await deleteMsg(conn, sesi.chat, sesi.msgId)
        delete global.sewaPending[sender]

        ensureDB()

        const now       = Date.now()
        const expiredAt = now + sesi.days * 24 * 60 * 60 * 1000

        global.db.data.joinMembers[sender] = {
          tier:      sesi.tier,
          label:     sesi.label,
          expiredAt,
          joinedAt:  now,
          orderId:   sesi.id
        }

        global.db.data.sewaOrders[sesi.id] = {
          sender, tier: sesi.tier, amount: sesi.amount,
          paidAt: now, expiredAt
        }

        await conn.sendMessage(sesi.chat, {
          text:
            `╔══════════════════════╗\n` +
            `║  ✅ *PEMBAYARAN BERHASIL* ║\n` +
            `╚══════════════════════╝\n\n` +
            `💰 Total     : ${rupiah(sesi.amount)}\n` +
            `📦 Paket     : *${sesi.label}*\n` +
            `📅 Aktif s/d : *${formatDate(expiredAt)}*\n\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🎉 *Akses kamu sudah aktif!*\n\n` +
            `Sekarang kamu bisa pakai:\n` +
            `*/join <link group WhatsApp>*\n\n` +
            `Contoh:\n` +
            `_/join https://chat.whatsapp.com/xxx_\n\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `⚠️ Akses berlaku sampai ${formatDate(expiredAt)}`
        })
      }

      if (['expired', 'cancel', 'gagal'].includes(status)) {
        clearInterval(interval)
        await conn.sendMessage(sesi.chat, {
          text:
            `❌ *TRANSAKSI ${status.toUpperCase()}*\n\n` +
            `🧾 ${sesi.id}\n` +
            `Silakan order lagi: *.sewabot*`
        })
        await deleteMsg(conn, sesi.chat, sesi.msgId)
        delete global.sewaPending[sender]
      }

    } catch (e) {
      console.error('[SEWA POLLING]', e.message)
    }
  }, 5000)
}

async function deleteMsg(conn, chat, msgId) {
  try {
    await conn.sendMessage(chat, {
      delete: { remoteJid: chat, fromMe: true, id: msgId }
    })
  } catch {}
}

handler.command = /^(sewabot|sewa)$/i
handler.tags    = ['store']
handler.help    = ['sewabot', 'sewabot <1/2/3>']

module.exports = handler

// ── Watcher expired membership ──
if (!global.sewaWatcher) {
  global.sewaWatcher = true

  setInterval(async () => {
    if (!global.conn || !global.db?.data?.joinMembers) return
    ensureDB()

    for (const [jid, member] of Object.entries(global.db.data.joinMembers)) {
      if (!member.expiredAt || member.notified) continue
      if (Date.now() < member.expiredAt) continue

      member.notified = true
      try {
        await global.conn.sendMessage(jid, {
          text:
            `⏰ *MEMBERSHIP EXPIRED*\n\n` +
            `Akses sewa bot kamu telah berakhir.\n` +
            `📦 Paket   : ${member.label || member.tier}\n` +
            `📅 Expired : ${formatDate(member.expiredAt)}\n\n` +
            `Perpanjang sekarang:\n` +
            `*.sewabot* — lihat paket & harga`
        })
      } catch {}
    }
  }, 60 * 1000)
}