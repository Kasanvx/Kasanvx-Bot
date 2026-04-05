/**
 * Plugin: Cek Saldo - RumahOTP
 *
 * Channel : snx.biz.id/ch-xsn
 */

const axios = require('axios')

async function getBalance(apikey) {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://www.rumahotp.com/api/v1/user/balance',
      headers: {
        'x-apikey': apikey,
        'Accept': 'application/json'
      }
    })
    return response.data
  } catch (err) {
    return { success: false, message: err.message }
  }
}

let handler = async (m, { conn }) => {

  if (!global.api) {
    return m.reply('❌ API key tidak ditemukan di global.api')
  }

  await m.reply('⏳ Mengecek saldo...')

  const res = await getBalance(global.api)

  if (!res || !res.success) {
    return m.reply('❌ Gagal mengambil saldo.')
  }

  const data = res.data

  let teks = `
╭─〔 *RUMAH OTP BALANCE* 〕
│ 👤 Username : ${data.username}
│ 📛 Nama     : ${data.first_name} ${data.last_name}
│ 📧 Email    : ${data.email}
│ 💰 Saldo    : ${data.formated}
╰────────────────
`.trim()

  conn.reply(m.chat, teks, m)
}

handler.help = ['saldoadmin']
handler.tags = ['tools']
handler.command = /^(saldoadmin|adminbalance)$/i

module.exports = handler