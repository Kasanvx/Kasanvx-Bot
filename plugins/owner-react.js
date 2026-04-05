// credits : kasan
const axios = require("axios");
const { URLSearchParams } = require("url");

const BASE = "https://nexapanel.my.id";
const URL = `${BASE}/react2/`;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hex(nBytes = 6) {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < nBytes * 2; i++) out += chars[randInt(0, 15)];
  return out;
}

function genHugeSpaceUA() {
  const androidMajor = randInt(9, 15);
  const androidMinor = randInt(0, 5);
  const oems = ["Samsung", "Xiaomi", "OPPO", "vivo", "realme", "OnePlus", "Google"];
  const oem = pick(oems);
  const model =
    oem === "Samsung"
      ? `SM-${pick(["A", "M", "S", "F"])}${randInt(100, 999)}${pick(["F", "B", "E", "N", "U", "0", "1"])}`
      : oem === "Google"
      ? `Pixel ${randInt(4, 9)}${pick(["", "a", " Pro", " XL"])}`
      : `${pick(["CPH", "M", "RMX", "V", "LE", "KB"])}${randInt(1000, 9999)}`;
  const chromeMajor = randInt(110, 150);
  const chromeBuild = randInt(1000, 9999);
  const chromePatch = randInt(0, 199);
  return `Mozilla/5.0 (Linux; Android ${androidMajor}.${androidMinor}; ${model}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.${chromeBuild}.${chromePatch} Mobile Safari/537.36`;
}

function generateEmojiList() {
  const pool = ["😭", "🗿", "🔥", "❤️", "😂", "👍", "🙏"];
  const count = randInt(1, 4);
  const chosen = new Set();
  while (chosen.size < count) chosen.add(pick(pool));
  return [...chosen].join(",");
}

function mergeCookies(setCookieHeaders = []) {
  const parts = [];
  for (const h of setCookieHeaders) {
    const nv = String(h).split(";")[0]?.trim();
    if (nv) parts.push(nv);
  }
  const map = new Map();
  for (const nv of parts) {
    const eq = nv.indexOf("=");
    const name = eq >= 0 ? nv.slice(0, eq) : nv;
    map.set(name, nv);
  }
  return [...map.values()].join("; ");
}

function extract(html) {
  const out = {
    membership: null,
    verifiedId: null,
    saldoCoins: null,
    limit: false,
    systemLocked: false,
    time: null,
    resetIn: null,
  };
  const mMember = html.match(/fa-user<\/i>\s*([^<]+)\s*</);
  if (mMember) out.membership = mMember[1].trim();
  const mId = html.match(/NEXA-[A-Z0-9]+/);
  if (mId) out.verifiedId = mId[0];
  const idx = html.toLowerCase().indexOf("saldo tersedia");
  if (idx >= 0) {
    const slice = html.slice(idx, idx + 3000);
    const mSaldo = slice.match(/text-3xl[^>]*>\s*([0-9]+)\s*<\/span>/i);
    if (mSaldo) out.saldoCoins = Number(mSaldo[1]);
  }
  out.limit = /LIMIT\s+TERCAPAI!/i.test(html);
  out.systemLocked = /SYSTEM\s+LOCKED/i.test(html);
  const mTime = html.match(/\b([01]?\d|2[0-3]):[0-5]\d:[0-5]\d\b/);
  if (mTime) out.time = mTime[0];
  const mReset = html.match(/Reset\s+dalam\s+([^<\n\r]+)/i);
  if (mReset) out.resetIn = mReset[1].trim();
  return out;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function reqWithRetry(fn, attempts = 5) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn(i);
    } catch (e) {
      lastErr = e;
      await sleep(400 * i + Math.floor(Math.random() * 300));
    }
  }
  throw lastErr;
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `Kirim perintah beserta link channel WhatsApp!\nContoh: ${usedPrefix + command} https://whatsapp.com/channel/xxx`;
  
  m.reply('Sedang memproses reaksi ke channel...');
  
  try {
    const userAgent = genHugeSpaceUA();
    const nonce = hex(6);
    const testLink = text;
    const emoji = generateEmojiList();
    
    const commonHeaders = {
      "User-Agent": userAgent,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "max-age=0",
      "Upgrade-Insecure-Requests": "1",
    };
    
    const getRes = await reqWithRetry(async () => {
      return axios.get(URL, {
        headers: { ...commonHeaders, Referer: URL },
        timeout: 20000,
        maxRedirects: 5,
        validateStatus: () => true,
      });
    });
    
    const setCookie = getRes.headers["set-cookie"] || [];
    const cookieJar = mergeCookies(Array.isArray(setCookie) ? setCookie : [setCookie]);
    
    const body = new URLSearchParams({
      link: testLink,
      emoji,
      execute: "",
    }).toString();
    
    const postRes = await reqWithRetry(async () => {
      return axios.post(URL, body, {
        headers: {
          ...commonHeaders,
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: BASE,
          Referer: URL,
          Cookie: cookieJar,
        },
        timeout: 20000,
        maxRedirects: 5,
        validateStatus: () => true,
      });
    });
    
    const html = String(postRes.data || "");
    const parsed = extract(html);
    
    let replyMsg = `*STATUS REAKSI CHANNEL*\n\n`;
    replyMsg += `*Emoji:* ${emoji}\n`;
    replyMsg += `*Status HTTP:* ${postRes.status}\n`;
    if (parsed.membership) replyMsg += `*Membership:* ${parsed.membership}\n`;
    if (parsed.saldoCoins !== null) replyMsg += `*Saldo:* ${parsed.saldoCoins}\n`;
    if (parsed.limit) replyMsg += `*Limit:* Tercapai\n`;
    if (parsed.systemLocked) replyMsg += `*Sistem:* Terkunci\n`;
    
    m.reply(replyMsg);
  } catch (e) {
    m.reply(`Gagal memproses permintaan: ${String(e)}`);
  }
}

handler.help = ['reactchannel <link>']
handler.tags = ['tools']
handler.command = /^(reactchannel|reactch)$/i

module.exports = handler