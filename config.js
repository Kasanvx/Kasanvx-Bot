/**
 * Saxia Botz Configuration
 * Author: Kasan
 */

const fs = require('fs')
const chalk = require('chalk')

// ===== PAYMENT & LAYANAN ===== //
global.cash = 'cashify_a880b731e8d106c0f0ce8b4a8885ae9d92d57babd2d252d1eba0d4e0e693667b'
global.qris_id = 'f480f37b-1e13-4647-800e-fbd89a15b0da'
global.rumahotp = ''
global.shopee = {
  apikey: ''
}
global.btzpay = {
  apikey: ''
}

// ===== OWNER & ROLE ===== //
global.owner = ['6287767510608']
global.mods = ['6287767510608']
global.prefix = './#'
global.prems = ['6287767510608']

global.nameowner = 'Sn'
global.numberowner = '6287767510608'
global.mail = 'support@saxiabotz.web.id'

// ===== SOCIAL ===== //
global.gc = 'https://chat.whatsapp.com/LknsianRgX9KVNtyTChwZc?mode=gi_t' // isi link grup kalau ada
global.gcId = '120363023958940214@g.us'
global.instagram = 'https://instagram.com/shanv.konv'

// ===== BOT INFO ===== //
global.ruangotp = '787d59c7-86f0-4716-9d0e-9eeecc7d7eb8'
global.wm = '© Saxia Botz'
global.packname = 'Dibuat Oleh'
global.author = '© Saxia.js'

// ===== MESSAGE ===== //
global.wait = '_*Tunggu sedang diproses...*_'
global.eror = '_*Server Error*_'
global.stiker_wait = '*⫹⫺ Stiker sedang dibuat...*'

// ===== SYSTEM ===== //
global.dailyLimit = 30 // Limit harian
global.maxwarn = 2 // maksimal peringatan (number)
global.antiporn = true

// ===== API BETABOTZ (WAJIB DIISI) ===== //
global.lann = ''
global.aksesKey = '' // isi kalau sudah register

global.APIs = {
  lann: 'https://api.betabotz.eu.org'
}

global.APIKeys = {
  'https://api.betabotz.eu.org': global.lann
}

// ===== AUTO RELOAD CONFIG ===== //
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js' detected"))
  delete require.cache[file]
  require(file)
})
