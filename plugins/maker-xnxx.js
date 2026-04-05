// credits : kasan
const axios = require('axios');

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `Kirim perintah beserta teks quote!\nContoh: ${usedPrefix + command} Keberanian bukanlah tidak adanya ketakutan.`;
  let name = encodeURIComponent(m.pushName || 'User');
  let quote = encodeURIComponent(text);
  let likes = 1000;
  let dislikes = 10;

  let apiUrl = `https://api.siputzx.my.id/api/canvas/fake-xnxx?name=${name}&quote=${quote}&likes=${likes}&dislikes=${dislikes}`;

  await conn.sendMessage(m.chat, { image: { url: apiUrl }, caption: 'Proses selesai.' }, { quoted: m });
}

handler.help = ['fakexnxx <teks>']
handler.tags = ['maker']
handler.command = /^(fakexnxx|xnxxquote)$/i

module.exports = handler