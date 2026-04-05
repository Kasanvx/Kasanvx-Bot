//code made by kasan

const axios = require('axios')
const FormData = require('form-data')

let handler = async (m, { conn }) => {

  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''

  if (!mime)
    return m.reply('Reply file yang mau diupload\nContoh: reply gambar lalu ketik .cdn')

  try {

    let buffer = await q.download()

    let ext = mime.split('/')[1] || 'bin'
    let filename = Date.now() + '.' + ext

    let form = new FormData()
    form.append('file', buffer, filename)

    let res = await axios.post(
      'https://cdn.snx.biz.id/api/upload',
      form,
      {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000
      }
    )

    let data = res.data

    if (!data.status)
      return m.reply('❌ Upload gagal')

    m.reply(data.url)

  } catch {
    m.reply('❌ Upload gagal')
  }

}

handler.help = ['cdn']
handler.tags = ['tools']
handler.command = /^cdn$/i

module.exports = handler