// ────────── code made by kasan | WM GROUP : https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t ──────────

const axios = require('axios')

const GROUP_WM = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t'
const OWNER   = '6287767510608@s.whatsapp.net'
const MP_KEY  = global.mp || ''
const MP_URL  = 'https://mustikapayment.com'

const failText = (alasan = 'lagi error') =>
  `Yahh fiturnya lagi ${alasan} 😿\n\nSilakan lapor ke group:\n${GROUP_WM}`

function rupiah(x) {
  return 'Rp' + Number(x || 0).toLocaleString('id-ID')
}

function formatDate(ts) {
  return new Date(ts).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const BANK_LIST = {
  '002': 'BRI', '008': 'Mandiri', '009': 'BNI', '011': 'Danamon',
  '013': 'Permata', '014': 'BCA', '016': 'Maybank', '022': 'CIMB Niaga',
  '028': 'OCBC', '031': 'Citibank', '036': 'BTN', '037': 'Artha Graha',
  '046': 'DKI', '047': 'Jabar Banten', '076': 'Bpd Jateng', '110': 'BJB',
  '111': 'DKI Syariah', '112': 'Jateng Syariah', '153': 'Sinarmas',
  '200': 'BTN Syariah', '212': 'Bank Muamalat', '213': 'BTPN',
  '425': 'BPR KS', '441': 'Bukopin', '451': 'Syariah Indonesia',
  '484': 'KEB Hana', '485': 'MNC Bank', '490': 'Allo Bank',
  '501': 'Nobu Bank', '503': 'Bank Mega', '506': 'Bank Syariah Mega',
  '513': 'Ina Perdana', '517': 'Prima Master', '521': 'Bumiputera',
  '523': 'Bank Sahabat Sampoerna', '526': 'Panin Dubai Syariah',
  '531': 'Krom Bank', '535': 'SeaBank', '542': 'BSI',
  '547': 'BTPN Syariah', '553': 'Mayapada', '555': 'Revolving',
  '558': 'Neo Commerce', '559': 'Bank Bisnis', '564': 'Jago',
  '566': 'Bank BRI Agro', '567': 'Bank Amar', '568': 'Kesejahteraan Ekonomi',
  '688': 'Woori Saudara', '777': 'Ekuitas', '789': 'Harda International',
  '812': 'Bank Shinhan', '818': 'Platinium', '819': 'Maspion',
  '821': 'Mitra Niaga', '835': 'Ganesha', '848': 'Banten',
  '867': 'BPD Bali', '945': 'IBK Indonesia', '947': 'CTBC',
  '949': 'Chinatrust', '950': 'Setia Budi Utama',
}

const EWALLET_LIST = {
  'dana': 'DANA', 'gopay': 'GoPay', 'ovo': 'OVO',
  'linkaja': 'LinkAja', 'shopeepay': 'ShopeePay'
}

async function mpPost(path, params) {
  const res = await axios.post(`${MP_URL}${path}`,
    new URLSearchParams(params),
    { headers: { 'X-Api-Key': MP_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
  )
  return res.data
}

async function mpGet(path, params) {
  const res = await axios.get(`${MP_URL}${path}`, {
    params,
    headers: { 'X-Api-Key': MP_KEY },
    timeout: 15000
  })
  return res.data
}

async function getSaldo() {
  return mpGet('/api/saldo', {})
}

async function validateRek(tipe, kode, rek) {
  return mpGet('/api/validate-bank', { tipe, kode, rek })
}

async function requestOTP(tipe, kode, rek, amount) {
  return mpPost('/api/wd', { tipe, kode, rek, amount })
}

async function executeWD(tipe, kode, rek, amount, otp) {
  return mpPost('/api/wd', { tipe, kode, rek, amount, otp })
}

function resetSesi(conn, jid) {
  conn.wdSesi = conn.wdSesi || {}
  delete conn.wdSesi[jid]
}

function formatBankList() {
  return Object.entries(BANK_LIST).map(([k, v]) => `\`${k}\` ${v}`).join('\n')
}

function formatEwalletList() {
  return Object.entries(EWALLET_LIST).map(([k, v]) => `\`${k}\` ${v}`).join('\n')
}

// ── Handler ──
let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    if (m.sender !== OWNER) return m.reply('❌ Fitur ini khusus owner.')

    conn.wdSesi = conn.wdSesi || {}

    const sub  = String(args[0] || '').toLowerCase()
    const arg1 = args[1] || ''
    const arg2 = args[2] || ''
    const arg3 = args[3] || ''

    // ── CEK SALDO ──
    if (!sub || sub === 'saldo') {
      await m.reply('⏳ Mengambil saldo MustikaPay...')
      const res = await getSaldo()
      return m.reply(
        `💰 *SALDO MUSTIKAPAY*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✅ Available : *${rupiah(res.balance_available)}*\n` +
        `⏳ Pending   : ${rupiah(res.balance_pending)}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🕐 ${formatDate(Date.now())}`
      )
    }

    // ── LIST BANK ──
    if (sub === 'listbank') {
      return m.reply(`🏦 *DAFTAR KODE BANK*\n━━━━━━━━━━━━━━━━━━\n${formatBankList()}`)
    }

    // ── LIST EWALLET ──
    if (sub === 'listew') {
      return m.reply(`📱 *DAFTAR EWALLET*\n━━━━━━━━━━━━━━━━━━\n${formatEwalletList()}`)
    }

    // ── VALIDASI REKENING ──
    if (sub === 'cekrek') {
      // .wd cekrek bank 014 1234567890
      // .wd cekrek ewallet dana 081234567890
      const tipe = arg1 // bank / ewallet
      const kode = arg2
      const rek  = arg3

      if (!tipe || !kode || !rek) {
        return m.reply(
          `❌ Format salah!\n\n` +
          `Bank: *.wd cekrek bank <kode_bank> <norek>*\n` +
          `EWallet: *.wd cekrek ewallet <kode_ew> <nohp>*\n\n` +
          `Lihat kode bank: *.wd listbank*\n` +
          `Lihat kode ewallet: *.wd listew*`
        )
      }

      await m.reply('⏳ Memvalidasi rekening...')
      const res = await validateRek(tipe, kode, rek)

      if (res.status !== 'success') {
        return m.reply(`❌ Rekening tidak ditemukan atau tidak valid.`)
      }

      return m.reply(
        `✅ *REKENING VALID*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🏦 Bank/EW : ${tipe === 'bank' ? (BANK_LIST[kode] || kode) : (EWALLET_LIST[kode] || kode)}\n` +
        `📋 No Rek  : ${rek}\n` +
        `👤 Nama    : *${res.account_name}*`
      )
    }

    // ── TARIK TUNAI (WD) ──
    if (sub === 'bank' || sub === 'ewallet' || sub === 'ew') {
      const tipe   = (sub === 'bank') ? 'bank' : 'ewallet'
      const kode   = arg1
      const rek    = arg2
      const amount = parseInt(arg3)

      const minAmount = tipe === 'bank' ? 10000 : 20000

      if (!kode || !rek || !amount || isNaN(amount)) {
        return m.reply(
          `❌ Format salah!\n\n` +
          `Bank:\n*.wd bank <kode_bank> <norek> <nominal>*\n\n` +
          `EWallet:\n*.wd ewallet <kode_ew> <nohp> <nominal>*\n\n` +
          `Contoh:\n*.wd bank 014 1234567890 100000*\n` +
          `*.wd ewallet dana 081234567890 50000*\n\n` +
          `Lihat kode: *.wd listbank* atau *.wd listew*`
        )
      }

      if (amount < minAmount) {
        return m.reply(`❌ Minimal WD ${tipe === 'bank' ? 'bank' : 'ewallet'}: *${rupiah(minAmount)}*`)
      }

      await m.reply('⏳ Memvalidasi rekening & request OTP...')

      // Validasi dulu
      try {
        const val = await validateRek(tipe, kode, rek)
        if (val.status !== 'success') {
          return m.reply(`❌ Rekening *${rek}* tidak valid atau tidak ditemukan.`)
        }

        // Request OTP
        const otpRes = await requestOTP(tipe, kode, rek, amount)

        const label = tipe === 'bank' ? (BANK_LIST[kode] || kode) : (EWALLET_LIST[kode] || kode)

        const konfirMsg = await m.reply(
          `🔐 *KONFIRMASI TARIK TUNAI*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `🏦 Tujuan  : ${label}\n` +
          `📋 No Rek  : ${rek}\n` +
          `👤 Nama    : *${val.account_name}*\n` +
          `💰 Nominal : *${rupiah(amount)}*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📩 OTP telah dikirim ke Telegram/Email kamu\n\n` +
          `Balas pesan ini dengan *kode OTP* untuk lanjutkan\n` +
          `atau balas *batal* untuk membatalkan`
        )

        conn.wdSesi[m.sender] = {
          tipe, kode, rek, amount,
          namaRek: val.account_name,
          label,
          msgId:   konfirMsg.key.id,
          chat:    m.chat,
          created: Date.now()
        }

      } catch (e) {
        return m.reply(failText('validasi/OTP gagal: ' + e.message))
      }
      return
    }

    // ── HELP ──
    return m.reply(
      `💸 *TARIK TUNAI MUSTIKAPAY*\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `💰 *Cek Saldo*\n` +
      `${usedPrefix}${command} saldo\n\n` +
      `🏦 *WD ke Bank*\n` +
      `${usedPrefix}${command} bank <kode> <norek> <nominal>\n\n` +
      `📱 *WD ke EWallet*\n` +
      `${usedPrefix}${command} ewallet <kode> <nohp> <nominal>\n\n` +
      `🔍 *Validasi Rekening*\n` +
      `${usedPrefix}${command} cekrek bank <kode> <norek>\n\n` +
      `📋 *Lihat Kode*\n` +
      `${usedPrefix}${command} listbank\n` +
      `${usedPrefix}${command} listew\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Contoh:\n` +
      `*.wd bank 014 1234567890 100000*\n` +
      `*.wd ewallet dana 081234567890 50000*`
    )

  } catch (e) {
    console.error('wd error:', e)
    m.reply(failText('lagi error: ' + e.message))
  }
}

// ── Before handler: input OTP ──
handler.before = async (m, { conn }) => {
  conn.wdSesi = conn.wdSesi || {}
  const sesi = conn.wdSesi[m.sender]
  if (!sesi) return
  if (!m.quoted || m.quoted.id !== sesi.msgId) return
  if (!m.text) return

  // Expired 5 menit
  if (Date.now() - sesi.created > 5 * 60 * 1000) {
    resetSesi(conn, m.sender)
    return m.reply('⏰ Sesi kadaluarsa. Ulangi dari awal.')
  }

  const teks = m.text.trim().toLowerCase()

  if (teks === 'batal') {
    resetSesi(conn, m.sender)
    return m.reply('❌ Tarik tunai dibatalkan.')
  }

  // Eksekusi WD dengan OTP
  const otp = teks
  resetSesi(conn, m.sender)

  await m.reply('⏳ Memproses penarikan...')

  try {
    const res = await executeWD(sesi.tipe, sesi.kode, sesi.rek, sesi.amount, otp)

    if (res.status !== 'success') {
      return m.reply(
        `❌ *TARIK TUNAI GAGAL*\n\n` +
        `⚠️ ${res.message || 'Terjadi kesalahan'}`
      )
    }

    return m.reply(
      `━━━━━━━━━━━━━━━━━━\n` +
      `💸 *TARIK TUNAI BERHASIL*\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `🏦 Tujuan      : ${sesi.label}\n` +
      `📋 No Rek      : ${sesi.rek}\n` +
      `👤 Nama        : ${sesi.namaRek}\n` +
      `💰 Nominal     : *${rupiah(sesi.amount)}*\n` +
      `🆔 Ref         : ${res.ref_no || '-'}\n` +
      `👛 Saldo baru  : *${rupiah(res.new_balance)}*\n\n` +
      `🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB\n` +
      `━━━━━━━━━━━━━━━━━━`
    )
  } catch (e) {
    return m.reply(failText('eksekusi WD gagal: ' + e.message))
  }
}

handler.command  = /^(wd|tarik)$/i
handler.tags     = ['owner']
handler.help     = ['wd saldo', 'wd bank <kode> <norek> <nominal>', 'wd ewallet <kode> <nohp> <nominal>']
handler.owner    = true

module.exports = handler