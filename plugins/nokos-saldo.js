let handler=async(m)=>{
  db.data.users[m.sender] ||= {}
  db.data.users[m.sender].saldo ||= 0
  m.reply(`💰 Saldo kamu: Rp${db.data.users[m.sender].saldo}`)
}

handler.help=['saldo']
handler.tags=['nokos']
handler.command=/^saldo$/i

module.exports=handler