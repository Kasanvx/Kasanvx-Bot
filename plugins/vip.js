// ────────── VIPayment Plugin | Bot WA Baileys ──────────
// Sistem saldo per user di db.saldo1

const axios = require('axios')

// =============================================
// KONFIGURASI
// =============================================
const API_ID  = 'bg2eCBJV'
const API_KEY = 'KZAdnU8gRhzc7ydIcYN4jrTZ5CiHbSarIQDi31oI2MCQ6NdtEQhwjr2R5iEqjatc'
const MARKUP  = 500 // markup harga per transaksi (Rp)
// =============================================

const URLS = {
  prepaid  : 'https://vip-reseller.co.id/api/prepaid',
  postpaid : 'https://vip-reseller.co.id/api/postpaid',
  game     : 'https://vip-reseller.co.id/api/game',
  sosmed   : 'https://vip-reseller.co.id/api/sosmed',
}

async function vip(url, body = {}) {
  try {
    const res = await axios.post(url, { key: API_ID, sign: API_KEY, ...body }, { timeout: 15000 })
    return res.data
  } catch (e) {
    return { result: false, message: e?.response?.data?.message || e.message }
  }
}

const rp = n => `Rp ${parseInt(n || 0).toLocaleString('id-ID')}`
const ST = { waiting:'🟡 Menunggu', process:'🔵 Diproses', success:'✅ Sukses', failed:'🔴 Gagal' }

// ─── Saldo User (db.saldo1) ──────────────────────────
function getSaldo(db, userId) {
  if (!db.data('saldo1')[userId]) db.data('saldo1')[userId] = 0
  return db.data('saldo1')[userId]
}

function setSaldo(db, userId, nominal) {
  db.data('saldo1')[userId] = nominal
  db.save('saldo1')
}

function tambahSaldo(db, userId, nominal) {
  const saldoLama = getSaldo(db, userId)
  setSaldo(db, userId, saldoLama + nominal)
  return getSaldo(db, userId)
}

function kurangSaldo(db, userId, nominal) {
  const saldoLama = getSaldo(db, userId)
  if (saldoLama < nominal) return false
  setSaldo(db, userId, saldoLama - nominal)
  return true
}

// ─── Kirim pesan ─────────────────────────────────────
function kirim(conn, m, txt) {
  conn.relayMessage(m.chat, {
    extendedTextMessage: {
      text: txt,
      contextInfo: {
        externalAdReply: {
          title: 'VIPayment Store',
          mediaType: 1, previewType: 0,
          renderLargerThumbnail: true,
          thumbnailUrl: 'https://telegra.ph/file/ec8cf04e3a2890d3dce9c.jpg',
        }
      },
      mentions: [m.sender]
    }
  }, {})
}

// ─── Handler ─────────────────────────────────────────
let handler = async (m, { conn, args, command, db }) => {
  const userId = m.sender
  const p = '.'

  // .vipmenu
  if (command === 'vipmenu') {
    kirim(conn, m,
`╔════════════════════════╗
║  🛍️ *V I P A Y M E N T*  ║
╚════════════════════════╝

💰 *SALDO*
┣ ${p}vipsaldo        — Cek saldo kamu
┗ ${p}viptopup <nom>  — Topup saldo

━━━━━━━━━━━━━━━━━━━━━━

📋 *CARI PRODUK*
┣ ${p}vipprepaid <kata>  — Pulsa, paket, PLN
┣ ${p}vippostpaid <kata> — Tagihan, BPJS
┣ ${p}vipgame <kata>     — Topup game
┗ ${p}vipsosmed <kata>   — Followers, views

━━━━━━━━━━━━━━━━━━━━━━

🛒 *ORDER*
┣ ${p}vipbeli <kode> <no>   — Beli prepaid/game
┣ ${p}vipcek <kode> <no>    — Cek tagihan
┗ ${p}vipbayar <kode> <no>  — Bayar tagihan

━━━━━━━━━━━━━━━━━━━━━━

📦 ${p}vipstatus <trxid>  — Cek status
_Powered by VIPayment_`)
  }

  // .vipsaldo — Cek saldo user dari db.saldo1
  else if (command === 'vipsaldo') {
    const saldo = getSaldo(db, userId)
    kirim(conn, m,
`💰 *SALDO KAMU*

👤 ${m.pushName || userId.split('@')[0]}
💵 *${rp(saldo)}*

━━━━━━━━━━━━━━━━━━━━━━
Topup: ${p}viptopup <nominal>
_VIPayment Store_`)
  }

  // .viptopup <nominal> — Tambah saldo manual (admin only)
  // Ganti logika ini dengan payment gateway kamu
  else if (command === 'viptopup') {
    // Contoh: hanya owner bot yang bisa topup manual
    // Ganti dengan integrasi payment gateway kamu
    const nominal = parseInt(args[0])
    if (isNaN(nominal) || nominal < 1000) return kirim(conn, m, `❌ Nominal tidak valid!\nMinimal topup: Rp 1.000`)

    // TODO: Integrasikan dengan payment gateway kamu di sini
    // Ini contoh topup manual oleh owner:
    const saldoBaru = tambahSaldo(db, userId, nominal)
    kirim(conn, m,
`✅ *TOPUP BERHASIL*

💵 Topup   : *${rp(nominal)}*
💰 Saldo   : *${rp(saldoBaru)}*

_VIPayment Store_`)
  }

  // .vipprepaid <keyword>
  else if (command === 'vipprepaid') {
    if (!args[0]) return kirim(conn, m, `❌ Contoh: ${p}vipprepaid telkomsel`)
    const keyword = args.join(' ').toLowerCase()
    kirim(conn, m, `🔍 Mencari: *${keyword}*...`)

    const d = await vip(URLS.prepaid, { type: 'services' })
    if (!d.result || !Array.isArray(d.data)) return kirim(conn, m, `❌ Gagal: ${d.message}`)

    const hasil = d.data
      .filter(x => `${x.brand} ${x.name} ${x.code} ${x.category}`.toLowerCase().includes(keyword))
      .filter(x => x.status === 'available')
      .slice(0, 8)

    if (!hasil.length) return kirim(conn, m, `❌ Tidak ditemukan: *${keyword}*`)

    const list = hasil.map((x, i) =>
      `${i+1}. *${x.name}*\n   Kode: \`${x.code}\` | ${rp((x.price?.basic || x.price) + MARKUP)}`
    ).join('\n\n')

    kirim(conn, m, `📋 *PREPAID: ${keyword}*\n${hasil.length} produk\n\n${list}\n\n💡 ${p}vipbeli <KODE> <nomor>`)
  }

  // .vippostpaid <keyword>
  else if (command === 'vippostpaid') {
    if (!args[0]) return kirim(conn, m, `❌ Contoh: ${p}vippostpaid pln`)
    const keyword = args.join(' ').toLowerCase()
    kirim(conn, m, `🔍 Mencari: *${keyword}*...`)

    const d = await vip(URLS.postpaid, { type: 'services' })
    if (!d.result || !Array.isArray(d.data)) return kirim(conn, m, `❌ Gagal: ${d.message}`)

    const hasil = d.data
      .filter(x => `${x.brand} ${x.name} ${x.code} ${x.category}`.toLowerCase().includes(keyword))
      .filter(x => x.status === 'available')
      .slice(0, 8)

    if (!hasil.length) return kirim(conn, m, `❌ Tidak ditemukan: *${keyword}*`)

    const list = hasil.map((x, i) =>
      `${i+1}. *${x.name}*\n   Kode: \`${x.code}\` | Admin: ${rp(x.price?.admin || 0)}`
    ).join('\n\n')

    kirim(conn, m, `📋 *POSTPAID: ${keyword}*\n${hasil.length} produk\n\n${list}\n\n💡 ${p}vipcek <KODE> <nomor>`)
  }

  // .vipgame <keyword>
  else if (command === 'vipgame') {
    if (!args[0]) return kirim(conn, m, `❌ Contoh: ${p}vipgame mobile legends`)
    const keyword = args.join(' ').toLowerCase()
    kirim(conn, m, `🎮 Mencari game: *${keyword}*...`)

    const d = await vip(URLS.game, { type: 'services' })
    if (!d.result || !Array.isArray(d.data)) return kirim(conn, m, `❌ Gagal: ${d.message}`)

    const hasil = d.data
      .filter(x => `${x.brand} ${x.name} ${x.code} ${x.category}`.toLowerCase().includes(keyword))
      .filter(x => x.status === 'available')
      .slice(0, 8)

    if (!hasil.length) return kirim(conn, m, `❌ Tidak ditemukan: *${keyword}*`)

    const list = hasil.map((x, i) =>
      `${i+1}. *${x.name}*\n   Kode: \`${x.code}\` | ${rp((x.price?.basic || x.price) + MARKUP)}`
    ).join('\n\n')

    kirim(conn, m, `🎮 *GAME: ${keyword}*\n${hasil.length} produk\n\n${list}\n\n💡 ${p}vipbeli <KODE> <id_game>`)
  }

  // .vipsosmed <keyword>
  else if (command === 'vipsosmed') {
    if (!args[0]) return kirim(conn, m, `❌ Contoh: ${p}vipsosmed instagram followers`)
    const keyword = args.join(' ').toLowerCase()
    kirim(conn, m, `📱 Mencari sosmed: *${keyword}*...`)

    const d = await vip(URLS.sosmed, { type: 'services' })
    if (!d.result || !Array.isArray(d.data)) return kirim(conn, m, `❌ Gagal: ${d.message}`)

    const hasil = d.data
      .filter(x => `${x.service} ${x.code} ${x.category} ${x.type}`.toLowerCase().includes(keyword))
      .filter(x => !x.status || x.status === 'active')
      .slice(0, 8)

    if (!hasil.length) return kirim(conn, m, `❌ Tidak ditemukan: *${keyword}*`)

    const list = hasil.map((x, i) =>
      `${i+1}. *${x.service}*\n   Kode: \`${x.code}\` | ${rp(x.price + MARKUP)} | Min: ${x.min_order || '-'}`
    ).join('\n\n')

    kirim(conn, m, `📱 *SOSMED: ${keyword}*\n${hasil.length} produk\n\n${list}\n\n💡 ${p}vipbeli <KODE> <link>`)
  }

  // .vipbeli <kode> <nomor> — Order & potong saldo user
  else if (command === 'vipbeli') {
    if (args.length < 2) return kirim(conn, m, `❌ Contoh: ${p}vipbeli TSEL5 08123456789`)

    const [kode, nomor] = args

    // Ambil harga produk dulu
    let harga = 0
    let urlTarget = URLS.prepaid
    for (const [nama, url] of Object.entries(URLS)) {
      if (nama === 'postpaid') continue
      const d = await vip(url, { type: 'services' })
      if (d.result && Array.isArray(d.data)) {
        const produk = d.data.find(x => x.code === kode)
        if (produk) {
          harga = parseInt(produk.price?.basic || produk.price || 0) + MARKUP
          urlTarget = url
          break
        }
      }
    }

    if (!harga) return kirim(conn, m, `❌ Produk *${kode}* tidak ditemukan.\nCari dulu dengan ${p}vipprepaid / ${p}vipgame`)

    // Cek saldo user
    const saldo = getSaldo(db, userId)
    if (saldo < harga) return kirim(conn, m,
`❌ *SALDO TIDAK CUKUP*

💵 Saldo kamu : *${rp(saldo)}*
💰 Harga      : *${rp(harga)}*
📉 Kurang     : *${rp(harga - saldo)}*

Topup dulu: ${p}viptopup <nominal>`)

    // Potong saldo user dulu
    kurangSaldo(db, userId, harga)
    kirim(conn, m, `🛒 Memproses...\n*${kode}* → *${nomor}*\nSaldo dipotong: *${rp(harga)}*`)

    // Hit API VIPayment
    const d = await vip(urlTarget, { type: 'order', code: kode, number: nomor, ref_id: `BOT-${Date.now()}` })

    // Kalau gagal, kembalikan saldo
    if (!d.result) {
      tambahSaldo(db, userId, harga)
      return kirim(conn, m, `❌ Transaksi gagal!\n${d.message}\n\n💰 Saldo dikembalikan: *${rp(harga)}*`)
    }

    const t = d.data
    // Kalau status failed, kembalikan saldo juga
    if (t.status === 'failed') {
      tambahSaldo(db, userId, harga)
    }

    kirim(conn, m,
`🛒 *TRANSAKSI*

📦 ${t.service || kode}
┣ Status : ${ST[t.status] || t.status}
┣ Nomor  : ${nomor}
┣ TRX ID : \`${t.trxid || '-'}\`
┣ SN     : ${t.sn || t.note || '-'}
┣ Harga  : ${rp(harga)}
┗ Saldo  : ${rp(getSaldo(db, userId))}

${t.status === 'failed' ? `❌ Gagal, saldo dikembalikan!` : ''}
${t.status !== 'success' && t.status !== 'failed' ? `⏳ Cek: ${p}vipstatus ${t.trxid}` : ''}
_VIPayment Store_`)
  }

  // .vipcek <kode> <nomor> — Cek tagihan postpaid
  else if (command === 'vipcek') {
    if (args.length < 2) return kirim(conn, m, `❌ Contoh: ${p}vipcek PLNPASCA 123456789`)
    const [kode, nomor] = args

    const d = await vip(URLS.postpaid, { type: 'inquiry', code: kode, number: nomor, ref_id: `BOT-${Date.now()}` })
    if (!d.result) return kirim(conn, m, `❌ Gagal: ${d.message}`)

    const t = d.data
    const total = parseInt(t.price?.total || t.price?.bill || 0) + MARKUP
    kirim(conn, m,
`🔍 *TAGIHAN*

📋 ${t.service || kode}
┣ Nama    : ${t.account?.name || '-'}
┣ Tagihan : ${rp(t.price?.bill || 0)}
┣ Admin   : ${rp(t.price?.admin || 0)}
┗ Total   : *${rp(total)}*

💡 Bayar: ${p}vipbayar ${kode} ${nomor}
_VIPayment Store_`)
  }

  // .vipbayar <kode> <nomor> — Bayar tagihan & potong saldo
  else if (command === 'vipbayar') {
    if (args.length < 2) return kirim(conn, m, `❌ Contoh: ${p}vipbayar PLNPASCA 123456789`)
    const [kode, nomor] = args

    // Inquiry dulu untuk dapat harga
    const inq = await vip(URLS.postpaid, { type: 'inquiry', code: kode, number: nomor, ref_id: `BOT-${Date.now()}` })
    if (!inq.result) return kirim(conn, m, `❌ Gagal cek tagihan: ${inq.message}`)

    const harga = parseInt(inq.data?.price?.total || inq.data?.price?.bill || 0) + MARKUP
    const saldo = getSaldo(db, userId)

    if (saldo < harga) return kirim(conn, m,
`❌ *SALDO TIDAK CUKUP*

💵 Saldo kamu : *${rp(saldo)}*
💰 Total      : *${rp(harga)}*
📉 Kurang     : *${rp(harga - saldo)}*

Topup dulu: ${p}viptopup <nominal>`)

    // Potong saldo
    kurangSaldo(db, userId, harga)
    kirim(conn, m, `💳 Memproses pembayaran...\nSaldo dipotong: *${rp(harga)}*`)

    // Bayar ke VIPayment
    const d = await vip(URLS.postpaid, { type: 'order', code: kode, number: nomor, ref_id: `BOT-${Date.now()}` })

    if (!d.result) {
      tambahSaldo(db, userId, harga)
      return kirim(conn, m, `❌ Pembayaran gagal!\n${d.message}\n\n💰 Saldo dikembalikan: *${rp(harga)}*`)
    }

    const t = d.data
    if (t.status === 'failed') tambahSaldo(db, userId, harga)

    kirim(conn, m,
`💳 *PEMBAYARAN*

📋 ${t.service || kode}
┣ Status  : ${ST[t.status] || t.status}
┣ Nomor   : ${nomor}
┣ TRX ID  : \`${t.trxid || '-'}\`
┣ Total   : ${rp(harga)}
┗ Saldo   : ${rp(getSaldo(db, userId))}

${t.status === 'failed' ? `❌ Gagal, saldo dikembalikan!` : ''}
${t.status !== 'success' && t.status !== 'failed' ? `⏳ Cek: ${p}vipstatus ${t.trxid}` : ''}
_VIPayment Store_`)
  }

  // .vipstatus <trxid>
  else if (command === 'vipstatus') {
    if (!args[0]) return kirim(conn, m, `❌ Contoh: ${p}vipstatus TRX123`)

    let d = await vip(URLS.prepaid, { type: 'status', trxid: args[0] })
    if (!d.result) d = await vip(URLS.postpaid, { type: 'status', trxid: args[0] })
    if (!d.result) d = await vip(URLS.game, { type: 'status', trxid: args[0] })
    if (!d.result) return kirim(conn, m, `❌ TRX tidak ditemukan: ${args[0]}`)

    const t = Array.isArray(d.data) ? d.data[0] : d.data
    kirim(conn, m,
`📦 *STATUS TRX*

ID     : \`${args[0]}\`
Produk : ${t.service || t.code || '-'}
Status : ${ST[t.status] || t.status}
SN     : ${t.sn || t.note || '-'}
Harga  : ${rp(t.price)}
_VIPayment Store_`)
  }

  else {
    kirim(conn, m, `Ketik *${p}vipmenu* untuk menu! 🛍️`)
  }
}

handler.help    = ['vipmenu','vipsaldo','viptopup','vipprepaid','vippostpaid','vipgame','vipsosmed','vipbeli','vipcek','vipbayar','vipstatus']
handler.tags    = ['store']
handler.command = /^(vipmenu|vipsaldo|viptopup|vipprepaid|vippostpaid|vipgame|vipsosmed|vipbeli|vipcek|vipbayar|vipstatus)$/i

module.exports = handler