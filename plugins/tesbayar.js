//code made by kasan
const fetch = require('node-fetch')

let handler = async (m, { conn, text }) => {

if (!text) return m.reply('Contoh:\n.bayar 1000')

let amount = parseInt(text)
if (isNaN(amount)) return m.reply('Nominal tidak valid')

let res = await fetch('https://cashify.my.id/api/generate/v2/qris', {
method: 'POST',
headers: {
'x-license-key': global.cashify,
'content-type': 'application/json'
},
body: JSON.stringify({
qr_id: 'f480f37b-1e13-4647-800e-fbd89a15b0da',
amount: amount,
useUniqueCode: true,
packageIds: ['id.dana'],
expiredInMinutes: 15,
qrType: 'dynamic',
paymentMethod: 'qris',
useQris: true
})
})

let json = await res.json()

if (!json.status || !json.data) {
return m.reply('Gagal generate QRIS')
}

let data = json.data
let qr = data.qr_string
let total = data.totalAmount
let trx = data.transactionId

await conn.sendMessage(m.chat, {
image: {
url: `https://larabert-qrgen.hf.space/v1/create-qr-code?size=500x500&style=2&color=000000&data=${encodeURIComponent(qr)}`
},
caption: `Silakan bayar Rp${total}\n\nID: ${trx}`
}, { quoted: m })

}

handler.command = ['bayar']
handler.owner = true

module.exports = handler