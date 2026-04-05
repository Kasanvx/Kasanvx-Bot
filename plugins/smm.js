// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const axios = require('axios')
const md5   = require('md5')

const GROUP_WM  = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'
const VIP_KEY   = global.vipKey  || 'KZAdnU8gRhzc7ydIcYN4jrTZ5CiHbSarIQDi31oI2MCQ6NdtEQhwjr2R5iEqjatc'
const VIP_ID    = global.vipId   || 'bg2eCBJV'
const VIP_URL   = 'https://vip-reseller.co.id/api/social-media'

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

function sign()     { return md5(VIP_ID + VIP_KEY) }
function rupiah(x)  { return 'Rp' + Number(x || 0).toLocaleString('id-ID') }
function now() {
  return new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function statusEmoji(s) {
  const st = String(s || '').toLowerCase()
  if (st === 'success')    return '✅'
  if (st === 'waiting')    return '⏳'
  if (st === 'processing') return '🔄'
  if (st === 'error')      return '❌'
  if (st === 'cancel')     return '🚫'
  return '❓'
}

// ── Platform config ──
const PLATFORMS = {
  ig:  { label: 'Instagram', icon: '📸', keywords: ['instagram'] },
  tt:  { label: 'TikTok',    icon: '🎵', keywords: ['tiktok', 'tiktok'] },
  yt:  { label: 'YouTube',   icon: '▶️', keywords: ['youtube'] },
}

// ── Cache ──
let _cache = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

async function apiCall(params) {
  const res = await axios.post(VIP_URL, new URLSearchParams({
    key: VIP_KEY, sign: sign(), ...params
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 20000
  })
  return res.data
}

async function getServices() {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache
  const res = await apiCall({ type: 'services' })
  if (!res.result || !Array.isArray(res.data)) throw new Error('Gagal ambil layanan')
  _cache = res.data
  _cacheTime = Date.now()
  return _cache
}

function filterByPlatform(data, platform) {
  const kws = PLATFORMS[platform].keywords
  return data.filter(v =>
    v.status === 'available' &&
    kws.some(kw => String(v.category || '').toLowerCase().includes(kw))
  )
}

function groupByCategory(items) {
  const groups = {}
  items.forEach(v => {
    groups[v.category] = groups[v.category] || []
    groups[v.category].push(v)
  })
  return groups
}

function resetSesi(conn, jid) {
  conn.smmSesi = conn.smmSesi || {}
  delete conn.smmSesi[jid]
}

// ── Format main menu ──
function formatMainMenu() {
  return (
    `🚀 *SOCIAL MEDIA BOOSTER*\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    Object.entries(PLATFORMS).map(([key, p]) =>
      `${p.icon} *.smm ${key}* — ${p.label}`
    ).join('\n') +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `📋 Contoh:\n` +
    `*.smm ig* — layanan Instagram\n` +
    `*.smm tt* — layanan TikTok\n` +
    `*.smm yt* — layanan YouTube`
  )
}

// ── Format kategori list ──
function formatKategoriList(platform, groups) {
  const p = PLATFORMS[platform]
  const cats = Object.keys(groups)

  let txt = `${p.icon} *${p.label.toUpperCase()}*\n`
  txt += `━━━━━━━━━━━━━━━━━━\n\n`
  txt += `📂 *Pilih Kategori:*\n\n`
  cats.forEach((cat, i) => {
    txt += `*${i + 1}.* ${cat}\n`
    txt += `    _(${groups[cat].length} layanan)_\n`
  })
  txt += `\n━━━━━━━━━━━━━━━━━━\n`
  txt += `Balas nomor kategori`
  return txt
}

// ── Format layanan list ──
function formatLayananList(platform, category, items) {
  const p = PLATFORMS[platform]
  let txt = `${p.icon} *${category}*\n`
  txt += `━━━━━━━━━━━━━━━━━━\n\n`
  items.forEach((v, i) => {
    txt += `*${i + 1}.* ${v.name}\n`
    txt += `    💰 ${rupiah(v.price?.basic)} | Min: ${v.min} | Max: ${Number(v.max).toLocaleString('id-ID')}\n`
    if (v.note && v.note !== v.name) {
      txt += `    📝 ${String(v.note).slice(0, 80)}\n`
    }
    txt += `\n`
  })
  txt += `━━━━━━━━━━━━━━━━━━\n`
  txt += `Balas nomor layanan`
  return txt
}

// ── Handler utama ──
let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    conn.smmSesi = conn.smmSesi || {}

    const sub = String(args[0] || '').toLowerCase()

    // ── MAIN MENU ──
    if (!sub) return m.reply(formatMainMenu())

    // ── CEK STATUS ──
    if (sub === 'status') {
      const trxid = args[1] || ''
      if (!trxid) return m.reply(`Format: *.smm status <trxid>*`)

      await m.reply(`⏳ Mengecek status...`)
      const res = await apiCall({ type: 'status', trxid })
      if (!res.result || !res.data) return m.reply(failText('gagal cek status'))

      const list = Array.isArray(res.data) ? res.data : [res.data]
      const txt = list.map(d =>
        `${statusEmoji(d.status)} *${d.trxid}*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📦 Layanan : ${d.service}\n` +
        `🎯 Target  : ${d.data}\n` +
        `📊 Qty     : ${Number(d.quantity).toLocaleString('id-ID')}\n` +
        `📌 Status  : ${statusEmoji(d.status)} ${d.status}\n` +
        (d.remain ? `⏳ Sisa    : ${d.remain}\n` : ``) +
        (d.note   ? `📝 Note    : ${d.note}\n`   : ``) +
        `💰 Harga   : ${rupiah(d.price)}`
      ).join('\n\n')

      return m.reply(`🔍 *STATUS TRANSAKSI*\n━━━━━━━━━━━━━━━━━━\n\n${txt}`)
    }

    // ── CEK PLATFORM VALID ──
    if (!(sub in PLATFORMS)) {
      return m.reply(
        `❌ Platform tidak dikenali.\n\n` +
        Object.entries(PLATFORMS).map(([k, p]) => `${p.icon} *.smm ${k}*`).join('\n')
      )
    }

    // ── LOAD LAYANAN ──
    await m.reply(`⏳ Mengambil layanan ${PLATFORMS[sub].label}...`)
    const data     = await getServices()
    const filtered = filterByPlatform(data, sub)

    if (!filtered.length) return m.reply(`❌ Layanan ${PLATFORMS[sub].label} tidak tersedia.`)

    const groups = groupByCategory(filtered)
    const cats   = Object.keys(groups)

    const msg = await m.reply(formatKategoriList(sub, groups))

    conn.smmSesi[m.sender] = {
      stage:    'KATEGORI',
      platform: sub,
      groups,
      cats,
      chat:     m.chat,
      isGroup:  m.isGroup,
      msgId:    msg.key.id,
      created:  Date.now()
    }

  } catch (e) {
    console.error('smm error:', e)
    m.reply(failText('lagi error: ' + e.message))
  }
}

// ── Before handler ──
handler.before = async (m, { conn }) => {
  conn.smmSesi = conn.smmSesi || {}
  const sesi = conn.smmSesi[m.sender]
  if (!sesi) return
  if (!m.quoted || m.quoted.id !== sesi.msgId) return
  if (!m.text) return

  // Expired 3 menit
  if (Date.now() - sesi.created > 180000) {
    resetSesi(conn, m.sender)
    return m.reply('⏰ Sesi kadaluarsa. Ulangi dari awal.')
  }

  const teks = m.text.trim().toLowerCase()

  // ── PILIH KATEGORI ──
  if (sesi.stage === 'KATEGORI') {
    if (isNaN(teks)) return
    const idx = parseInt(teks) - 1
    const cat = sesi.cats[idx]
    if (!cat) return m.reply(`❌ Nomor tidak valid. Pilih 1 - ${sesi.cats.length}`)

    const items = sesi.groups[cat]
    const msg   = await m.reply(formatLayananList(sesi.platform, cat, items))

    conn.smmSesi[m.sender] = {
      ...sesi,
      stage:   'LAYANAN',
      category: cat,
      items,
      msgId:   msg.key.id,
      created: Date.now()
    }
    return
  }

  // ── PILIH LAYANAN ──
  if (sesi.stage === 'LAYANAN') {
    if (isNaN(teks)) return
    const idx   = parseInt(teks) - 1
    const item  = sesi.items[idx]
    if (!item) return m.reply(`❌ Nomor tidak valid. Pilih 1 - ${sesi.items.length}`)

    const p = PLATFORMS[sesi.platform]
    const tanyaTarget =
      `${p.icon} *${item.name}*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💰 Harga : ${rupiah(item.price?.basic)}\n` +
      `📊 Min   : ${item.min} | Max: ${Number(item.max).toLocaleString('id-ID')}\n\n` +
      `📝 Masukkan *jumlah* dan *link/username* target:\n` +
      `_(format: <jumlah> <url/username>)_\n\n` +
      `Contoh:\n` +
      `_100 https://instagram.com/username_`

    const msg = await m.reply(tanyaTarget)

    conn.smmSesi[m.sender] = {
      ...sesi,
      stage:   'INPUT',
      item,
      msgId:   msg.key.id,
      created: Date.now()
    }
    return
  }

  // ── INPUT QTY + TARGET ──
  if (sesi.stage === 'INPUT') {
    const parts  = m.text.trim().split(/\s+/)
    const qty    = parseInt(parts[0])
    const target = parts.slice(1).join(' ')

    if (isNaN(qty) || !target) {
      return m.reply(`❌ Format salah!\nContoh: _100 https://instagram.com/username_`)
    }

    const item = sesi.item
    const p    = PLATFORMS[sesi.platform]

    if (qty < item.min || qty > item.max) {
      return m.reply(
        `❌ Jumlah tidak valid!\n` +
        `Min: *${item.min}* | Max: *${Number(item.max).toLocaleString('id-ID')}*`
      )
    }

    const konfirmasi =
      `${p.icon} *KONFIRMASI ORDER SMM*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦 Layanan : ${item.name}\n` +
      `🎯 Target  : ${target}\n` +
      `📊 Jumlah  : ${qty.toLocaleString('id-ID')}\n` +
      `💰 Harga   : ${rupiah(item.price?.basic)}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ Pastikan data sudah *benar!*\n\n` +
      `✅ Balas *ya* untuk lanjutkan\n` +
      `❌ Balas *tidak* untuk batal`

    const msg = await m.reply(konfirmasi)

    conn.smmSesi[m.sender] = {
      ...sesi,
      stage:   'KONFIRMASI',
      qty,
      target,
      msgId:   msg.key.id,
      created: Date.now()
    }
    return
  }

  // ── KONFIRMASI ──
  if (sesi.stage === 'KONFIRMASI') {
    if (teks !== 'ya' && teks !== 'tidak') return

    if (teks === 'tidak') {
      resetSesi(conn, m.sender)
      return m.reply('❌ Order dibatalkan.')
    }

    const item = sesi.item
    const p    = PLATFORMS[sesi.platform]
    resetSesi(conn, m.sender)

    await m.reply('⏳ Memproses order...')

    try {
      const res = await apiCall({
        type:     'order',
        service:  item.id,
        quantity: sesi.qty,
        data:     sesi.target
      })

      if (!res.result || !res.data) {
        return conn.sendMessage(sesi.chat, {
          text:
            `❌ *ORDER GAGAL*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `${p.icon} ${item.name}\n` +
            `⚠️ ${res.message || 'Terjadi kesalahan'}\n` +
            `━━━━━━━━━━━━━━━━━━`
        }, { quoted: m })
      }

      const d = res.data
      return conn.sendMessage(sesi.chat, {
        text:
          `━━━━━━━━━━━━━━━━━━\n` +
          `${p.icon} *STRUK ORDER SMM*\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `✅ *Order Berhasil!*\n\n` +
          `📦 *Layanan*\n    ${d.service || item.name}\n\n` +
          `🎯 *Target*\n    ${d.data || sesi.target}\n\n` +
          `📊 *Jumlah*\n    ${Number(d.quantity || sesi.qty).toLocaleString('id-ID')}\n\n` +
          `💰 *Harga*\n    ${rupiah(d.price || item.price?.basic)}\n\n` +
          `📌 *Status*\n    ${statusEmoji(d.status)} ${d.status || 'waiting'}\n\n` +
          `🆔 *Trx ID*\n    ${d.trxid || '-'}\n\n` +
          `🕐 *Waktu*\n    ${now()}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `Cek status: *.smm status ${d.trxid}*`
      }, { quoted: m })

    } catch (e) {
      return conn.sendMessage(sesi.chat, {
        text:
          `❌ *ORDER GAGAL*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `${p.icon} ${item.name}\n` +
          `⚠️ Server error\n` +
          `━━━━━━━━━━━━━━━━━━`
      }, { quoted: m })
    }
  }
}

handler.command = /^(smm|sosmed)$/i
handler.tags    = ['store']
handler.help    = ['smm ig', 'smm tt', 'smm yt', 'smm status <trxid>']

module.exports = handler