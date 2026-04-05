//kasanvx

const axios = require('axios')

const APIS = {
  jokeapi: 'https://v2.jokeapi.dev/joke',
  dadjoke: 'https://official-joke-api.appspot.com/random_joke',
  icanhazdadjoke: 'https://icanhazdadjoke.com/'
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  Accept: 'application/json'
}

const KATEGORI = ['Programming', 'Misc', 'Dark', 'Pun', 'Spooky', 'Christmas']

async function fetchJokeApi(kategori = 'Any') {
  const kat = KATEGORI.includes(kategori) ? kategori : 'Any'
  const resp = await axios.get(`${APIS.jokeapi}/${kat}`, { headers: HEADERS, timeout: 10000 })
  const d = resp.data

  if (d.type === 'twopart') {
    return `${d.setup}\n\n${d.delivery}`
  }
  return d.joke
}

async function fetchDadJoke() {
  const resp = await axios.get(APIS.dadjoke, { headers: HEADERS, timeout: 10000 })
  const d = resp.data
  return `${d.setup}\n\n${d.punchline}`
}

async function fetchIcanHaz() {
  const resp = await axios.get(APIS.icanhazdadjoke, {
    headers: { ...HEADERS, Accept: 'text/plain' },
    timeout: 10000
  })
  return resp.data
}

async function getRandomJoke(kategori = null) {
  // Pilih API secara random
  const pick = Math.floor(Math.random() * 3)

  try {
    if (pick === 0) return { source: 'JokeAPI', joke: await fetchJokeApi(kategori) }
    if (pick === 1) return { source: 'DadJoke', joke: await fetchDadJoke() }
    return { source: 'icanhazdadjoke', joke: await fetchIcanHaz() }
  } catch {
    // Fallback ke API lain kalau gagal
    try {
      return { source: 'JokeAPI', joke: await fetchJokeApi() }
    } catch {
      return null
    }
  }
}

function buildCaption(result) {
  return `😂 *JOKE TIME!*
━━━━━━━━━━━━━━━
${result.joke}
━━━━━━━━━━━━━━━
_via ${result.source}_`.trim()
}

function buildMenu(usedPrefix, command) {
  return `😂 *JOKE TIME!*
━━━━━━━━━━━━━━━
Kirim joke random atau pilih kategori:

🖥️ programming
🎲 misc
🌚 dark
🙃 pun
👻 spooky
🎄 christmas

*Contoh:*
${usedPrefix + command}
${usedPrefix + command} programming
${usedPrefix + command} dark
━━━━━━━━━━━━━━━`
}

let handler = async (m, { args, usedPrefix, command }) => {
  try {
    const input = args.join(' ').trim().toLowerCase()

    // Tidak ada args → tampilkan menu
    if (!input) {
      return m.reply(buildMenu(usedPrefix, command))
    }

    // Cek apakah input "menu" atau "help"
    if (['menu', 'help', 'list'].includes(input)) {
      return m.reply(buildMenu(usedPrefix, command))
    }

    // Capitalize kategori buat jokeapi
    const kategori = input.charAt(0).toUpperCase() + input.slice(1)

    await m.reply('😂 Nyari joke...')

    const result = await getRandomJoke(kategori)

    if (!result) {
      return m.reply('❌ Gagal ambil joke, coba lagi nanti.')
    }

    await m.reply(buildCaption(result))

  } catch {
    await m.reply(
`❌ Gagal ambil joke.

Contoh:
${usedPrefix + command}
${usedPrefix + command} programming
${usedPrefix + command} dark`
    )
  }
}

handler.help = ['joke', 'joke <kategori>']
handler.tags = ['fun']
handler.command = /^(joke)$/i

module.exports = handler