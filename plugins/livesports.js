//code made by kasan

const axios = require('axios')
const moment = require('moment-timezone')

let handler = async (m, { conn }) => {

try {

let { data } = await axios.get('https://wudysoft.xyz/api/info/live-sport/v1?prompt=sample')

let matches = data.data.matches
if (!matches || !matches.length) return m.reply('Tidak ada pertandingan')

let today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD')

let filtered = matches.filter(v => {
if (!v.matchTime_t) return false
let matchDate = moment(v.matchTime_t).tz('Asia/Jakarta').format('YYYY-MM-DD')
return matchDate === today
})

if (!filtered.length) return m.reply('Tidak ada pertandingan hari ini')

filtered.sort((a, b) => new Date(a.matchTime_t) - new Date(b.matchTime_t))

let teks = `⚽ *LIVE SPORT HARI INI*\n`
teks += `📅 ${moment().tz('Asia/Jakarta').format('DD MMMM YYYY')} (WIB)\n`
teks += `━━━━━━━━━━━━━━━━━━\n\n`

filtered.slice(0, 15).forEach((match, i) => {

let waktu = moment(match.matchTime_t).tz('Asia/Jakarta').format('HH:mm')

let status =
match.state == 3 ? '🔴 LIVE'
: match.state == 0 ? '⏳ BELUM MULAI'
: match.state == 1 ? '⏸ HT'
: match.state == 2 ? '⚡ EXTRA'
: '✅ SELESAI'

teks += `🏆 ${match.leagueEn}\n`
teks += `${match.homeName} (${match.homeScore ?? 0})\n`
teks += `🆚\n`
teks += `${match.awayName} (${match.awayScore ?? 0})\n`
teks += `🕒 ${waktu} WIB\n`
teks += `📌 ${status}\n`
teks += `━━━━━━━━━━━━━━━━━━\n\n`

})

await conn.sendMessage(m.chat, { text: teks.trim() }, { quoted: m })

} catch (e) {
m.reply('Gagal mengambil data pertandingan')
}

}

handler.command = /^livesport$/i
module.exports = handler