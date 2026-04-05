// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const axios  = require('axios')
const md5    = require('md5')

const FM_KEY    = global.fmpediaKey  || 'nSTrUbPS5Czm1jdq5OE7ngwRvbnjiA7ahQFI9YvtklrM0ub6BxVjbFYj3f4BquRY'
const FM_USERID = global.fmpediaUser || 'U00001471'
const FM_URL    = 'https://fmpedia.id/api/prepaid'

const GROUP_WM = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

// ── Game config ──
const GAMES = {
  ml:      { label: 'Mobile Legends', icon: '⚔️',  keyword: 'MOBILE LEGENDS', field: 'ID + Server', hint: '<user_id> <server_id>' },
  ff:      { label: 'Free Fire',      icon: '🔥',  keyword: 'FREE FIRE',       field: 'ID FF',      hint: '<id_ff>' },
  pubg:    { label: 'PUBG Mobile',    icon: '🎯',  keyword: 'PUBG MOBILE',     field: 'ID PUBG',    hint: '<player_id>' },
  genshin: { label: 'Genshin Impact', icon: '⚡',  keyword: 'GENSHIN IMPACT',  field: 'UID + Server', hint: '<uid> <server_id>' },
}

function sign() { return md5(FM_USERID + FM_KEY) }
function rupiah(x) { return 'Rp' + Number(x || 0).toLocaleString('id-ID') }
function now() {
  return new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function statusEmoji(s) {
  const st = String(s || '').toLowerCase()
  if (st === 'success')  return '✅'
  if (st === 'waiting')  return '⏳'
  if (st === 'process')  return '🔄'
  if (st === 'failed')   return '❌'
  if (st === 'cancel')   return '🚫'
  return '❓'
}

async function apiCall(params) {
  const res = await axios.post(FM_URL, new URLSearchParams({
    key: FM_KEY, sign: sign(), ...params
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 20000
  })
  return res.data
}

// Cache produk
let _cache = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

async function getProducts() {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache
  const res = await apiCall({ type: 'service' })
  if (!res.status || !Array.isArray(res.data)) throw new Error('Gagal ambil produk')
  _cache = res.data
  _cacheTime = Date.now()
  return _cache
}

function getGameProducts(data, keyword) {
  return data
    .filter(v =>
      String(v.category?.main || '').toUpperCase() === keyword.toUpperCase() &&
      v.status === 'ready'
    )
    .sort((a, b) => (a.price?.current || 0) - (b.price?.current || 0))
}

function resetSesi(conn, jid) {
  conn.topupSesi = conn.topupSesi || {}
  delete conn.topupSesi[jid]
}

// ── Format menu game ──
function formatGameMenu() {
  return (
    `🎮 *TOPUP GAME*\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    Object.entries(GAMES).map(([key, g]) =>
      `${g.icon} *.topupgame ${key}*\n    ${g.label}`
    ).join('\n\n') +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `📋 Contoh:\n` +
    `*.topupgame ml* — lihat produk ML\n` +
    `*.topupgame ff* — lihat produk FF`
  )
}

// ── Format list produk game ──
function formatProdukList(game, products) {
  const g = GAMES[game]
  let txt = `${g.icon} *${g.label.toUpperCase()}*\n`
  txt += `━━━━━━━━━━━━━━━━━━\n\n`
  products.forEach((v, i) => {
    const cutoff = v.cutoff?.start && v.cutoff.start !== '00:00'
      ? ` ⏱️ ${v.cutoff.start}` : ''
    txt += `*${i + 1}.* ${v.name}\n`
    txt += `    💰 ${rupiah(v.price?.current)}${cutoff}\n`
  })
  txt += `\n━━━━━━━━━━━━━━━━━━\n`
  txt += `📌 Balas *nomor urut* + *${g.field}*\n`
  txt += `Contoh: *.topupgame ${game} 1 ${g.hint}*`
  return txt
}

// ── Handler utama ──
let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    conn.topupSesi = conn.topupSesi || {}

    const sub  = String(args[0] || '').toLowerCase()
    const arg1 = args[1] || ''
    const arg2 = args[2] || ''
    const arg3 = args[3] || ''

    // ── MAIN MENU ──
    if (!sub) return m.reply(formatGameMenu())

    // ── CEK GAME VALID ──
    if (!(sub in GAMES)) {
      return m.reply(
        `❌ Game tidak dikenali.\n\n` +
        `Game yang tersedia:\n` +
        Object.entries(GAMES).map(([k, g]) => `${g.icon} *.topupgame ${k}*`).join('\n')
      )
    }

    const game = GAMES[sub]

    // ── LIST PRODUK (tidak ada arg berikutnya) ──
    if (!arg1 || isNaN(arg1)) {
      await m.reply(`⏳ Mengambil produk ${game.label}...`)
      const data = await getProducts()
      const products = getGameProducts(data, game.keyword)
      if (!products.length) return m.reply(`❌ Produk ${game.label} tidak tersedia saat ini.`)

      // Simpan sesi produk
      conn.topupSesi[m.sender] = {
        stage: 'PILIH',
        game: sub,
        products,
        chat: m.chat,
        isGroup: m.isGroup,
        created: Date.now()
      }

      const msg = await m.reply(formatProdukList(sub, products))
      conn.topupSesi[m.sender].msgId = msg.key.id
      return
    }

    // ── ORDER LANGSUNG: .topupgame ml 1 123456 1234 ──
    const idx = parseInt(arg1) - 1
    if (!arg2) {
      return m.reply(
        `❌ Masukkan ${game.field}!\n\n` +
        `Format: *.topupgame ${sub} <nomor> ${game.hint}*`
      )
    }

    await m.reply(`⏳ Mengambil produk ${game.label}...`)
    const data = await getProducts()
    const products = getGameProducts(data, game.keyword)

    if (!products[idx]) {
      return m.reply(`❌ Nomor produk tidak valid.\nKetik *.topupgame ${sub}* untuk lihat daftar.`)
    }

    const produk  = products[idx]
    const target  = arg3 ? `${arg2}|${arg3}` : arg2
    const display = arg3 ? `${arg2} (Server: ${arg3})` : arg2

    // Konfirmasi
    const konfirmasi =
      `${game.icon} *KONFIRMASI TOPUP ${game.label.toUpperCase()}*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦 Produk  : *${produk.name}*\n` +
      `🎮 ${game.field} : *${display}*\n` +
      `💰 Harga   : ${rupiah(produk.price?.current)}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ Pastikan data sudah *benar!*\n\n` +
      `✅ Balas *ya* untuk lanjutkan\n` +
      `❌ Balas *tidak* untuk batal`

    const msg = await m.reply(konfirmasi)

    conn.topupSesi[m.sender] = {
      stage: 'KONFIRMASI',
      game:  sub,
      produk,
      target,
      display,
      chat:    m.chat,
      isGroup: m.isGroup,
      msgId:   msg.key.id,
      created: Date.now()
    }

  } catch (e) {
    console.error('topupgame error:', e)
    m.reply(failText('lagi error: ' + e.message))
  }
}

// ── Before handler (balas nomor / ya / tidak) ──
handler.before = async (m, { conn }) => {
  conn.topupSesi = conn.topupSesi || {}
  const sesi = conn.topupSesi[m.sender]
  if (!sesi) return
  if (!m.quoted || m.quoted.id !== sesi.msgId) return
  if (!m.text) return

  // Expired 3 menit
  if (Date.now() - sesi.created > 180000) {
    resetSesi(conn, m.sender)
    return m.reply('⏰ Sesi kadaluarsa. Ulangi dari awal.')
  }

  const teks = m.text.trim().toLowerCase()

  // ── Stage PILIH: user balas nomor urut ──
  if (sesi.stage === 'PILIH') {
    if (isNaN(teks)) return
    const idx = parseInt(teks) - 1
    const produk = sesi.products[idx]
    if (!produk) return m.reply(`❌ Nomor tidak valid. Pilih 1 - ${sesi.products.length}`)

    const game = GAMES[sesi.game]

    // Tanya ID
    const tanyaId =
      `${game.icon} *${produk.name}*\n` +
      `💰 ${rupiah(produk.price?.current)}\n\n` +
      `📝 Masukkan *${game.field}*:\n` +
      `_(format: ${game.hint})_`

    const msg = await m.reply(tanyaId)

    conn.topupSesi[m.sender] = {
      ...sesi,
      stage:  'INPUT_ID',
      produk,
      msgId:  msg.key.id,
      created: Date.now()
    }
    return
  }

  // ── Stage INPUT_ID: user masukkan ID game ──
  if (sesi.stage === 'INPUT_ID') {
    const game    = GAMES[sesi.game]
    const parts   = teks.split(/\s+/)
    const target  = parts.join('|')
    const display = parts.length > 1 ? `${parts[0]} (Server: ${parts[1]})` : parts[0]

    const konfirmasi =
      `${game.icon} *KONFIRMASI TOPUP ${game.label.toUpperCase()}*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦 Produk  : *${sesi.produk.name}*\n` +
      `🎮 ${game.field} : *${display}*\n` +
      `💰 Harga   : ${rupiah(sesi.produk.price?.current)}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ Pastikan data sudah *benar!*\n\n` +
      `✅ Balas *ya* untuk lanjutkan\n` +
      `❌ Balas *tidak* untuk batal`

    const msg = await m.reply(konfirmasi)

    conn.topupSesi[m.sender] = {
      ...sesi,
      stage:   'KONFIRMASI',
      target,
      display,
      msgId:   msg.key.id,
      created: Date.now()
    }
    return
  }

  // ── Stage KONFIRMASI: user balas ya/tidak ──
  if (sesi.stage === 'KONFIRMASI') {
    if (teks !== 'ya' && teks !== 'tidak') return

    if (teks === 'tidak') {
      resetSesi(conn, m.sender)
      return m.reply('❌ Topup dibatalkan.')
    }

    // Proses order
    const game   = GAMES[sesi.game]
    const produk = sesi.produk
    resetSesi(conn, m.sender)

    await m.reply(`⏳ Memproses topup *${produk.name}*...`)

    try {
      const ref_id = 'BOT' + Date.now()
      const res = await axios.post(FM_URL, new URLSearchParams({
        key:     FM_KEY,
        sign:    sign(),
        type:    'order',
        service: produk.code,
        data_no: sesi.target,
        ref_id
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 60000
      })

      const data = res.data

      // ── GAGAL ──
      if (!data.status || !data.data) {
        return conn.sendMessage(sesi.chat, {
          text:
            `❌ *TOPUP GAGAL*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `${game.icon} ${game.label}\n` +
            `📦 ${produk.name}\n` +
            `🎮 ${sesi.display}\n` +
            `⚠️ ${data?.message || 'Terjadi kesalahan'}\n` +
            `━━━━━━━━━━━━━━━━━━`
        }, { quoted: m })
      }

      // ── BERHASIL ──
      const d = data.data
      return conn.sendMessage(sesi.chat, {
        text:
          `━━━━━━━━━━━━━━━━━━\n` +
          `${game.icon} *STRUK TOPUP ${game.label.toUpperCase()}*\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `✅ *Order Berhasil!*\n\n` +
          `📦 *Produk*\n` +
          `    ${produk.name}\n\n` +
          `🎮 *${GAMES[sesi.game].field}*\n` +
          `    ${sesi.display}\n\n` +
          `💰 *Harga*\n` +
          `    ${rupiah(d.price || produk.price?.current)}\n\n` +
          `📌 *Status*\n` +
          `    ${statusEmoji(d.status)} ${d.status || 'waiting'}\n\n` +
          (d.voucher ? `🎟️ *Voucher*\n    ${d.voucher}\n\n` : ``) +
          `🆔 *Ref ID*\n` +
          `    ${d.ref_id || ref_id}\n\n` +
          `🕐 *Waktu*\n` +
          `    ${now()}\n` +
          `━━━━━━━━━━━━━━━━━━`
      }, { quoted: m })

    } catch (e) {
      return conn.sendMessage(sesi.chat, {
        text:
          `❌ *TOPUP GAGAL*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `${game.icon} ${game.label}\n` +
          `📦 ${produk.name}\n` +
          `⚠️ Server error\n` +
          `━━━━━━━━━━━━━━━━━━`
      }, { quoted: m })
    }
  }
}

handler.command  = /^(topupgame|tg)$/i
handler.tags     = ['store']
handler.help     = ['topupgame ml', 'topupgame ff', 'topupgame pubg', 'topupgame genshin']

module.exports = handler