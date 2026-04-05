// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const GROUP_WM = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'
const axios    = require('axios')
const md5      = require('md5')

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

// ── Config — isi sesuai akun fmpedia kamu ──
const FM_KEY    = global.fmpediaKey  || 'nSTrUbPS5Czm1jdq5OE7ngwRvbnjiA7ahQFI9YvtklrM0ub6BxVjbFYj3f4BquRY'
const FM_USERID = global.fmpediaUser || 'U00001471'
const FM_URL    = 'https://fmpedia.id/api/prepaid'

function sign() {
  return md5(FM_USERID + FM_KEY)
}

function rupiah(x) {
  return 'Rp' + Number(x || 0).toLocaleString('id-ID')
}

function formatDate(ts) {
  return new Date(Number(ts) * 1000).toLocaleString('id-ID', {
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

// ── API calls ──
async function apiCall(params) {
  const res = await axios.post(FM_URL, new URLSearchParams({
    key:  FM_KEY,
    sign: sign(),
    ...params
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 20000
  })
  return res.data
}

async function getServices() {
  return apiCall({ type: 'service' })
}

async function placeOrder(service, data_no) {
  const ref_id = 'BOT' + Date.now()
  return apiCall({ type: 'order', service, data_no, ref_id })
}

async function checkStatus(ref_id) {
  return apiCall({ type: 'status', ref_id })
}

// ── Format list layanan ──
function formatServiceList(data, keyword = '') {
  const filtered = keyword
    ? data.filter(v =>
        String(v.name || '').toLowerCase().includes(keyword.toLowerCase()) ||
        String(v.category?.main || '').toLowerCase().includes(keyword.toLowerCase()) ||
        String(v.category?.type || '').toLowerCase().includes(keyword.toLowerCase()) ||
        String(v.code || '').toLowerCase().includes(keyword.toLowerCase())
      )
    : data

  if (!filtered.length) return null

  // Grup per kategori main
  const groups = {}
  filtered.forEach(v => {
    const key = v.category?.main || 'Lainnya'
    groups[key] = groups[key] || []
    groups[key].push(v)
  })

  let txt = keyword
    ? `🔍 *Hasil pencarian: "${keyword}"*\n━━━━━━━━━━━━━━━━━━\n\n`
    : `📋 *DAFTAR LAYANAN PPOB*\n━━━━━━━━━━━━━━━━━━\n\n`

  for (const [brand, items] of Object.entries(groups)) {
    txt += `📌 *${brand}*\n`
    items.forEach(v => {
      const ready = v.status === 'ready' ? '✅' : '❌'
      const cutoff = v.cutoff?.start && v.cutoff.start !== '00:00' ? ` ⏱️ ${v.cutoff.start}-${v.cutoff.end}` : ''
      txt += `  ${ready} \`${v.code}\` — ${v.name}\n`
      txt += `       💰 ${rupiah(v.price?.current)}${cutoff}\n`
    })
    txt += `\n`
  }

  txt += `━━━━━━━━━━━━━━━━━━\n`
  txt += `📌 Cari spesifik: *.ppob list <keyword>*\n`
  txt += `📦 Order: *.ppob order <kode> <nomor>*`
  return txt
}

// ── Format struk order ──
function formatOrder(d) {
  return `🧾 *STRUK ORDER PPOB*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📦 *Produk*\n` +
    `    ${d.product?.service || '-'}\n\n` +
    `📞 *Tujuan*\n` +
    `    ${Array.isArray(d.data) ? d.data.join(', ') : d.data || '-'}\n\n` +
    `💰 *Harga*\n` +
    `    ${rupiah(d.price)}\n\n` +
    `🆔 *Ref ID*\n` +
    `    ${d.ref_id || '-'}\n\n` +
    `📌 *Status*\n` +
    `    ${statusEmoji(d.status)} ${d.status || '-'}\n\n` +
    (d.voucher ? `🎟️ *Voucher*\n    ${d.voucher}\n\n` : ``) +
    (d.note ? `📝 *Catatan*\n    ${d.note}\n\n` : ``) +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Cek status: *.ppob status ${d.ref_id}*`
}

// ── Format cek status ──
function formatStatus(list) {
  if (!list.length) return `❌ Transaksi tidak ditemukan.`

  return list.map(d =>
    `${statusEmoji(d.status)} *${d.ref_id || '-'}*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📦 Produk  : ${d.product?.service || '-'}\n` +
    `📞 Tujuan  : ${Array.isArray(d.data) ? d.data.join(', ') : d.data || '-'}\n` +
    `💰 Harga   : ${rupiah(d.price)}\n` +
    `📌 Status  : ${statusEmoji(d.status)} ${d.status || '-'}\n` +
    (d.voucher ? `🎟️ Voucher  : ${d.voucher}\n` : ``) +
    (d.note    ? `📝 Catatan  : ${d.note}\n`    : ``) +
    `🕐 Dibuat  : ${d.created_at ? formatDate(d.created_at) : '-'}\n` +
    `🔄 Update  : ${d.updated_at ? formatDate(d.updated_at) : '-'}`
  ).join('\n\n━━━━━━━━━━━━━━━━━━\n\n')
}

// ── Handler utama ──
let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    const sub   = String(args[0] || '').toLowerCase()
    const arg1  = args[1] || ''
    const arg2  = args[2] || ''

    // ── HELP ──
    if (!sub || sub === 'help') {
      return m.reply(
        `🏪 *PPOB — FM-PEDIA*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `📋 *List Layanan*\n` +
        `${usedPrefix}ppob list\n` +
        `${usedPrefix}ppob list <keyword>\n\n` +
        `📦 *Order Produk*\n` +
        `${usedPrefix}ppob order <kode> <nomor>\n\n` +
        `🔍 *Cek Status*\n` +
        `${usedPrefix}ppob status <ref_id>\n` +
        `${usedPrefix}ppob status (5 terakhir)\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📋 Contoh:\n` +
        `${usedPrefix}ppob list xl\n` +
        `${usedPrefix}ppob order XLDXC30 081234567890\n` +
        `${usedPrefix}ppob status BOT1234567890`
      )
    }

    // ── LIST ──
    if (sub === 'list' || sub === 'layanan') {
      await m.reply(`⏳ Mengambil daftar layanan...`)

      const res = await getServices()
      if (!res.status || !Array.isArray(res.data)) {
        return m.reply(failText('gagal ambil layanan: ' + (res.message || '')))
      }

      const keyword = args.slice(1).join(' ').trim()
      const txt = formatServiceList(res.data, keyword)

      if (!txt) return m.reply(`❌ Layanan *"${keyword}"* tidak ditemukan.\nCoba kata kunci lain.`)
      return m.reply(txt)
    }

    // ── ORDER ──
    if (sub === 'order' || sub === 'beli') {
      const kode  = arg1.toUpperCase()
      const nomor = arg2.replace(/[^0-9]/g, '')

      if (!kode || !nomor) {
        return m.reply(
          `❌ *Format salah!*\n\n` +
          `📌 Format:\n` +
          `${usedPrefix}ppob order <kode> <nomor>\n\n` +
          `📋 Contoh:\n` +
          `${usedPrefix}ppob order XLDXC30 081234567890\n\n` +
          `Cari kode: *${usedPrefix}ppob list <keyword>*`
        )
      }

      await m.reply(`⏳ Memproses order *${kode}* ke *${nomor}*...`)

      const res = await placeOrder(kode, nomor)

      if (!res.status || !res.data) {
        return m.reply(
          `❌ *Order Gagal*\n\n` +
          `📌 Kode  : ${kode}\n` +
          `📞 Nomor : ${nomor}\n` +
          `⚠️ Alasan: ${res.message || 'Terjadi kesalahan'}`
        )
      }

      return m.reply(formatOrder(res.data))
    }

    // ── STATUS ──
    if (sub === 'status' || sub === 'cek') {
      const ref_id = arg1 || ''

      await m.reply(`⏳ Mengecek status transaksi...`)

      const params = ref_id
        ? { type: 'status', ref_id }
        : { type: 'status', limit: 5 }

      const res = await apiCall(params)

      if (!res.status) {
        return m.reply(failText('gagal cek status: ' + (res.message || '')))
      }

      const list = Array.isArray(res.data) ? res.data : [res.data]
      return m.reply(
        `🔍 *CEK STATUS TRANSAKSI*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        formatStatus(list)
      )
    }

    // Sub command tidak dikenal
    return m.reply(`❌ Sub command tidak dikenal.\nKetik *${usedPrefix}ppob* untuk bantuan.`)

  } catch (error) {
    console.error('ppob handler error:', error)
    m.reply(failText('lagi error: ' + error.message))
  }
}

handler.command  = /^(ppob)$/i
handler.tags     = ['store']
handler.help     = ['ppob list', 'ppob order <kode> <nomor>', 'ppob status <ref_id>']

module.exports = handler