//kasanvx

let handler = async (m, { conn }) => {

let txt = `📖 *PANDUAN PENGGUNAAN BOT NOKOS*

Bot ini digunakan untuk membeli *nomor virtual (Nokos)* yang dapat menerima *kode OTP* dari berbagai aplikasi seperti WhatsApp, Telegram, Shopee, Instagram, dll.

━━━━━━━━━━━━━━━━━━

💰 *1. Deposit Saldo*

Sebelum membeli nomor, silakan isi saldo terlebih dahulu.

Contoh:
.deposit 5000

Bot akan mengirim *QRIS pembayaran*.  
Silakan scan QR dan bayar sesuai nominal.

Setelah pembayaran berhasil:
• Saldo akan masuk *otomatis*
• Tidak perlu konfirmasi manual

Cek saldo dengan:
.ceksaldo

━━━━━━━━━━━━━━━━━━

📱 *2. Membeli Nomor Nokos*

Ketik perintah:

.nokos

Bot akan menampilkan *daftar aplikasi* yang tersedia.

Contoh:
1. WhatsApp  
2. Telegram  
3. Instagram  
4. Shopee  

Balas pesan tersebut dengan *angka aplikasi* yang ingin digunakan.

━━━━━━━━━━━━━━━━━━

🌍 *3. Pilih Negara*

Setelah memilih aplikasi, bot akan menampilkan *daftar negara nomor*.

Contoh:
1. Indonesia  
2. Malaysia  
3. Philippines  

Balas dengan *angka negara* yang ingin dipakai.

━━━━━━━━━━━━━━━━━━

📡 *4. Pilih Operator*

Bot akan menampilkan *operator kartu SIM* yang tersedia.

Contoh:
1. Telkomsel  
2. XL  
3. Smartfren  

Balas dengan *angka operator*.

━━━━━━━━━━━━━━━━━━

📞 *5. Nomor Akan Diberikan*

Jika order berhasil, bot akan mengirim:

• Nomor virtual  
• Layanan aplikasi  
• Negara nomor  
• Sisa saldo kamu  

Contoh:

Nomor : +6285xxxx  
Layanan : WhatsApp  
Negara : Indonesia  

Gunakan nomor tersebut untuk meminta *kode OTP* di aplikasi tujuan.

━━━━━━━━━━━━━━━━━━

🔑 *6. OTP Masuk Otomatis*

Jika OTP berhasil dikirim oleh aplikasi, bot akan otomatis mengirimkan kode OTP ke chat.

Contoh:
OTP : *123456*

━━━━━━━━━━━━━━━━━━

⏱ *Jika OTP Tidak Masuk*

Jika OTP tidak masuk dalam beberapa menit:

• Pesanan akan *dibatalkan otomatis*  
• Saldo akan *dikembalikan penuh*

━━━━━━━━━━━━━━━━━━

📌 *Catatan Penting*

• Nomor hanya untuk *1 kali OTP*  
• Jangan spam request OTP  
• Gunakan nomor *secepatnya* setelah diterima  
• Stok nomor tergantung provider  

━━━━━━━━━━━━━━━━━━

💡 *Perintah Penting*

.deposit <nominal> → isi saldo  
.ceksaldo → cek saldo kamu  
.nokos → beli nomor virtual  
.help → lihat panduan bot

━━━━━━━━━━━━━━━━━━

Terima kasih telah menggunakan layanan Nokos kami 🙏
`

conn.reply(m.chat, txt, m)

}

handler.help = ['tutorial']
handler.tags = ['nokos']
handler.command = /^(tutorial)$/i

module.exports = handler