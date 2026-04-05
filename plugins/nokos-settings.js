// credits : kasan
const axios = require('axios');

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    let user = global.db.data.users[m.sender];
    if (typeof user.saldo !== 'number') user.saldo = 0;
    if (!global.db.data.deposits) global.db.data.deposits = {};

    if (command === 'ceksaldo') {
        return m.reply(`Saldo Anda: Rp${user.saldo}`);
    }

    if (command === 'addsaldo') {
        if (!isOwner) return m.reply('Khusus owner.');
        let target = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        let amount = parseInt(args[1]);
        if (!target || isNaN(amount)) return m.reply(`Format: ${usedPrefix + command} 628xxx nominal`);
        if (!global.db.data.users[target]) global.db.data.users[target] = { saldo: 0 };
        let targetUser = global.db.data.users[target];
        if (typeof targetUser.saldo !== 'number') targetUser.saldo = 0;
        targetUser.saldo += amount;
        return m.reply(`Berhasil. Saldo ${target.split('@')[0]} menjadi Rp${targetUser.saldo}`);
    }

    if (command === 'resetsaldo') {
        if (!isOwner) return m.reply('Khusus owner.');
        let target = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        if (!target) return m.reply(`Format: ${usedPrefix + command} 628xxx`);
        if (!global.db.data.users[target]) return m.reply('User tidak ditemukan.');
        global.db.data.users[target].saldo = 0;
        return m.reply(`Saldo ${target.split('@')[0]} direset menjadi Rp0.`);
    }

    const headers = {
        'x-apikey': global.api,
        'Accept': 'application/json'
    };

    if (args.length === 0) {
        conn.nokos = conn.nokos || {};
        try {
            let res = await axios.get('https://www.rumahotp.com/api/v2/services', { headers });
            if (!res.data.data) return m.reply("Gagal mengambil layanan.");
            let list = res.data.data;
            let txt = "Pilih Layanan (Balas pesan ini dengan angka):\n\n";
            let options = {};
            list.forEach((v, i) => {
                txt += `${i + 1}. ${v.service_name}\n`;
                options[i + 1] = v;
            });
            let msg = await m.reply(txt);
            conn.nokos[m.sender] = { state: 'SERVICE', options, id: msg.key.id, time: Date.now() };
        } catch (e) {
            m.reply("Terjadi kesalahan server.");
        }
        return;
    }

    let action = args[0];
    try {
        if (action === 'deposit') {
            let nominal = parseInt(args[1]);
            if (!nominal || isNaN(nominal)) return m.reply(`Format: ${usedPrefix + command} deposit <nominal>`);
            let res = await axios.get(`https://www.rumahotp.com/api/v2/deposit/create?amount=${nominal}&payment_id=qris`, { headers });
            if (!res.data.data) return m.reply("Gagal membuat deposit.");
            let d = res.data.data;
            let txt = `Deposit ID: ${d.id}\nStatus: ${d.status}\nTotal Transfer: Rp${d.total}\nQRIS String: ${d.qr_string}\n\nKetik ${usedPrefix + command} cekdeposit ${d.id} jika sudah bayar.`;
            conn.sendFile(m.chat, d.qr_image, 'qris.png', txt, m);
        } else if (action === 'cekdeposit') {
            let deposit_id = args[1];
            if (!deposit_id) return m.reply(`Format: ${usedPrefix + command} cekdeposit <deposit_id>`);
            let res = await axios.get(`https://www.rumahotp.com/api/v2/deposit/get_status?deposit_id=${deposit_id}`, { headers });
            if (!res.data.data) return m.reply("Gagal cek deposit.");
            let d = res.data.data;
            if (d.status === 'success') {
                if (global.db.data.deposits[deposit_id]) return m.reply("Deposit ini sudah diklaim.");
                global.db.data.deposits[deposit_id] = true;
                user.saldo += d.diterima;
                m.reply(`Deposit berhasil! Saldo ditambahkan: Rp${d.diterima}\nTotal Saldo: Rp${user.saldo}`);
            } else {
                m.reply(`Status Deposit: ${d.status}`);
            }
        } else if (action === 'batal') {
            conn.nokos = conn.nokos || {};
            delete conn.nokos[m.sender];
            m.reply("Sesi nokos dibatalkan.");
        }
    } catch (e) {
        m.reply("Terjadi kesalahan.");
    }
};

handler.before = async (m, { conn }) => {
    conn.nokos = conn.nokos || {};
    let session = conn.nokos[m.sender];
    if (!session || !m.text || isNaN(m.text)) return;

    let headers = { 'x-apikey': global.api, 'Accept': 'application/json' };
    let choice = parseInt(m.text);
    let selected = session.options[choice];
    if (!selected) return;

    try {
        if (session.state === 'SERVICE') {
            let sId = selected.service_code;
            let res = await axios.get(`https://www.rumahotp.com/api/v2/countries?service_id=${sId}`, { headers });
            if (!res.data.data) return m.reply("Gagal ambil negara.");
            let list = res.data.data;
            let txt = `Layanan: ${selected.service_name}\nPilih Negara (Balas angka):\n\n`;
            let options = {};
            let idx = 1;
            list.forEach(v => {
                if (v.pricelist && v.pricelist.length > 0) {
                    let p = v.pricelist[0];
                    txt += `${idx}. ${v.name} - Rp${p.price}\n`;
                    options[idx] = { number_id: v.number_id, cname: v.name, provider_id: p.provider_id, price: p.price, service_id: sId };
                    idx++;
                }
            });
            let msg = await m.reply(txt);
            conn.nokos[m.sender] = { state: 'COUNTRY', options, id: msg.key.id, time: Date.now() };
        } else if (session.state === 'COUNTRY') {
            let res = await axios.get(`https://www.rumahotp.com/api/v2/operators?country=${encodeURIComponent(selected.cname)}&provider_id=${selected.provider_id}`, { headers });
            if (!res.data.data || res.data.data.length === 0) {
                delete conn.nokos[m.sender];
                return m.reply("Operator kosong. Silakan ulangi dari awal.");
            }
            let list = res.data.data;
            let txt = `Negara: ${selected.cname}\nPilih Operator (Balas angka):\n\n`;
            let options = {};
            list.forEach((v, i) => {
                txt += `${i + 1}. ${v.name}\n`;
                options[i + 1] = { ...selected, operator_id: v.id };
            });
            let msg = await m.reply(txt);
            conn.nokos[m.sender] = { state: 'OPERATOR', options, id: msg.key.id, time: Date.now() };
        } else if (session.state === 'OPERATOR') {
            let user = global.db.data.users[m.sender];
            if (typeof user.saldo !== 'number') user.saldo = 0;
            if (user.saldo < selected.price) {
                delete conn.nokos[m.sender];
                return m.reply(`Saldo kurang. Harga Rp${selected.price}, Saldo Rp${user.saldo}`);
            }
            
            let res = await axios.get(`https://www.rumahotp.com/api/v2/orders?number_id=${selected.number_id}&provider_id=${selected.provider_id}&operator_id=${selected.operator_id}`, { headers });
            if (!res.data.data) {
                delete conn.nokos[m.sender];
                return m.reply("Gagal membuat order.");
            }
            
            let d = res.data.data;
            user.saldo -= selected.price;
            delete conn.nokos[m.sender];
            
            m.reply(`Order Sukses!\nID: ${d.order_id}\nNomor: ${d.phone_number}\nHarga: Rp${selected.price}\nSisa Saldo: Rp${user.saldo}\n\nMenunggu OTP masuk otomatis... (Maks 3 menit)`);
            
            let startTime = Date.now();
            let checkInterval = setInterval(async () => {
                try {
                    let check = await axios.get(`https://www.rumahotp.com/api/v1/orders/get_status?order_id=${d.order_id}`, { headers });
                    let statusData = check.data.data;
                    
                    if (statusData && statusData.otp_code && statusData.otp_code !== '-') {
                        clearInterval(checkInterval);
                        conn.reply(m.chat, `OTP Masuk!\n\nID: ${d.order_id}\nNomor: ${statusData.phone_number}\nOTP: *${statusData.otp_code}*`, m);
                    } else if (Date.now() - startTime > 180000) {
                        clearInterval(checkInterval);
                        await axios.get(`https://www.rumahotp.com/api/v1/orders/set_status?order_id=${d.order_id}&status=cancel`, { headers });
                        global.db.data.users[m.sender].saldo += selected.price;
                        conn.reply(m.chat, `Waktu habis. Pesanan ${d.order_id} otomatis dibatalkan dan saldo Rp${selected.price} dikembalikan.`, m);
                    }
                } catch (e) {
                }
            }, 10000);
        }
    } catch (e) {
        delete conn.nokos[m.sender];
        m.reply("Terjadi kesalahan.");
    }
};

handler.help = ['nokos', 'ceksaldo', 'addsaldo', 'resetsaldo'];
handler.tags = ['nokos'];
handler.command = /^(nokos|ceksaldo|addsaldo|resetsaldo)$/i;

module.exports = handler;