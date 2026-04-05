//kasanvx

const axios = require('axios')

function getKey() { return global.rumahotp || '' }
function rupiah(x) { return 'Rp' + Number(x || 0).toLocaleString('id-ID') }
function now() { return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) }

function userData(id) {
  global.db.data.users[id] = global.db.data.users[id] || {}
  const u = global.db.data.users[id]
  if (typeof u.saldo !== 'number') u.saldo = 0
  return u
}

async function api(path, params) {
  const res = await axios.get('https://www.rumahotp.com/api' + path, {
    headers: { 'x-apikey': getKey(), Accept: 'application/json' },
    params: params || {},
    timeout: 30000
  })
  return res.data
}

// Cache produk FF
let ffCache = null
let ffCacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

async function getFFProducts() {
  if (ffCache && Date.now() - ffCacheTime < CACHE_TTL) return ffCache
  const res = await api('/v1/h2h/product')
  if (!res.success || !Array.isArray(res.data)) throw new Error('Gagal ambil produk')
  const list = res.data.filter(function(v) {
    const kode  = String(v.code || '').toUpperCase()
    const brand = String(v.brand || '').toLowerCase()
    return brand === 'freefire' || kode.startsWith('FF') || kode.startsWith('KFFBP')
  })
  ffCache = list
  ffCacheTime = Date.now()
  return list
}

function groupProducts(list) {
  const diamond = [], weekly = [], monthly = [], pass = []

  list.forEach(function(v) {
    const kode = String(v.code || '').toUpperCase()
    const nama = String(v.name || '').toLowerCase()
    if (kode.startsWith('FFM1') || nama.includes('mingguan'))                               weekly.push(v)
    else if (kode.startsWith('FFM2') || nama.includes('bulanan'))                           monthly.push(v)
    else if (kode.startsWith('FFLUP') || kode === 'KFFBP' || nama.includes('pass') || nama.includes('booyah')) pass.push(v)
    else if (nama.includes('diamond'))                                                       diamond.push(v)
  })

  diamond.sort(function(a, b) { return a.price - b.price })
  return { diamond, weekly, monthly, pass }
}

// ── Format baris produk ───────────────────────────────────
function fmtItem(i, v) {
  const disc = v.price_info && v.price_info.price_discount_percent > 0
    ? ' 🏷️ -' + v.price_info.price_discount_percent + '%' : ''
  return '  ' + i + '. ' + v.name + '\n      💰 ' + rupiah(v.price) + disc + '\n'
}

// ── Format menu per kategori ─────────────────────────────
function formatMenu(list, kategori) {
  const g   = groupProducts(list)
  const sep = '━━━━━━━━━━━━━━━━━━'
  let txt   = '🔥 *TOPUP FREE FIRE*\n' + sep + '\n\n'
  let nomor = 1

  // tentukan pool & label berdasarkan kategori
  let pool = [], emoji = '', label = ''
  if (kategori === 'diamond') { pool = g.diamond; emoji = '💎'; label = 'Diamond' }
  else if (kategori === 'weekly' || kategori === 'mingguan') { pool = g.weekly; emoji = '📅'; label = 'Mingguan' }
  else if (kategori === 'monthly' || kategori === 'bulanan') { pool = g.monthly; emoji = '🗓️'; label = 'Bulanan' }
  else if (kategori === 'pass') { pool = g.pass; emoji = '🎫'; label = 'Pass & Lainnya' }

  if (!pool.length) {
    return txt + '❌ Produk untuk kategori ini tidak tersedia saat ini.\n'
  }

  txt += emoji + ' *' + label + '*\n'
  pool.forEach(function(v) { txt += fmtItem(nomor++, v) })
  txt += '\n'

  txt += sep + '\n'
  txt += '📌 *Cara Topup:*\n'
  txt += '.ff ' + kategori + ' <nomor> <ID FF>\n'
  txt += '.ff ' + kategori + ' <nomor> <ID FF> <server>\n\n'
  txt += '📋 Contoh:\n'
  txt += '.ff ' + kategori + ' 1 123456789\n'
  txt += '.ff ' + kategori + ' 1 123456789 1234'
  return txt
}

// ── Cari produk berdasarkan kategori + nomor urut ─────────
function findProduct(list, input, katInput) {
  const g = groupProducts(list)

  // kalau ada kategori spesifik
  if (katInput) {
    const kat = katInput.toLowerCase()
    let pool = []
    if (kat === 'diamond')                          pool = g.diamond
    else if (kat === 'weekly' || kat === 'mingguan') pool = g.weekly
    else if (kat === 'monthly' || kat === 'bulanan') pool = g.monthly
    else if (kat === 'pass')                         pool = g.pass

    if (!isNaN(input) && parseInt(input) > 0) return pool[parseInt(input) - 1] || null
    return pool.find(v => String(v.code || '').toUpperCase() === input.toUpperCase()) || null
  }

  // nomor urut global (lintas kategori, sesuai urutan di menu)
  if (!isNaN(input) && parseInt(input) > 0) {
    const all = [...g.diamond, ...g.weekly, ...g.monthly, ...g.pass]
    // tapi di menu utama, diamond dibatasi 10 — sisanya bisa diakses via /ff diamond <nomor>
    // supaya konsisten, nomor urut global mengikuti urutan menu lengkap
    return all[parseInt(input) - 1] || null
  }

  // kode langsung
  return list.find(v => String(v.code || '').toUpperCase() === input.toUpperCase()) || null
}

function resetSesi(conn, jid) {
  conn.ffSession = conn.ffSession || {}
  delete conn.ffSession[jid]
}

const KATEGORI_ALIAS = ['diamond', 'weekly', 'mingguan', 'monthly', 'bulanan', 'pass', 'semua', 'all']

// ══════════════════════════════════════════
// HANDLER UTAMA
// ══════════════════════════════════════════

const handler = async function(m, opts) {
  const conn = opts.conn, args = opts.args
  const usedPrefix = opts.usedPrefix, command = opts.command
  conn.ffSession = conn.ffSession || {}

  if (!getKey()) return m.reply('❌ API RumahOTP belum diset.')

  const a0 = String(args[0] || '').toLowerCase()
  const a1 = String(args[1] || '')
  const a2 = String(args[2] || '')
  const a3 = String(args[3] || '')

  // ── /ff  atau  /ff list → coming soon ──────────────────────
  if (!a0 || a0 === 'list' || a0 === 'menu') {
    return m.reply(
      '🔥 *TOPUP FREE FIRE*\n' +
      '━━━━━━━━━━━━━━━━━━\n\n' +
      '🔧 *Fitur segera hadir!*\n\n' +
      'Topup FF via bot sedang dalam tahap pengembangan.\n\n' +
      '📢 Pantau update di sini:\nhttps://chat.whatsapp.com/FDjn5WA234v8J6jMcb0zei'
    )
  }

  // ── /ff status <id> ───────────────────────────────────────
  if (a0 === 'status') {
    if (!a1) return m.reply('Format: ' + usedPrefix + command + ' status <id_transaksi>')
    try {
      const res = await api('/v1/h2h/transaksi/status', { transaction_id: a1 })
      if (!res.success || !res.data) return m.reply('❌ Transaksi tidak ditemukan.')
      const d = res.data
      const ico = d.status === 'success' ? '✅' : d.status === 'failed' ? '❌' : '⏳'
      return m.reply(
        '╭─── 📋 *CEK TRANSAKSI* ───\n' +
        '│ ID      : ' + (d.transaction_id || a1) + '\n' +
        '│ Produk  : ' + (d.product_name || '-') + '\n' +
        '│ ID FF   : ' + (d.target || '-') + '\n' +
        '│ Status  : ' + ico + ' ' + (d.status || '-') + '\n' +
        (d.sn ? '│ SN      : ' + d.sn + '\n' : '') +
        '╰──────────────────────'
      )
    } catch (e) {
      return m.reply('❌ Gagal cek transaksi.')
    }
  }

  // ── /ff <kategori>  → tampil list kategori ────────────────
  if (KATEGORI_ALIAS.includes(a0) && !a1) {
    try {
      const list = await getFFProducts()
      const kat  = a0 === 'all' ? 'semua' : a0
      return m.reply(formatMenu(list, kat))
    } catch (e) {
      return m.reply('❌ Gagal ambil produk.')
    }
  }

  // ── Parse topup ───────────────────────────────────────────
  // Format 1: /ff <nomor> <id_ff> [server]
  // Format 2: /ff <kategori> <nomor> <id_ff> [server]

  let katInput = null, nomorInput = '', userId = '', server = ''

  if (KATEGORI_ALIAS.includes(a0) && a1) {
    // Format 2: /ff diamond 2 123456789 [1234]
    katInput   = a0
    nomorInput = a1
    userId     = a2
    server     = a3
  } else {
    // Format 1: /ff 2 123456789 [1234]
    nomorInput = a0
    userId     = a1
    server     = a2
  }

  if (!userId) {
    return m.reply(
      '⚠️ *ID Free Fire tidak boleh kosong!*\n\n' +
      'Format:\n' +
      usedPrefix + command + ' <nomor> <ID FF>\n' +
      usedPrefix + command + ' <kategori> <nomor> <ID FF>\n\n' +
      'Contoh:\n' +
      usedPrefix + command + ' 1 123456789\n' +
      usedPrefix + command + ' diamond 2 123456789\n\n' +
      'Lihat daftar: *' + usedPrefix + command + '*'
    )
  }

  try {
    const list   = await getFFProducts()
    const produk = findProduct(list, nomorInput, katInput)

    if (!produk) {
      return m.reply(
        '❌ Produk tidak ditemukan.\n\n' +
        'Lihat daftar: *' + usedPrefix + command + '*\n' +
        'Atau per kategori: *' + usedPrefix + command + ' diamond*'
      )
    }

    const user = userData(m.sender)

    if (user.saldo < produk.price) {
      return m.reply(
        '❌ *Saldo tidak cukup*\n\n' +
        'Produk : *' + produk.name + '*\n' +
        'Harga  : ' + rupiah(produk.price) + '\n' +
        'Saldo  : ' + rupiah(user.saldo) + '\n' +
        'Kurang : *' + rupiah(produk.price - user.saldo) + '*\n\n' +
        '💳 Top up: *.nokos deposit <nominal>*'
      )
    }

    const target = server ? userId + '|' + server : userId
    const txt =
      '╭─── 🔥 *KONFIRMASI TOPUP FF* ───\n│\n' +
      '│ Produk : *' + produk.name + '*\n' +
      '│ ID FF  : *' + userId + '*\n' +
      (server ? '│ Server : *' + server + '*\n' : '') +
      '│ Harga  : ' + rupiah(produk.price) + '\n' +
      '│ Saldo  : ' + rupiah(user.saldo) + '\n│\n' +
      '│ ⚠️ Pastikan ID FF *benar*!\n' +
      '│ Topup salah tidak bisa direfund.\n│\n' +
      '│ Balas pesan ini:\n' +
      '│ *ya* — lanjutkan\n' +
      '│ *tidak* — batal\n' +
      '╰──────────────────────'

    const msg = await m.reply(txt)
    conn.ffSession[m.sender] = {
      id: msg.key.id,
      target, userId, server,
      produk,
      chat: m.chat,
      isGroup: m.isGroup,
      created: Date.now()
    }

  } catch (e) {
    return m.reply('❌ Terjadi kesalahan. Coba lagi.')
  }
}

// ══════════════════════════════════════════
// BEFORE HANDLER (konfirmasi ya/tidak)
// ══════════════════════════════════════════

handler.before = async function(m, opts) {
  const conn = opts.conn
  conn.ffSession = conn.ffSession || {}

  const session = conn.ffSession[m.sender]
  if (!session) return
  if (!m.quoted || m.quoted.id !== session.id) return
  if (!m.text) return

  const jawaban = String(m.text).trim().toLowerCase()
  if (jawaban !== 'ya' && jawaban !== 'tidak') return

  if (Date.now() - Number(session.created || 0) > 120000) {
    resetSesi(conn, m.sender)
    return m.reply('⏰ Konfirmasi kadaluarsa. Ulangi dari awal.')
  }

  if (jawaban === 'tidak') {
    resetSesi(conn, m.sender)
    return m.reply('❌ Topup dibatalkan.')
  }

  const user   = userData(m.sender)
  const produk = session.produk

  if (user.saldo < produk.price) {
    resetSesi(conn, m.sender)
    return m.reply('❌ Saldo tidak cukup.')
  }

  resetSesi(conn, m.sender)
  return m.reply(
    '🔧 *FITUR SEGERA HADIR!*\n\n' +
    'Topup FF via bot sedang dalam tahap pengembangan.\n' +
    'Pantau terus updatenya ya! 🔥'
  )

  user.saldo -= produk.price
  await m.reply('⏳ Sedang memproses topup...')

  try {
    const res = await axios.get('https://www.rumahotp.com/api/v1/h2h/transaksi/create', {
      headers: { 'x-apikey': getKey(), Accept: 'application/json' },
      params: { id: produk.code, target: session.target },
      timeout: 60000
    })

    const data = res.data

    // ── GAGAL ─────────────────────────────────────────────
    if (!data.success || !data.data) {
      user.saldo += produk.price
      await conn.sendMessage(session.chat, {
        text:
          '╭─── ❌ *TOPUP GAGAL* ───\n│\n' +
          '│ Produk : ' + produk.name + '\n' +
          '│ ID FF  : ' + session.userId + '\n' +
          (session.server ? '│ Server : ' + session.server + '\n' : '') +
          '│ Alasan : ' + ((data && data.error && data.error.message) || 'Terjadi kesalahan') + '\n│\n' +
          '│ 💰 Saldo ' + rupiah(produk.price) + ' dikembalikan\n' +
          '│ Saldo  : ' + rupiah(user.saldo) + '\n' +
          '╰──────────────────────'
      }, { quoted: m })
      if (session.isGroup) {
        await conn.sendMessage(session.chat, {
          text: '⚠️ @' + m.sender.split('@')[0] + ' topup *' + produk.name + '* ke ID *' + session.userId + '* gagal. Saldo dikembalikan.',
          mentions: [m.sender]
        })
      }
      return
    }

    // ── BERHASIL ──────────────────────────────────────────
    const d = data.data
    const struk =
      '╭────────────────────────\n' +
      '│   🔥 *STRUK TOPUP FF*\n' +
      '├────────────────────────\n' +
      '│ ✅ Topup Berhasil!\n│\n' +
      '│ 📦 Produk\n│    ' + produk.name + '\n│\n' +
      '│ 👤 ID Free Fire\n│    ' + session.userId + '\n' +
      (session.server ? '│ 🌐 Server  : ' + session.server + '\n' : '') +
      '│\n│ 💳 Pembayaran\n│    ' + rupiah(produk.price) + '\n│\n' +
      '│ 💰 Sisa Saldo\n│    ' + rupiah(user.saldo) + '\n│\n' +
      (d.sn ? '│ 🔖 SN      : ' + d.sn + '\n│\n' : '') +
      '│ 🕐 Waktu\n│    ' + now() + '\n│\n' +
      '│ 🧾 ID Transaksi\n│    ' + (d.transaction_id || '-') + '\n' +
      '╰────────────────────────'

    await conn.sendMessage(session.chat, { text: struk }, { quoted: m })

    if (session.isGroup) {
      await conn.sendMessage(session.chat, {
        text:
          '🔥 *TOPUP FF BERHASIL!*\n\n' +
          '👤 @' + m.sender.split('@')[0] + '\n' +
          '💎 ' + produk.name + '\n' +
          '🎮 ID: ' + session.userId + '\n\n' +
          'Mau topup juga? Ketik *.ff*',
        mentions: [m.sender]
      })
    }

  } catch (e) {
    user.saldo += produk.price
    await conn.sendMessage(session.chat, {
      text:
        '╭─── ❌ *TOPUP GAGAL* ───\n│\n' +
        '│ Produk : ' + produk.name + '\n' +
        '│ ID FF  : ' + session.userId + '\n' +
        '│ Alasan : Server error\n│\n' +
        '│ 💰 Saldo ' + rupiah(produk.price) + ' dikembalikan\n' +
        '│ Saldo  : ' + rupiah(user.saldo) + '\n' +
        '╰──────────────────────'
    }, { quoted: m })
    if (session.isGroup) {
      await conn.sendMessage(session.chat, {
        text: '⚠️ @' + m.sender.split('@')[0] + ' topup *' + produk.name + '* gagal (server error). Saldo dikembalikan.',
        mentions: [m.sender]
      })
    }
  }
}

handler.help = ['ff [kategori] <nomor> <id_ff> [server]']
handler.tags = ['store']
handler.command = /^(ff|freefire)$/i
module.exports = handler