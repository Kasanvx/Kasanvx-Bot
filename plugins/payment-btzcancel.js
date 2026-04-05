const axios = require('axios')

let handler = async (m) => {

  let trx = global.btzPending[m.sender]
  if (!trx) return m.reply('Tidak ada transaksi.')

  try {

    await axios.post(
      `https://web.btzpay.my.id/api/qris/cancel/${trx.id}`,
      { apikey: global.shopee.apikey }
    )

    m.reply('✅ Permintaan cancel dikirim.')

  } catch (err) {
    console.log(err.response?.data || err.message)
    m.reply('❌ Gagal cancel.')
  }
}

handler.command = /^btzcancel$/i
handler.tags = ['payment']
handler.help = ['btzcancel']

module.exports = handler