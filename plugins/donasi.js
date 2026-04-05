// credits : kasan

const axios = require('axios')

global.btzPending = global.btzPending || {}
const OWNER_GC = '120363407997425069@g.us'

function ensureDB() {
  global.db.data.users ||= {}
  global.db.data.donasi ||= {}
  global.db.data.donasi.logs ||= []
}

function userData(id) {
  ensureDB()
  global.db.data.users[id] ||= {}
  let user = global.db.data.users[id]
  if (typeof user.totalDonasi !== 'number') user.totalDonasi = 0
  if (typeof user.totalDonasiCount !== 'number') user.totalDonasiCount = 0
  if (!Array.isArray(user.riwayatDonasi)) user.riwayatDonasi = []
  return user
}

function rupiah(x) {
  return 'Rp ' + Number(x || 0).toLocaleString('id-ID')
}

function nowWIB() {
  return new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

function pushRiwayat(sender, data) {
  ensureDB()
  let user = userData(sender)
  user.riwayatDonasi.unshift(data)
  if (user.riwayatDonasi.length > 20) user.riwayatDonasi = user.riwayatDonasi.slice(0, 20)
  global.db.data.donasi.logs.unshift({ sender, ...data })
  if (global.db.data.donasi.logs.length > 200) {
    global.db.data.donasi.logs = global.db.data.donasi.logs.slice(0, 200)
  }
}

async function sendOwnerNotif(conn, payload = {}) {
  try {
    let text = `🔔 *NOTIFIKASI DONASI*\n━━━━━━━━━━━━━━━━━\n👤 *Pengirim:* ${payload.name || '-'}\n🆔 *User:* ${payload.sender ? payload.sender.split('@')[0] : '-'}\n🧾 *Ref:* ${payload.id || '-'}\n💸 *Nominal:* ${rupiah(payload.amount)}\n🕒 *Waktu:* ${nowWIB()}\n━━━━━━━━━━━━━━━━━\n✨ _Donasi berhasil masuk._`
    await conn.sendMessage(OWNER_GC, { text })
  } catch (e) {}
}

async function deleteMsg(conn, chat, msgId) {
  try {
    await conn.sendMessage(chat, { delete: { remoteJid: chat, fromMe: true, id: msgId } })
  } catch {}
}

function startPolling(conn, sender, name, amount) {
  const interval = setInterval(async () => {
    const trx = global.btzPending[sender]
    if (!trx) return clearInterval(interval)

    if (Date.now() - trx.created > 15 * 60 * 1000) {
      try {
        await axios.post('https://web.btzpay.my.id/api/qris/cancel/' + trx.id, { key: trx.key }, { timeout: 10000 })
      } catch {}
      await conn.sendMessage(trx.chat, { text: `⏰ *WAKTU HABIS*\n━━━━━━━━━━━━━━━━━\n🧾 ${trx.id}\n💸 ${rupiah(trx.amount)}\n\n_Donasi dibatalkan otomatis karena melewati batas waktu 15 menit._` })
      await deleteMsg(conn, trx.chat, trx.msgId)
      delete global.btzPending[sender]
      return clearInterval(interval)
    }

    try {
      const { data } = await axios.get('https://web.btzpay.my.id/api/qris/transaction/' + trx.id + '?key=' + trx.key, { timeout: 10000 })
      if (!data.success) return

      const status = data.data.status

      if (status === 'sukses') {
        let user = userData(sender)
        user.totalDonasi += amount
        user.totalDonasiCount += 1

        pushRiwayat(sender, { refNo: trx.id, amount, status: 'success', time: nowWIB() })

        await conn.sendMessage(trx.chat, {
          text: `🎉 *DONASI BERHASIL!* 🎉\n━━━━━━━━━━━━━━━━━\nTerima kasih banyak *${name}* atas donasinya sebesar *${rupiah(amount)}*! 🙏✨\n\n📊 *Statistik Kamu:*\n▸ Total Donasi: ${rupiah(user.totalDonasi)}\n▸ Jumlah: ${user.totalDonasiCount}x\n\n_Cek peringkatmu dengan mengetik *.donasitop*_`
        })

        await sendOwnerNotif(conn, { sender, name, id: trx.id, amount })
        await deleteMsg(conn, trx.chat, trx.msgId)
        delete global.btzPending[sender]
        clearInterval(interval)
      }

      if (['expired', 'cancel', 'gagal'].includes(status)) {
        await conn.sendMessage(trx.chat, { text: `❌ *DONASI ${status.toUpperCase()}*\n━━━━━━━━━━━━━━━━━\n🧾 ${trx.id}\n\n_Transaksi gagal atau dibatalkan. Silakan buat ulang jika ingin berdonasi._` })
        await deleteMsg(conn, trx.chat, trx.msgId)
        delete global.btzPending[sender]
        clearInterval(interval)
      }
    } catch (err) {}
  }, 5000)
}

let handler = async (m, { conn, args, command }) => {
  ensureDB()
  let user = userData(m.sender)
  const name = m.pushName || 'Orang Baik'

  if (/^donasi$/i.test(command)) {
    if (!args[0]) {
      return m.reply(`🤍 *MARI BERDONASI*\n━━━━━━━━━━━━━━━━━\n\nKirim donasi untuk mendukung program kami!\n💡 _"Uang donasi akan diberikan kepada orang yang membutuhkan."_\n\n📌 *Format:* .donasi <nominal>\n💡 *Contoh:* .donasi 10000\n💳 *Minimal:* Rp 1.000`)
    }

    const amount = parseInt(args[0].replace(/[^\d]/g, ''))
    if (isNaN(amount) || amount < 1000) return m.reply('❌ Minimal donasi adalah *Rp 1.000*')

    if (!global.shopee || !global.shopee.apikey) return m.reply('❌ API Key pembayaran belum dikonfigurasi oleh owner.')

    const existing = global.btzPending[m.sender]
    if (existing) {
      const elapsed = Date.now() - existing.created
      if (elapsed < 15 * 60 * 1000) {
        return m.reply(`⚠️ *Ada Donasi Pending!*\n━━━━━━━━━━━━━━━━━\nSelesaikan pembayaran sebelumnya (Ref: ${existing.id}) atau tunggu hingga kedaluwarsa.`)
      } else {
        delete global.btzPending[m.sender]
      }
    }

    try {
      await m.reply('⏳ *Menyiapkan QRIS Donasi...*')

      const fee = Math.ceil(amount * 0.009)
      const total = amount + fee

      const { data } = await axios.post(
        'https://web.btzpay.my.id/api/qris/create',
        {
          apikey: global.shopee.apikey,
          amount,
          fee,
          notes: 'Donasi dari ' + name,
          timeout: 15 * 60 * 1000,
          metadata: { sender: m.sender }
        },
        { timeout: 15000 }
      )

      if (!data.success) return m.reply('❌ Gagal membuat QRIS donasi.')

      const trx = data.data
      const expDt = new Date(new Date(trx.expiredAt).getTime() + 7 * 3600000)
      const dd = String(expDt.getUTCDate()).padStart(2, '0')
      const mm = String(expDt.getUTCMonth() + 1).padStart(2, '0')
      const yyyy = expDt.getUTCFullYear()
      const hh = String(expDt.getUTCHours()).padStart(2, '0')
      const mn = String(expDt.getUTCMinutes()).padStart(2, '0')

      const caption = `💳 *INVOICE DONASI*\n━━━━━━━━━━━━━━━━━\n👤 *Nama:* ${name}\n🧾 *Ref ID:* ${trx.transactionId}\n⚙️ *Metode:* QRIS\n\n*Rincian Pembayaran:*\n▸ Nominal: ${rupiah(amount)}\n▸ Biaya Admin: ${rupiah(fee)}\n*▸ Total Bayar: ${rupiah(total)}*\n━━━━━━━━━━━━━━━━━\n⚠️ *Batas Pembayaran:*\n🗓️ ${dd}/${mm}/${yyyy} ⏰ ${hh}:${mn} WIB\n\n💡 _"Uang donasi akan diberikan kepada orang yang membutuhkan."_\n\n_Silakan scan QR Code di atas. Pesan akan dihapus otomatis jika kedaluwarsa._`

      const imageBuffer = trx.qrisImage ? Buffer.from(trx.qrisImage.split(',')[1], 'base64') : null

      const msg = await conn.sendMessage(m.chat, {
        image: imageBuffer || { url: trx.paymentUrl },
        caption
      }, { quoted: m })

      global.btzPending[m.sender] = {
        id: trx.transactionId,
        key: trx.accessKey,
        msgId: msg.key.id,
        chat: m.chat,
        amount: total,
        created: Date.now()
      }

      startPolling(conn, m.sender, name, amount)

    } catch (err) {
      m.reply('❌ Sistem sedang sibuk. Gagal membuat QRIS.')
    }
  }

  if (/^donasiku$/i.test(command)) {
    let logs = Array.isArray(user.riwayatDonasi) ? user.riwayatDonasi : []
    let txt = `🤍 *RIWAYAT DONASI KAMU*\n━━━━━━━━━━━━━━━━━\n▸ Total Donasi : *${rupiah(user.totalDonasi)}*\n▸ Jumlah Donasi: *${user.totalDonasiCount}x*\n━━━━━━━━━━━━━━━━━\n`
    if (!logs.length) return m.reply(txt + `_Belum ada riwayat donasi._`)
    logs.slice(0, 10).forEach((v, i) => {
      txt += `\n*${i + 1}. ${rupiah(v.amount)}*\n   └ 🧾 Ref: ${v.refNo}\n   └ 🕒 Waktu: ${v.time}\n`
    })
    return m.reply(txt.trim())
  }

  if (/^donasitop$/i.test(command)) {
    let entries = Object.entries(global.db.data.users || {})
      .map(([jid, u]) => ({
        jid,
        name: u.name || u.registered_name || jid.split('@')[0],
        total: Number(u.totalDonasi || 0),
        count: Number(u.totalDonasiCount || 0)
      }))
      .filter(v => v.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    let txt = `🏆 *TOP ORANG BAIK*\n━━━━━━━━━━━━━━━━━\n`
    if (!entries.length) return m.reply(txt + `_Belum ada data donasi._`)
    
    entries.forEach((v, i) => {
      let medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'
      txt += `${medal} *${v.name}*\n   └ 💸 Donasi: *${rupiah(v.total)}* (${v.count}x)\n\n`
    })
    
    txt += `━━━━━━━━━━━━━━━━━\n💡 _"Uang donasi akan diberikan kepada orang yang membutuhkan."_`
    return m.reply(txt.trim())
  }

  if (/^totaldonasi$/i.test(command)) {
    let totalTerkumpul = 0
    Object.values(global.db.data.users || {}).forEach(u => {
      totalTerkumpul += Number(u.totalDonasi || 0)
    })

    let txt = `💰 *TOTAL DONASI TERKUMPUL*\n━━━━━━━━━━━━━━━━━\n▸ Total Keseluruhan: *${rupiah(totalTerkumpul)}*\n━━━━━━━━━━━━━━━━━\n💡 _"Uang donasi akan diberikan kepada orang yang membutuhkan."_`
    return m.reply(txt)
  }
}

handler.command = /^(donasi|donasiku|donasitop|totaldonasi)$/i
handler.tags = ['main']
handler.help = ['donasi <nominal>', 'donasiku', 'donasitop', 'totaldonasi']
handler.register = true
module.exports = handler