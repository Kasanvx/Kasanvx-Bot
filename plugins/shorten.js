/**
 * Plugin: Short simple
 * NOTE: VERSI RANDOM
 * Credits : XSNZ F-M
 */

const axios = require('axios');

const handler = async (m, { text }) => {
  if (!text) return m.reply('Masukkan URL');

  try {
    const res = await axios.post(
      'https://snx.biz.id/api/create',
      {
        url: text,
        expire: 'permanen'
      },
      {
        headers: {
          'x-api-key': 'sk_2lpf3ovpx6'
        }
      }
    );

    m.reply(`Shortlink:\n${res.data.data.short}`);
  } catch (e) {
    m.reply('Gagal membuat shortlink');
  }
};

handler.command = ['shorten', 'xshort'];
module.exports = handler;