//code made by kasan
/**
 * Plugin: Sports - Jadwal Semua Liga 2026
 * Channel: snx.biz.id/ch-xsn
 */

const fetch = require('node-fetch');

let handler = async (m, { conn, usedPrefix, text }) => {
    const API_KEY = 'f6c1d233ccmsha95dd27857235b6p1481acjsn62911f167262';
    const HOST = 'football98.p.rapidapi.com';

    if (!text) return conn.reply(m.chat, 'Contoh penggunaan:\n/jadwal epl\n/jadwal laliga\n/jadwal seriea', m);

    const leagues = {
        epl: 'premierleague',
        laliga: 'laliga',
        seriea: 'seriea',
        bundesliga: 'bundesliga',
        ligue1: 'ligue1',
        champions: 'championsleague'
    };

    let leagueSlug = leagues[text.toLowerCase()];
    if (!leagueSlug) return conn.reply(m.chat, 'Liga tidak tersedia. Pilih salah satu: epl, laliga, seriea, bundesliga, ligue1, champions', m);

    try {
        let res = await fetch(`https://${HOST}/${leagueSlug}/matches?season=2026`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': HOST,
                'x-rapidapi-key': API_KEY
            }
        });

        let data = await res.json();
        if (!data || !data.matches || data.matches.length === 0) {
            return conn.reply(m.chat, `Tidak ada jadwal tersedia untuk ${text.toUpperCase()} 2026.`, m);
        }

        let teks = `📅 Jadwal ${text.toUpperCase()} 2026\n\n`;
        data.matches.forEach(match => {
            let date = new Date(match.date);
            let formattedDate = date.toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
            teks += `• ${match.homeTeam.name} vs ${match.awayTeam.name}\n  🗓 ${formattedDate}\n\n`;
        });

        conn.reply(m.chat, teks, m);

    } catch (err) {
        conn.reply(m.chat, 'Gagal mengambil jadwal, coba lagi nanti.', m);
        console.error(err);
    }
};

handler.command = /^jadwal$/i;
handler.tags = ['sports'];
handler.help = ['jadwal <liga>'];

module.exports = handler;