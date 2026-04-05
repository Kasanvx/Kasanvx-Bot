//kasanvx
const axios = require('axios')
const crypto = require('crypto')

const USERNAME = global.digiflazz_username || process.env.DIGIFLAZZ_USERNAME
const APIKEY   = global.digiflazz_apikey   || process.env.DIGIFLAZZ_APIKEY
const BASE_URL = 'https://api.digiflazz.com/v1'

const GAME_MAP = {
  topupff:      'Free Fire',
  topupml:      'Mobile Legend',
  topuppubg:    'PUBG',
  topupgenshin: 'Genshin',
  topupvalo:    'Valorant',
  topuphsr:     'Honkai Star Rail',
  topupcodm:    'Call of Duty',
  topupsb:      'Stumble Guys',
}

function rupiah(x) {
  return 'Rp' + Number(x || 0).toLocaleString('id-ID')
}

function sign(...args) {
  return crypto.createHash('md5').update(args.join('')).digest('hex')
}

function refId() {
  return 'BOT' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase()
}

// ── Cache pricelist ────────────────────────────────────────────────────────
let _cache = []
let _cacheTime = 0

async function getPricelist() {
  if (_cache.length && Date.now() - _cacheTime < 30 * 60 * 1000) return _cache
  const { data } = await axios.post(`${BASE_URL}/price-list`, {
    cmd: 'prabayar',
    username: USERNAME,
    sign: sign(USERNAME, APIKEY, 'pricelist')
  }, { timeout: 30000 })
  _cache = data.data || []
  _cacheTime = Date.now()
  return _cache
}

function getByGame(list, keyword) {
  return list.filter(p =>
    (String(p.category || '').toLowerCase().includes(keyword.toLowerCase()) ||
     String(p.product_name || '').toLowerCase().includes(keyword.toLowerCase())) &&
    p.buyer_product_status
  )
}

// ── Handler ────────────────────────────────────────────────────────────────
let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!USERNAME || !APIKEY) return m.reply('⚠️ Digiflazz belum dikonfigurasi.')

  const cmd = command.toLowerCase()

  // ── .topuplist → semua game tersedia ──────────────────────────────────
  if (cmd === 'topuplist') {
    await m.reply('🎮 Mengambil daftar game...')
    try {
      const list = await getPricelist()
      let msg = `🎮 *Daftar Top Up Game*\n━━━━━━━━━━━━━━━\n\n`
      for (const [c, nama] of Object.entries(GAME_MAP)) {
        const items = getByGame(list, nama)
        if (!items.length) continue
        const hargaMulai = Math.min(...items.map(p => p.price))
        msg += `• *${nama}*\n  ➜ ${usedPrefix}${c} | mulai ${rupiah(hargaMulai)}\n\n`
      }
      msg += `━━━━━━━━━━━━━━━\nKetik command di atas untuk lihat detail & beli.`
      return m.reply(msg)
    } catch (e) {
      console.error('[topup] error:', e.message)
      return m.reply('❌ Gagal ambil daftar game.')
    }
  }

  // ── .topupff / .topupml / dll ─────────────────────────────────────────
  if (cmd in GAME_MAP) {
    const gameName = GAME_MAP[cmd]
    const no     = parseInt(args[0])
    const idGame = args[1]

    // Tanpa args → tampil list bernomor
    if (!args[0]) {
      await m.reply(`🔍 Mengambil daftar ${gameName}...`)
      try {
        const list = await getPricelist()
        const items = getByGame(list, gameName)
        if (!items.length) return m.reply(`❌ Produk ${gameName} tidak tersedia.`)

        let msg = `🎮 *Top Up ${gameName}*\n━━━━━━━━━━━━━━━\n\n`
        items.forEach((p, i) => {
          msg += `${i + 1}. *${p.product_name}*\n   ${rupiah(p.price)}\n`
        })
        msg += `\n━━━━━━━━━━━━━━━`
        msg += `\nCara beli:\n*${usedPrefix}${cmd} <no> <ID Game>*`
        msg += `\nContoh:\n*${usedPrefix}${cmd} 1 12345678*`
        return m.reply(msg)
      } catch (e) {
        console.error('[topup] error:', e.message)
        return m.reply(`❌ Gagal ambil daftar ${gameName}.`)
      }
    }

    // Ada nomor tapi ga ada ID game
    if (!idGame) {
      return m.reply(
`Format: *${usedPrefix}${cmd} <no> <ID Game>*
Contoh: *${usedPrefix}${cmd} ${no || 1} 12345678*

Lihat list: *${usedPrefix}${cmd}*`
      )
    }

    // Ambil produk berdasarkan nomor
    const list = await getPricelist().catch(() => [])
    const items = getByGame(list, gameName)
    const produk = items[no - 1]

    if (!produk) {
      return m.reply(`❌ Nomor *${no}* tidak valid.\n\nLihat list: *${usedPrefix}${cmd}*`)
    }

    await m.reply(
`🎮 *Memproses Top Up...*

Produk: *${produk.product_name}*
ID Game: \`${idGame}\`
Harga: *${rupiah(produk.price)}*`
    )

    const ref = refId()

    global.db.data.users[m.sender] ||= {}
    global.db.data.users[m.sender].lastTopup = {
      ref, sku: produk.buyer_sku_code,
      product_name: produk.product_name,
      customer_no: idGame, price: produk.price,
      status: 'pending', chat: m.chat, created: Date.now()
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/transaction`, {
        username: USERNAME,
        buyer_sku_code: produk.buyer_sku_code,
        customer_no: idGame,
        ref_id: ref,
        sign: sign(USERNAME, APIKEY, ref)
      }, { timeout: 30000 })

      const res = data.data
      const status = String(res?.status || '').toLowerCase()
      global.db.data.users[m.sender].lastTopup.status = status

      if (status === 'sukses') {
        global.db.data.users[m.sender].lastTopup = null
        return m.reply(
`✅ *TOP UP BERHASIL!*

Produk: ${produk.product_name}
ID Game: ${idGame}
SN: ${res.sn || '-'}
Ref: ${ref}`
        )
      }

      if (status === 'gagal') {
        global.db.data.users[m.sender].lastTopup = null
        return m.reply(
`❌ *TOP UP GAGAL*

Produk: ${produk.product_name}
ID Game: ${idGame}
Alasan: ${res.message || 'Gagal'}
Ref: ${ref}`
        )
      }

      return m.reply(
`⏳ *TOP UP PENDING*

Produk: ${produk.product_name}
ID Game: ${idGame}
Ref: ${ref}

Notif otomatis akan dikirim setelah selesai.`
      )

    } catch (e) {
      console.error('[topup] transaksi error:', e.message)
      global.db.data.users[m.sender].lastTopup = null
      return m.reply('❌ Terjadi kesalahan saat transaksi.')
    }
  }
}

// ── Polling pending ────────────────────────────────────────────────────────
handler.before = async (m, { conn }) => {
  if (global.topupPollerStarted) return
  global.topupPollerStarted = true

  setInterval(async () => {
    if (!conn || !global.db?.data?.users) return

    for (const jid in global.db.data.users) {
      const trx = global.db.data.users[jid]?.lastTopup
      if (!trx || trx.status !== 'pending') continue

      if (Date.now() - trx.created > 10 * 60 * 1000) {
        await conn.sendMessage(trx.chat, { text:
`⚠️ *TOP UP TIMEOUT*

Produk: ${trx.product_name}
ID Game: ${trx.customer_no}
Ref: ${trx.ref}

Hubungi admin dengan Ref ID di atas.`
        })
        global.db.data.users[jid].lastTopup = null
        continue
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/transaction`, {
          username: USERNAME,
          buyer_sku_code: trx.sku,
          customer_no: trx.customer_no,
          ref_id: trx.ref,
          sign: sign(USERNAME, APIKEY, trx.ref)
        }, { timeout: 15000 })

        const res = data.data
        const status = String(res?.status || '').toLowerCase()

        if (status === 'sukses') {
          global.db.data.users[jid].lastTopup = null
          await conn.sendMessage(trx.chat, { text:
`✅ *TOP UP BERHASIL!*

Produk: ${trx.product_name}
ID Game: ${trx.customer_no}
SN: ${res.sn || '-'}
Ref: ${trx.ref}`
          })
        } else if (status === 'gagal') {
          global.db.data.users[jid].lastTopup = null
          await conn.sendMessage(trx.chat, { text:
`❌ *TOP UP GAGAL*

Produk: ${trx.product_name}
ID Game: ${trx.customer_no}
Alasan: ${res.message || 'Gagal'}
Ref: ${trx.ref}`
          })
        }
      } catch {}
    }
  }, 15000)
}

handler.help = ['topuplist', 'topupff <no> <id>', 'topupml <no> <id>']
handler.tags = ['topup']
handler.command = /^(topuplist|topupff|topupml|topuppubg|topupgenshin|topupvalo|topuphsr|topupcodm|topupsb)$/i

module.exports = handler