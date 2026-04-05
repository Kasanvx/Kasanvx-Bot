// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const GROUP_WM   = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'
const OWNER      = '6287767510608@s.whatsapp.net'
const LINK_REGEX = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i

function ensureDB() {
  global.db.data.joinMembers ||= {}
}

function getMember(sender) {
  ensureDB()
  return global.db.data.joinMembers[sender] || null
}

function isMemberAktif(sender) {
  const member = getMember(sender)
  if (!member) return false
  return member.expiredAt > Date.now()
}

function formatDate(ts) {
  const d  = new Date(ts + 7 * 3600000)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yy = d.getUTCFullYear()
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mn = String(d.getUTCMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${mn} WIB`
}

let handler = async (m, { conn, text, args }) => {
  try {
    ensureDB()

    const sub = String(args[0] || '').toLowerCase()

    // ── CEK STATUS ──
    if (sub === 'cek' || sub === 'status') {
      const target = m.mentionedJid?.[0] || m.sender
      const member = getMember(target)

      if (!member) {
        return m.reply(
          `❌ *Belum punya membership aktif.*\n\n` +
          `Sewa dulu: *.sewabot*`
        )
      }

      const sisa     = member.expiredAt - Date.now()
      const sisaHari = Math.ceil(sisa / (24 * 60 * 60 * 1000))
      const aktif    = sisa > 0

      return m.reply(
        `👤 *STATUS MEMBERSHIP*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `📱 User    : @${target.split('@')[0]}\n` +
        `📦 Paket   : ${member.label || member.tier}\n` +
        `📅 Expired : ${formatDate(member.expiredAt)}\n` +
        `📌 Status  : ${aktif ? `✅ Aktif (sisa ${sisaHari} hari)` : '❌ Expired'}\n\n` +
        (aktif ? `Gunakan: */join <link group>*` : `Perpanjang: *.sewabot*`),
        { mentions: [target] }
      )
    }

    // ── LIST MEMBER (owner) ──
    if (sub === 'member' || sub === 'list') {
      if (m.sender !== OWNER) return m.reply('❌ Khusus owner.')
      const members = Object.entries(global.db.data.joinMembers)
      if (!members.length) return m.reply('❌ Belum ada member.')

      let txt = `👥 *DAFTAR MEMBER*\n━━━━━━━━━━━━━━━━━━\n\n`
      members.forEach(([jid, v]) => {
        const sisa     = v.expiredAt - Date.now()
        const sisaHari = Math.ceil(sisa / (24 * 60 * 60 * 1000))
        const status   = sisa > 0 ? `✅ ${sisaHari}h lagi` : `❌ Expired`
        txt += `👤 ${jid.split('@')[0]}\n   📦 ${v.label || v.tier} | 📅 ${formatDate(v.expiredAt)} | ${status}\n\n`
      })
      return m.reply(txt)
    }

    // ── CEK MEMBERSHIP DULU — SEBELUM APAPUN ──
    if (m.sender !== OWNER) {
      const member = getMember(m.sender)

      if (!member) {
        return m.reply(
          `🔒 *AKSES DITOLAK*\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `❌ Kamu belum punya membership!\n\n` +
          `Sewa bot dulu untuk bisa pakai fitur ini.\n\n` +
          `*.sewabot* — lihat paket & harga`
        )
      }

      if (member.expiredAt < Date.now()) {
        return m.reply(
          `🔒 *AKSES DITOLAK*\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `❌ Membership kamu sudah *expired!*\n\n` +
          `📅 Expired : ${formatDate(member.expiredAt)}\n\n` +
          `Perpanjang sekarang:\n` +
          `*.sewabot* — lihat paket & harga`
        )
      }
    }

    // ── CEK LINK ──
    const fullText = text?.trim() || ''
    const match    = fullText.match(LINK_REGEX)
    const code     = match?.[1]

    if (!code) {
      return m.reply(
        `🔗 *JOIN GROUP VIA BOT*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Format:\n` +
        `*/join <link group WhatsApp>*\n\n` +
        `Contoh:\n` +
        `_/join https://chat.whatsapp.com/xxx_`
      )
    }

    // ── JOIN GROUP ──
    await m.reply('⏳ Sedang join group...')

    try {
      const res = await conn.groupAcceptInvite(code)
      await m.reply(
        `✅ *BERHASIL JOIN GROUP!*\n\n` +
        `🔗 Link : https://chat.whatsapp.com/${code}\n` +
        (res?.gid ? `🆔 GID  : ${res.gid}\n` : ``) +
        `\nBot sudah berhasil masuk ke group.`
      )
    } catch (e) {
      if (e.message?.includes('already a participant')) {
        return m.reply(`ℹ️ Bot sudah ada di group ini sebelumnya.`)
      }
      return m.reply(
        `❌ Gagal join group.\n\n` +
        `Pastikan link valid dan bot belum di-ban dari group tersebut.`
      )
    }

  } catch (e) {
    console.error('join error:', e)
    m.reply(`Yahh fiturnya lagi error 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`)
  }
}

handler.command = /^join$/i
handler.tags    = ['tools']
handler.help    = ['join <link group>', 'join cek', 'join member (owner)']

module.exports = handler