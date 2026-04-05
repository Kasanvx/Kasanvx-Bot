// Thanks To Kasan

let didyoumean = require('didyoumean')
let similarity = require('similarity')

let handler = m => m

handler.before = function (m, { match, usedPrefix, text }) {
	if ((usedPrefix = (match[0] || '')[0])) {
		let noPrefix = m.text.replace(usedPrefix, '').trim()
		let alias = Object.values(global.plugins).filter(v => v.help && !v.disabled).map(v => v.help).flat(1)
		if (alias.includes(noPrefix)) return
		
		let mean = didyoumean(noPrefix, alias)
		if (!mean) return
		
		let sim = (similarity(noPrefix, mean) * 100).toFixed(0)
		let pesan = `Hai Kak @${m.sender.split`@`[0]}\n\nMaksud lu ${usedPrefix + mean}?\n\n› Menu: ${usedPrefix + mean}\n› Kesamaan: ${sim}%`
		
		m.reply(pesan)
	}
}

module.exports = handler