//kasanvx
const axios = require('axios')
const cheerio = require('cheerio')

const BASE_URL = 'https://www.nusadigital.web.id'
const TARGET_GC = global.TARGET_GC || process.env.TARGET_GC // JID group chat notif

function rupiah(x) {
  return 'Rp' + Number(x || 0).toLocaleString('id-ID')
}

async function scrapeProduk() {
  const { data } = await axios.get(`${BASE_URL}/produk`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: 15000
  })

  const $ = cheerio.load(data)
  const list = []

  $('a[href^="/produk/"]').each((_, el) => {
    const href = $(el).attr('href')
    const slug = href.replace('/produk/', '')
    const texts = []

    $(el).find('*').addBack().contents().filter((_, n) => n.type === 'text').each((_, n) => {
      const t = $(n).text().trim()
      if (t) texts.push(t)
    })

    let nama = '', kategori = '', harga = '', stok = ''
    texts.forEach(t => {
      if (t.startsWith('Rp')) harga = t
      else if (t.startsWith('Stok')) stok = t.replace('Stok ', '')
      else if (t === t.toUpperCase() && t.length > 2) {
        if (!nama) nama = t
        else if (!kategori) kategori = t
      }
    })

    if (nama && harga) {
      list.push({ nama, kategori, harga, stok, slug, url: `${BASE_URL}/produk/${slug}` })
    }
  })

  return list
}

function formatProduk(list, keyword = '') {
  let filtered = list
  if (keyword) {
    filtered = list.filter(p =>
      p.nama.toLowerCase().includes(keyword.toLowerCase()) ||
      p.kategori.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  if (!filtered.length) return `❌ Produk *${keyword}* tidak ditemukan.`

  let msg = `🛒 *Produk Nusa Digital*\n`
  if (keyword) msg += `🔍 Filter: _${keyword}_\n`
  msg += `━━━━━━━━━━━━━━━\n`

  filtered.forEach((p, i) => {
    msg += `\n${i + 1}. *${p.nama}*\n`
    if (p.kategori) msg += `   📦 ${p.kategori}\n`
    msg += `   💰 ${p.harga}\n`
    msg += `   📊 Stok: ${p.stok || '?'}\n`
    msg += `   🔗 ${p.url}\n`
  })

  msg += `\n━━━━━━━━━━━━━━━`
  msg += `\n🌐 nusadigital.web.id`
  msg += `\n_Update: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB_`
  return msg
}

// ── Watcher: pantau stok & notif GC kalau ada perubahan ──────────────────
const CHECK_INTERVAL = 5 * 60 * 1000 // 5 menit
let prevStok = {}

async function startStokWatcher(conn) {
  if (global.nusadigitalWatcherStarted) return
  global.nusadigitalWatcherStarted = true

  setInterval(async () => {
    if (!conn || !TARGET_GC) return

    try {
      const list = await scrapeProduk()
      const changes = []

      for (const p of list) {
        const stokBaru = parseInt(p.stok) || 0
        const stokLama = prevStok[p.slug]

        if (stokLama === undefined) {
          prevStok[p.slug] = stokBaru
          continue
        }

        if (stokBaru !== stokLama) {
          changes.push({ ...p, stokLama, stokBaru })
          prevStok[p.slug] = stokBaru
        }
      }

      if (!changes.length) return

      let msg = `📦 *Update Stok Nusa Digital*\n`
      msg += `━━━━━━━━━━━━━━━\n`

      for (const c of changes) {
        const icon = c.stokBaru === 0 ? '🔴' : c.stokBaru > c.stokLama ? '🟢' : '🟡'
        msg += `\n${icon} *${c.nama}*\n`
        if (c.kategori) msg += `   📦 ${c.kategori}\n`
        msg += `   💰 ${c.harga}\n`
        msg += `   📊 Stok: ${c.stokLama} → *${c.stokBaru}*\n`
        msg += `   🔗 ${c.url}\n`
      }

      msg += `\n━━━━━━━━━━━━━━━`
      msg += `\n_${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB_`

      await conn.sendMessage(TARGET_GC, { text: msg })

    } catch (e) {
      console.error('[nusadigital watcher] Error:', e.message)
    }
  }, CHECK_INTERVAL)
}

// ── Handler utama ─────────────────────────────────────────────────────────
let handler = async (m, { conn, args, usedPrefix, command }) => {
  const keyword = args.join(' ').trim()

  await m.reply('🔍 Mengambil data produk...')

  try {
    const list = await scrapeProduk()

    if (!list.length) return m.reply('❌ Gagal mengambil produk. Coba lagi nanti.')

    const text = formatProduk(list, keyword)
    await m.reply(text)

    // Notif ke GC kalau command dipake di luar GC
    if (TARGET_GC && m.chat !== TARGET_GC) {
      const sender = m.sender.replace('@s.whatsapp.net', '')
      const gcMsg =
        `📢 *Produk Dilihat*\n\n` +
        `👤 +${sender}\n` +
        `🔍 Query: ${keyword || '(semua produk)'}\n` +
        `💬 Chat: ${m.isGroup ? 'GC' : 'Private'}\n` +
        `🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`
      try { await conn.sendMessage(TARGET_GC, { text: gcMsg }) } catch {}
    }

  } catch (e) {
    console.error('[nusadigital] Error:', e.message)
    return m.reply('❌ Terjadi kesalahan saat mengambil data produk.')
  }
}

handler.before = async (m, { conn }) => {
  startStokWatcher(conn).catch(() => {})
}

handler.help = ['produk [keyword]']
handler.tags = ['tools']
handler.command = /^(produk|nusadigital|cekproduk)$/i

module.exports = handler