//kasanvx
const axios = require("axios")

const APIKEY = global.rumahotp || process.env.RUMAHOTP_APIKEY

function db() {
  return global.db.data.users
}

function getUser(id) {
  let user = db()[id]
  if (!user.balance) user.balance = 0
  if (!user.nokos) user.nokos = null
  return user
}

function rupiah(x) {
  return "Rp" + Number(x).toLocaleString("id-ID")
}

async function api(url) {
  const res = await axios.get(url, {
    headers: {
      "x-apikey": APIKEY,
      accept: "application/json"
    }
  })
  return res.data
}

let handler = async (m, { conn, args }) => {

  const user = getUser(m.sender)

  conn.nokosSession = conn.nokosSession || {}

  // command beli
  if (args[0]) {

    let service = args[0]

    let res = await api(`https://www.rumahotp.com/api/v2/countries?service_id=${service}`)

    if (!res.success) return m.reply("gagal ambil negara")

    let data = res.data.slice(0, 20)

    let txt = "*LIST NEGARA*\n\n"

    data.forEach((v, i) => {
      let price = v.pricelist[0]
      txt += `${i + 1}. ${v.name} - ${price.price_format}\n`
    })

    txt += "\nReply angka negara"

    conn.nokosSession[m.sender] = {
      data
    }

    return m.reply(txt)
  }

  // pilih negara
  if (conn.nokosSession[m.sender]) {

    let pilih = parseInt(m.text)

    if (!pilih) return

    let negara = conn.nokosSession[m.sender].data[pilih - 1]

    if (!negara) return

    let price = negara.pricelist[0]

    if (user.balance < price.price) {
      delete conn.nokosSession[m.sender]
      return m.reply(`saldo kurang\nharga ${rupiah(price.price)}`)
    }

    let order = await api(`https://www.rumahotp.com/api/v2/orders?number_id=${negara.number_id}&provider_id=${price.provider_id}&operator_id=1`)

    if (!order.success) {
      delete conn.nokosSession[m.sender]
      return m.reply("order gagal")
    }

    let d = order.data

    user.balance -= price.price

    user.nokos = {
      id: d.order_id,
      price: price.price,
      time: Date.now(),
      chat: m.chat
    }

    delete conn.nokosSession[m.sender]

    m.reply(
`*NOKOS BERHASIL*

Nomor : ${d.phone_number}
Layanan : ${d.service}
Negara : ${d.country}

OTP akan muncul otomatis`
    )

  }
}

handler.command = ["nokosbeli"]

module.exports = handler


// AUTO OTP SYSTEM
if (!global.nokosAutoRun) {

  global.nokosAutoRun = true

  setInterval(async () => {

    if (!global.conn) return

    let users = global.db.data.users

    for (let jid in users) {

      let user = users[jid]

      if (!user.nokos) continue

      try {

        let res = await axios.get(
          `https://www.rumahotp.com/api/v1/orders/get_status?order_id=${user.nokos.id}`,
          {
            headers: {
              "x-apikey": APIKEY
            }
          }
        )

        let d = res.data.data

        // OTP masuk
        if (d.otp_code && d.otp_code !== "-") {

          await global.conn.sendMessage(user.nokos.chat, {
            text: `OTP: ${d.otp_code}`
          })

          user.nokos = null
          continue
        }

        // auto cancel 5 menit
        if (Date.now() - user.nokos.time > 300000) {

          await axios.get(
            `https://www.rumahotp.com/api/v1/orders/set_status?order_id=${user.nokos.id}&status=cancel`,
            {
              headers: {
                "x-apikey": APIKEY
              }
            }
          )

          user.balance += user.nokos.price

          await global.conn.sendMessage(user.nokos.chat, {
            text: "OTP tidak masuk 5 menit\nOrder dibatalkan\nSaldo dikembalikan"
          })

          user.nokos = null
        }

      } catch {}

    }

  }, 10000)

}