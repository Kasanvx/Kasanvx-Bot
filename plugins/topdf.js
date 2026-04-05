// credits : kasan

const axios = require("axios")
const FormData = require("form-data")

class ImgToPdf {
  constructor() {
    this.userAgent = "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36"
    this.headers = {
      "user-agent": this.userAgent,
      "accept": "*/*",
      "accept-language": "id-ID,id;q=0.9",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "origin": "https://tools.pdf24.org",
      "referer": "https://tools.pdf24.org/",
      "content-type": "application/json;charset=UTF-8"
    }
  }

  async KotakHitam(buffer, filename = "file.png") {
    const form = new FormData()
    form.append("reqtype", "fileupload")
    form.append("fileToUpload", buffer, filename)
    const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: { ...form.getHeaders(), "user-agent": this.userAgent }
    })
    return data.trim()
  }

  async uploadImage(buffer, filename) {
    const url = await this.KotakHitam(buffer, filename)
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { "user-agent": this.userAgent }
    })
    const mime = res.headers["content-type"] || "image/png"
    const ext = mime.split("/")[1] || "png"
    const form = new FormData()
    form.append("file", res.data, `upload.${ext}`)
    const uploadRes = await axios.post(
      "https://filetools26.pdf24.org/client.php?action=upload",
      form,
      { headers: { ...this.headers, ...form.getHeaders() } }
    )
    return uploadRes.data
  }

  async convertToPdf(filesData) {
    const body = {
      files: filesData,
      rotations: Array(filesData.length).fill(0),
      joinFiles: true,
      createBookmarks: false,
      pageSize: "A4",
      pageOrientation: "auto"
    }
    const { data } = await axios.post(
      "https://filetools26.pdf24.org/client.php?action=imagesToPdf",
      body,
      { headers: this.headers }
    )
    return data.jobId
  }

  async tungguSek(jobId) {
    while (true) {
      const { data } = await axios.post(
        "https://filetools26.pdf24.org/client.php?action=getStatus",
        new URLSearchParams({ jobId }),
        { headers: { ...this.headers, "content-type": "application/x-www-form-urlencoded" } }
      )
      if (data.status === "done") return data.job
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  async jadiinPdfyGy(url) {
    const { data } = await axios.get(url, {
      responseType: "arraybuffer",
      headers: this.headers
    })
    return data
  }

  async convert(buffer, filename) {
    try {
      const uploadResult = await this.uploadImage(buffer, filename)
      if (!uploadResult?.length) throw "Upload pdf24 gagal"
      const jobId = await this.convertToPdf([uploadResult[0]])
      const result = await this.tungguSek(jobId)
      const downloadUrl = `https://filetools26.pdf24.org/client.php?mode=download&action=downloadJobResult&jobId=${jobId}`
      const pdfBuffer = await this.jadiinPdfyGy(downloadUrl)
      return { error: false, buffer: pdfBuffer }
    } catch (e) {
      return { error: true, message: e.message || e }
    }
  }
}

let handler = async (m, { conn, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  
  if (!mime.startsWith('image/')) {
    return m.reply(`📸 Kirim atau balas gambar dengan perintah *${usedPrefix + command}*`)
  }

  await m.reply('⏳ *Sedang memproses gambar menjadi PDF...*')

  try {
    let media = await q.download()
    let pdfMaker = new ImgToPdf()
    let result = await pdfMaker.convert(media, 'image.png')

    if (result.error) {
      return m.reply('❌ Gagal mengonversi gambar ke PDF.')
    }

    await conn.sendMessage(m.chat, {
      document: result.buffer,
      mimetype: 'application/pdf',
      fileName: 'Hasil_Convert.pdf',
      caption: '✅ *Berhasil mengubah gambar menjadi PDF!*'
    }, { quoted: m })

  } catch (err) {
    m.reply('❌ Terjadi kesalahan sistem saat memproses file.')
  }
}

handler.command = /^(topdf|imgtopdf|imagetopdf)$/i
handler.tags = ['tools']
handler.help = ['topdf <reply image>']
handler.register = true

module.exports = handler