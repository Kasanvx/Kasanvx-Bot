// credits : kasan
const axios = require('axios')

const yobaseApiKey = '5935057bc5029dd1a03e99b26912715175998340560a6c6892ad8847f12680c2'
const yobaseSessionId = 'sess_33_1774935538'

global.btzPending = global.btzPending || {}

function rupiah(x) {
  return 'Rp ' + Number(x || 0).toLocaleString('id-ID')
}

async function deleteMsg(conn, chat, msgId) {
  try {
    await conn.sendMessage(chat, { delete: { remoteJid: chat, fromMe: true, id: msgId } })
  } catch {}
}

function startPolling(conn, sender) {
  const interval = setInterval(async () => {
    const trx = global.btzPending[sender]
    if (!trx) return clearInterval(interval)

    if (Date.now() - trx.created > 15 * 60 * 1000) {
      try {
        await axios.post(`https://web.btzpay.my.id/api/qris/cancel/${trx.id}`, { key: trx.key }, { timeout: 10000 })
      } catch {}
      await conn.sendMessage(trx.chat, {
        text: `⏰ *TRANSAKSI EXPIRED*\n\n🧾 ${trx.id}\n💰 ${rupiah(trx.amount)}\n\nTransaksi dibatalkan otomatis karena melewati batas waktu 15 menit.\nSilakan buat transaksi baru.`
      })
      await deleteMsg(conn, trx.chat, trx.msgId)
      delete global.btzPending[sender]
      return clearInterval(interval)
    }

    try {
      const { data } = await axios.get(`https://web.btzpay.my.id/api/qris/transaction/${trx.id}?key=${trx.key}`, { timeout: 10000 })
      if (!data.success) return

      const status = data.data.status

      if (status === 'sukses') {
        const dateStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        
        const chatMsg = `🎉 *PEMBAYARAN BERHASIL MASUK* 🎉\n━━━━━━━━━━━━━━━━━\nTerima kasih! Pembayaran kamu telah kami terima.\n\n🧾 *Ref:* ${trx.id}\n💰 *Nominal:* ${rupiah(trx.amount)}\n⏰ *Waktu:* ${dateStr}\n\n_Struk lengkap telah dikirimkan ke nomor WhatsApp kamu._\n━━━━━━━━━━━━━━━━━`
        await conn.sendMessage(trx.chat, { text: chatMsg })

        const receiptText = `=================================\n     🧾 STRUK PEMBAYARAN 🧾\n=================================\n\nStatus        : ✅ BERHASIL\nNo. Referensi : ${trx.id}\nWaktu         : ${dateStr}\nNominal       : ${rupiah(trx.amount)}\n\n---------------------------------\nDetail Pelanggan:\nNomor         : ${sender.split('@')[0]}\nLayanan       : Pembayaran QRIS\n---------------------------------\n\nTerima kasih telah melakukan pembayaran.\nSimpan pesan ini sebagai bukti pembayaran yang sah.\n=================================`
        
        try {
          await axios.post('https://whats.yobase.me/api/send', {
            session_id: yobaseSessionId,
            to: sender.split('@')[0],
            message: receiptText,
            type: 'text'
          }, {
            headers: {
              'X-Api-Key': yobaseApiKey,
              'Content-Type': 'application/json'
            }
          })
        } catch (err) {}

        await deleteMsg(conn, trx.chat, trx.msgId)
        delete global.btzPending[sender]
        clearInterval(interval)
      }

      if (['expired', 'cancel', 'gagal'].includes(status)) {
        await conn.sendMessage(trx.chat, {
          text: `❌ *TRANSAKSI ${status.toUpperCase()}*\n\n🧾 Ref: ${trx.id}\n\nSilakan buat transaksi baru.`
        })
        await deleteMsg(conn, trx.chat, trx.msgId)
        delete global.btzPending[sender]
        clearInterval(interval)
      }
    } catch (err) {}
  }, 5000)
}

let handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return m.reply(`💳 *BAYAR VIA QRIS*\n━━━━━━━━━━━━━━━━━\n\n📌 *Format:* .bayar <nominal>\n💡 *Contoh:* .bayar 10000\n💳 *Minimal:* Rp 10`)
  }

  const amount = parseInt(args[0].replace(/[^\d]/g, ''))
  if (isNaN(amount) || amount < 10) return m.reply('❌ Minimal pembayaran adalah *Rp 10*')

  if (!global.shopee || !global.shopee.apikey) return m.reply('❌ API Key pembayaran belum dikonfigurasi.')

  const existing = global.btzPending[m.sender]
  if (existing) {
    const elapsed = Date.now() - existing.created
    if (elapsed < 15 * 60 * 1000) {
      return m.reply(`⚠️ *Ada Transaksi Pending!*\n\n🧾 ${existing.id}\nSelesaikan pembayaran sebelumnya atau tunggu hingga kedaluwarsa (15 menit).`)
    } else {
      delete global.btzPending[m.sender]
    }
  }

  try {
    await m.reply('⏳ *Menyiapkan QRIS Pembayaran...*')

    const fee = Math.ceil(amount * 0.009)
    const total = amount + fee

    const { data } = await axios.post(
      'https://web.btzpay.my.id/api/qris/create',
      {
        apikey: global.shopee.apikey,
        amount,
        fee,
        notes: 'Order by ' + m.sender,
        timeout: 15 * 60 * 1000,
        metadata: { sender: m.sender }
      },
      { timeout: 15000 }
    )

    if (!data.success) return m.reply('❌ Gagal membuat transaksi.')

    const trx = data.data
    const caption = `*Pembayaran Qris Otomatis*\n\nNominal: ${rupiah(amount)}\nBiaya Admin: ${rupiah(fee)}\nTotal Bayar: ${rupiah(total)}\nREF: ${trx.transactionId}\n\n⏳ Menunggu pembayaran...\n• Silakan scan QRIS di atas.\n• Proses otomatis biasanya 1-3 menit setelah transfer.\n• Jika setelah 5 menit saldo belum masuk, silakan hubungi admin\n\n⚠️ Qris Kadaluarsa dalam ±15 menit Lagi.`

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

    startPolling(conn, m.sender)

  } catch (err) {
    m.reply('❌ Gagal membuat transaksi. Coba lagi nanti.')
  }
}

handler.command = /^bayar$/i
handler.tags = ['payment']
handler.help = ['bayar <nominal>']
handler.register = true

module.exports = handler