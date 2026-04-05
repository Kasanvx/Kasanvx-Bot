// credits : kasan

const axios = require('axios')

function rupiah(x) {
  return 'Rp ' + Number(x || 0).toLocaleString('id-ID')
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let apiKey = global.tes ? global.tes.trim() : null

  if (!apiKey) {
    return m.reply('❌ API Key KinzTopup belum dikonfigurasi.')
  }

  if (/^kinzproduk|kinzlist$/i.test(command)) {
    if (!args[0]) {
      return m.reply(`🛒 *CEK PRODUK KINZTOPUP*\n━━━━━━━━━━━━━━━━━\n\nKetik nama game untuk mencari produk dan melihat ID-nya.\n\n📌 *Contoh:*\n${usedPrefix + command} mobile legends\n${usedPrefix + command} free fire`)
    }

    await m.reply('⏳ *Mencari produk...*')
    
    try {
      let { data } = await axios.post('https://kinztopup.com/api/v2/product', {
        api_key: apiKey
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!data.status) return m.reply(`❌ Gagal: ${data.message}`)

      let search = args.join(' ').toLowerCase()
      
      let filtered = data.data.filter(v => 
        (v.games && v.games.toLowerCase().includes(search)) || 
        (v.product && v.product.toLowerCase().includes(search))
      )

      if (filtered.length === 0) return m.reply(`❌ Produk untuk pencarian "${search}" tidak ditemukan.`)

      let txt = `🛒 *HASIL PENCARIAN PRODUK*\n━━━━━━━━━━━━━━━━━\n🔍 *Pencarian:* ${search}\n📦 *Total:* ${filtered.length} produk\n━━━━━━━━━━━━━━━━━\n\n`
      
      let max = filtered.length > 20 ? 20 : filtered.length
      for (let i = 0; i < max; i++) {
        let p = filtered[i]
        let harga = p.price.member || p.price.silver || p.price.gold || 0
        
        txt += `▸ *ID:* ${p.id}\n`
        txt += `▸ *Nama:* ${p.product}\n`
        txt += `▸ *Game:* ${p.games}\n`
        txt += `▸ *Harga:* ${rupiah(harga)}\n`
        txt += `▸ *Status:* ${p.status === 'On' ? '✅ Aktif' : '❌ Gangguan'}\n\n`
      }

      if (filtered.length > 20) txt += `_...dan ${filtered.length - 20} produk lainnya. Silakan gunakan kata kunci yang lebih spesifik._`

      return m.reply(txt.trim())
    } catch (e) {
      return m.reply(`❌ Error sistem: ${e.response?.data?.message || e.message}`)
    }
  }

  if (/^kinzorder|kinztopup$/i.test(command)) {
    if (args.length < 2) {
      return m.reply(`🛒 *ORDER KINZTOPUP*\n━━━━━━━━━━━━━━━━━\n\nMasukkan ID Produk dan ID User Tujuan.\nJika butuh Zone ID (Server), pisahkan dengan spasi.\n\n📌 *Format:*\n${usedPrefix + command} <ID_Produk> <ID_User> [Zone_ID]\n\n💡 *Contoh:*\n${usedPrefix + command} 932 12345678 1234\n${usedPrefix + command} 931 12345678`)
    }

    let id_produk = args[0]
    let user_id = args[1]
    let zone_id = args[2] || ''

    await m.reply('⏳ *Memproses pesanan...*')
    
    try {
      let payload = {
        api_key: apiKey,
        id: id_produk,
        user: user_id
      }
      if (zone_id) payload.zone = zone_id

      let { data } = await axios.post('https://kinztopup.com/api/v2/order', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!data.status) return m.reply(`❌ Gagal memproses pesanan: ${data.message}`)

      let d = data.data
      let txt = `✅ *PESANAN BERHASIL DIBUAT*\n━━━━━━━━━━━━━━━━━\n`
      txt += `🧾 *Order ID:* ${d.order_id}\n`
      txt += `📦 *Produk:* ${d.product}\n`
      txt += `💸 *Harga:* ${rupiah(d.price)}\n`
      txt += `👤 *Target:* ${d.user} ${d.zone ? `(${d.zone})` : ''}\n━━━━━━━━━━━━━━━━━\n\n`
      txt += `_Cek status pesanan ketik: ${usedPrefix}kinzstatus ${d.order_id}_`

      return m.reply(txt.trim())
    } catch (e) {
      return m.reply(`❌ Error sistem: ${e.response?.data?.message || e.message}`)
    }
  }

  if (/^kinzstatus|kinzcek$/i.test(command)) {
    if (!args[0]) {
      return m.reply(`🔎 *CEK STATUS KINZTOPUP*\n━━━━━━━━━━━━━━━━━\n\nMasukkan Order ID dari transaksi yang sudah dilakukan.\n\n📌 *Format:*\n${usedPrefix + command} <Order_ID>\n\n💡 *Contoh:*\n${usedPrefix + command} KT0000000000001`)
    }

    let order_id = args[0]

    await m.reply('⏳ *Mengecek status pesanan...*')
    
    try {
      let { data } = await axios.post('https://kinztopup.com/api/v2/status', {
        api_key: apiKey,
        order_id: order_id
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!data.status) return m.reply(`❌ Gagal: ${data.message}`)

      let d = data.data
      let emojiStatus = d.status === 'Success' ? '✅' : d.status === 'Processing' ? '⏳' : d.status === 'Pending' ? '⚠️' : '❌'

      let txt = `🔎 *DETAIL PESANAN*\n━━━━━━━━━━━━━━━━━\n`
      txt += `🧾 *Order ID:* ${order_id}\n`
      txt += `📦 *Produk:* ${d.product}\n`
      txt += `👤 *Target:* ${d.target}\n`
      if (d.nickname) txt += `🎮 *Nickname:* ${d.nickname}\n`
      txt += `💸 *Harga:* ${rupiah(d.price)}\n`
      txt += `📌 *Status:* ${emojiStatus} ${d.status}\n`
      txt += `📝 *Catatan:* ${d.note}\n`

      return m.reply(txt.trim())
    } catch (e) {
      return m.reply(`❌ Error sistem: ${e.response?.data?.message || e.message}`)
    }
  }
}

handler.command = /^(kinzproduk|kinzlist|kinzorder|kinztopup|kinzstatus|kinzcek)$/i
handler.tags = ['store']
handler.help = ['kinzproduk <game>', 'kinzorder <id> <user> [zone]', 'kinzstatus <order_id>']
handler.register = true

module.exports = handler