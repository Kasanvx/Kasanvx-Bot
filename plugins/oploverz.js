// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const GROUP_WM = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

const API_SEARCH = 'https://api.siputzx.my.id/api/anime/oploverz-search'
const API_DOWNLOAD = 'https://api.siputzx.my.id/api/anime/oploverz-download'

async function searchAnime(query) {
  const res = await fetch(`${API_SEARCH}?query=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.status || !json.data?.length) return null
  return json.data
}

async function getDownload(url) {
  const res = await fetch(`${API_DOWNLOAD}?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.status || !json.data) return null
  return json.data
}

// Bersihkan key dari HTML tag favicon
function cleanKey(key) {
  return key.replace(/<[^>]+>/g, '').trim()
}

function formatSearchHasil(results, query) {
  const list = results.map((item, i) =>
    `*${i + 1}.* ${item.title}\n📺 ${item.episodes} | ⭐ ${item.rating || 'N/A'}\n🔗 ${item.link}`
  ).join('\n\n')

  return `🎌 *OPLOVERZ SEARCH*
━━━━━━━━━━━━━━━━━━
🔍 Query : *${query}*

${list}

━━━━━━━━━━━━━━━━━━
📥 Salin link lalu ketik:
*.oploverz dl <link>*`
}

function formatDownload(data) {
  const { title, date, downloadLinks } = data

  if (!downloadLinks || !Object.keys(downloadLinks).length) {
    return `😔 *Link download tidak tersedia.*

⚠️ *Kemungkinan penyebab:*
• URL yang dimasukkan adalah link *series*, bukan link *episode*
• Contoh URL yang benar:
  _https://oploverz.org/anime/one-piece-episode-1155-subtitle-indonesia/_

💡 Coba cari episodenya dulu di oploverz.org lalu salin URL halaman episode tersebut.`
  }

  let dlText = ''
  for (const [rawServer, resolutions] of Object.entries(downloadLinks)) {
    const server = cleanKey(rawServer)
    dlText += `\n🖥️ *${server.toUpperCase()}*\n`
    for (const [res, link] of Object.entries(resolutions)) {
      dlText += `  ┣ ${res.padEnd(6)} → ${link}\n`
    }
  }

  return `📥 *OPLOVERZ DOWNLOAD*
━━━━━━━━━━━━━━━━━━
🎬 *${title}*
📅 Upload: ${date}
━━━━━━━━━━━━━━━━━━
${dlText}
━━━━━━━━━━━━━━━━━━
_Powered by oploverz.org_`
}

// Handler utama
let handler = async (m, { conn, args, text }) => {
  try {
    const sub = args[0]?.toLowerCase()
    const input = args.slice(1).join(' ').trim()

    // ── SEARCH ──
    if (sub === 'search') {
      if (!input) return m.reply(`❌ *Masukkan judul anime!*\nContoh: *.oploverz search one piece*`)

      await m.reply(`🔍 Mencari *"${input}"*... ⏳`)

      const results = await searchAnime(input)
      if (!results) return m.reply(`😔 *Anime tidak ditemukan!*\nCoba kata kunci lain.`)

      const pesan = formatSearchHasil(results, input)
      const firstImage = results[0]?.image

      if (firstImage) {
        await conn.sendMessage(m.chat, {
          image: { url: firstImage },
          caption: pesan
        }, { quoted: m })
      } else {
        await m.reply(pesan)
      }

    // ── DOWNLOAD ──
    } else if (sub === 'dl' || sub === 'download') {
      if (!input) return m.reply(`❌ *Masukkan URL episode oploverz!*\nContoh:\n*.oploverz dl https://oploverz.org/anime/...*`)
      if (!input.includes('oploverz.org')) return m.reply(`❌ *URL tidak valid!*\nHarus dari oploverz.org`)

      await m.reply(`⏳ Mengambil link download...\nMohon tunggu sebentar.`)

      const data = await getDownload(input)
      if (!data) return m.reply(`😔 *Gagal mengambil link download.*\nPastikan URL episode benar.`)

      await m.reply(formatDownload(data))

    // ── DEFAULT / HELP ──
    } else {
      m.reply(`📌 *OPLOVERZ FEATURES*
━━━━━━━━━━━━━━━━━━
*.oploverz search <judul>*
→ Cari anime di oploverz

*.oploverz dl <url episode>*
→ Ambil link download episode

━━━━━━━━━━━━━━━━━━
Contoh:
• .oploverz search naruto
• .oploverz dl https://oploverz.org/anime/...`)
    }

  } catch (error) {
    console.error('oploverz handler error:', error)
    m.reply(failText('lagi error: ' + error.message))
  }
}

handler.command = /^oploverz$/i
handler.tags = ['anime']
handler.help = ['oploverz search <judul>', 'oploverz dl <url>']

module.exports = handler