import { connect } from "cloudflare:sockets";

// Variables
let cachedProxyList = [];
let proxyIP = "";
let apiCheck = 'https://ipcf.rmtq.fun/json/?ip=';

const DEFAULT_PROXY_BANK_URL = "https://proxy.xhamster.biz.id/proxyList.txt";
const UUIDS = `aaaaaaa1-bbbb-4ccc-accc-eeeeeeeeeee1`;
const TELEGRAM_BOT_TOKEN = '7826108422:AAEmQiVx2TvdAZnvpKw2zJZUvv8fOEGruW0';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const APICF = 'https://ipcf.rmtq.fun/json/';
const FAKE_HOSTNAME = 'privasi.bmkg.xyz';
const ownerId = 7114686701; // Ganti dengan chat_id pemilik bot (angka tanpa tanda kutip)




// Fungsi untuk menangani `/active`
async function handleActive(request) {
  const host = request.headers.get('Host');
  const webhookUrl = `https://${host}/webhook`;

  const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });

  if (response.ok) {
    return new Response('Webhook set successfully', { status: 200 });
  }
  return new Response('Failed to set webhook', { status: 500 });
}

// Fungsi untuk menangani `/delete` (menghapus webhook)
async function handleDelete(request) {
  const response = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.ok) {
    return new Response('Webhook deleted successfully', { status: 200 });
  }
  return new Response('Failed to delete webhook', { status: 500 });
}

// Fungsi untuk menangani `/info` (mendapatkan info webhook)
async function handleInfo(request) {
  const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);

  if (response.ok) {
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200 });
  }
  return new Response('Failed to retrieve webhook info', { status: 500 });
}

// Fungsi untuk menangani `/webhook`
async function handleWebhook(request) {
  const update = await request.json();

  if (update.callback_query) {
    return await handleCallbackQuery(update.callback_query);
  } else if (update.message) {
    return await handleMessage(update.message);
  }

  return new Response('OK', { status: 200 });
}

// Fungsi untuk menangani `/sendMessage`
async function handleSendMessage(request) {
  const { chat_id, text } = await request.json();
  const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text }),
  });

  if (response.ok) {
    return new Response('Message sent successfully', { status: 200 });
  }
  return new Response('Failed to send message', { status: 500 });
}

// Fungsi untuk menangani `/getUpdates`
async function handleGetUpdates(request) {
  const response = await fetch(`${TELEGRAM_API_URL}/getUpdates`);

  if (response.ok) {
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200 });
  }
  return new Response('Failed to get updates', { status: 500 });
}

// Fungsi untuk menangani `/deletePending` - menarik pembaruan yang tertunda
async function handleDeletePending(request) {
  // Hapus webhook untuk menghindari pembaruan tertunda
  const deleteResponse = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (deleteResponse.ok) {
    // Setelah menghapus webhook, atur webhook kembali
    const host = request.headers.get('Host');
    const webhookUrl = `https://${host}/webhook`;

    const setResponse = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });

    if (setResponse.ok) {
      return new Response('Pending updates deleted by resetting webhook', { status: 200 });
    }
    return new Response('Failed to set webhook after deletion', { status: 500 });
  }

  return new Response('Failed to delete webhook', { status: 500 });
}

async function handleDropPending(request) {
  const response = await fetch(`${TELEGRAM_API_URL}/getUpdates`);

  if (response.ok) {
    const data = await response.json();

    if (data.result && data.result.length > 0) {
      // Hanya mengambil pembaruan dan tidak memprosesnya
      return new Response('Dropped pending updates successfully', { status: 200 });
    }
    return new Response('No pending updates found', { status: 200 });
  }

  return new Response('Failed to get pending updates', { status: 500 });
}


// Routing utama sebelum mencapai handler default
async function routeRequest(request) {
  const url = new URL(request.url);

  if (url.pathname === '/active') {
    return await handleActive(request);
  }

  if (url.pathname === '/delete') {
    return await handleDelete(request);
  }

  if (url.pathname === '/info') {
    return await handleInfo(request);
  }

  if (url.pathname === '/webhook' && request.method === 'POST') {
    return await handleWebhook(request);
  }

  if (url.pathname === '/sendMessage') {
    return await handleSendMessage(request);
  }

  if (url.pathname === '/getUpdates') {
    return await handleGetUpdates(request);
  }

  if (url.pathname === '/deletePending') {
    return await handleDeletePending(request);
  }

  if (url.pathname === '/dropPending') {
    return await handleDropPending(request);
  }

  return null;
}


async function checkIPAndPort(ip, port) {
  const apiUrl = `${apiCheck}${ip}:${port}`;
  try {
    const apiResponse = await fetch(apiUrl);
    const apiData = await apiResponse.json();
    const result = {
      ip: ip,
      port: port,
      status: apiData.STATUS || null
    };
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json;charset=utf-8" }
    });
  } catch (err) {
    return new Response(`An error occurred while fetching API: ${err.toString()}`, {
      status: 500,
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      // Periksa rute khusus sebelum melanjutkan ke handler utama
      const routeResponse = await routeRequest(request);
      if (routeResponse) {
        return routeResponse;
      }

      // Handler utama tetap tidak terganggu
      const url = new URL(request.url);
      const upgradeHeader = request.headers.get("Upgrade");

      if (upgradeHeader === "websocket") {
        const proxyMatch = url.pathname.match(/^\/Free-CF-Proxy-(.+[:=-]\d+)$/);

        if (proxyMatch) {
          proxyIP = proxyMatch[1];
          return await websockerHandler(request);
        }
      }

      // Memeriksa URL path untuk IP dan Port
      if (url.pathname.startsWith("/")) {
        const pathParts = url.pathname.slice(1).split(":");
        if (pathParts.length === 2) {
          const [ip, port] = pathParts;
          return await checkIPAndPort(ip, port);
        }
      }

      switch (url.pathname) {
        default:
          const hostname = request.headers.get("Host");
          const result = getAllConfig(hostname, await getProxyList(env, true));
          return new Response(result, {
            status: 200,
            headers: { "Content-Type": "text/html;charset=utf-8" },
          });
      }
    } catch (err) {
      return new Response(`An error occurred: ${err.toString()}`, {
        status: 500,
      });
    }
  },
};

async function handleCallbackQuery(callbackQuery) {
  const callbackData = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  const wildkere = FAKE_HOSTNAME; // Ganti dengan host default yang benar

  try {
  
    if (callbackData.startsWith('create_bmkg')) {
      const [_, ip, port, isp] = callbackData.split('|');
      await handleBmkgCreation(chatId, ip, port, isp);
    } else if (callbackData.startsWith('create_ndeso')) {
      const [_, ip, port, isp] = callbackData.split('|');
      await handleNdesoCreation(chatId, ip, port, isp);
    } else if (callbackData.startsWith('create_ndeso1')) {
      const [_, ip, port, isp] = callbackData.split('|');
      await handleNdeso1Creation(chatId, ip, port, isp);
    } else if (callbackData.startsWith('create_turah')) {
      const [_, ip, port, isp] = callbackData.split('|');
      await handleTurahCreation(chatId, ip, port, isp);
    } else if (callbackData.startsWith('create_najah')) {
      const [_, ip, port, isp] = callbackData.split('|');
      await handleNajahCreation(chatId, ip, port, isp);
    } else if (callbackData.startsWith('create_coudproxy')) {
      const [_, ip, port, isp] = callbackData.split('|');
      await handleCoudproxyCreation(chatId, ip, port, isp);
    } else if (callbackData.startsWith('create_xhamster')) {
      const [_, ip, port, isp] = callbackData.split('|');
      await handleXhamsterCreation(chatId, ip, port, isp);
    } else if (callbackData.startsWith('create_cepu')) {
      const [_, ip, port, isp] = callbackData.split('|');
      await handleCepuCreation(chatId, ip, port, isp);
    } else if (callbackData.startsWith('create_kere')) {
      const [_, ip, port, isp] = callbackData.split('|');
      await handleKereCreation(chatId, ip, port, isp);
    } else if (callbackData.startsWith('send_xnxxx_buttons')) {
      const [_, ip, port, isp] = callbackData.split('|');
      await sendXnxxxButtons(chatId, ip, port, isp);
    } else if (callbackData.startsWith('create_xnxxx')) {
      const [_, ip, port, isp] = callbackData.split('|');
      await handleXnxxxCreation(chatId, ip, port, isp);
    } else if (callbackData.startsWith('/getrandom')) {
  const countryId = callbackData.slice(10); // Mengambil kode negara setelah "/getrandom"
  
  if (countryId) {
    await handleGetRandomCountryCommand(chatId, countryId); // Panggil fungsi untuk menangani negara
  } else {
    await sendTelegramMessage(chatId, '⚠️ Harap tentukan kode negara setelah `/getrandom` (contoh: `/getrandomID`, `/getrandomUS`).');
  }
}


    // Misalnya, memanggil fungsi untuk memberikan informasi negara atau proxy
    

    // Konfirmasi callback query ke Telegram
    await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
      }),
    });
  } catch (error) {
    console.error('Error handling callback query:', error);
  }

  return new Response('OK', { status: 200 });
}


let userChatIds = [];

// Function to handle incoming messages
async function handleMessage(message) {
  const text = message.text;
  const chatId = message.chat.id;

  // Menangani perintah /start
  if (text === '/start') {
    await handleStartCommand(chatId);

    // Menambahkan pengguna ke daftar jika belum ada
    if (!userChatIds.includes(chatId)) {
      userChatIds.push(chatId);
    }

  // Menangani perintah /info
  } else if (text === '/info') {
    await handleGetInfo(chatId);

    // Menangani perintah /getcountry
  } else if (text === '/getcountry') {
    await handleGetgetcountry(chatId);

    // Menangani perintah /subapi
  } else if (text === '/subapi') {
    await handleGetsubapi(chatId);

  // Menangani perintah /listwildcard
  } else if (text === '/listwildcard') {
    await handleListWildcard(chatId);
    
      // Menangani perintah /listdomain
  } else if (text === '/listdomain') {
    await handleListDomain(chatId);
  
  // Menangani perintah /listpremium
  } else if (text === '/listpremium') {
    await handleListPremium(chatId);
    
  // Menangani perintah /getrandomip
  } else if (text === '/getrandomip') {
    await handleGetRandomIPCommand(chatId);

  // Menangani perintah /getrandom <CountryCode>
  } else if (text.startsWith('/getrandom')) {
    const countryId = text.slice(10); // Mengambil kode negara setelah "/getrandom" tanpa spasi
    if (countryId) {
        await handleGetRandomCountryCommand(chatId, countryId);
    } else {
        await sendTelegramMessage(chatId, '⚠️ Harap tentukan kode negara setelah `/getrandom` (contoh: `/getrandomID`, `/getrandomUS`).');
    }


  // Menangani perintah /broadcast
  } else if (text.startsWith('/broadcast')) {
    await handleBroadcastCommand(message);

  // Menangani format IP:Port
  } else if (isValidIPPortFormat(text)) {
    await handleIPPortCheck(text, chatId);

  // Pesan tidak dikenali atau format salah
  } else {
    await sendTelegramMessage(chatId, '⚠️ Format tidak valid. Gunakan format IP:Port yang benar (contoh: 192.168.1.1:80).');
  }

  return new Response('OK', { status: 200 });
}

// Fungsi untuk menangani perintah /broadcast
async function handleBroadcastCommand(message) {
  const chatId = message.chat.id;
  const text = message.text;

  // Memeriksa apakah pengirim adalah pemilik bot
  if (chatId !== ownerId) {
    await sendTelegramMessage(chatId, '⚠️ Anda bukan pemilik bot ini.');
    return;
  }

  // Mengambil pesan setelah perintah /broadcast
  const broadcastMessage = text.replace('/broadcast', '').trim();
  if (!broadcastMessage) {
    await sendTelegramMessage(chatId, '⚠️ Harap masukkan pesan setelah perintah /broadcast.');
    return;
  }

  // Mengirim pesan ke semua pengguna yang terdaftar
  if (userChatIds.length === 0) {
    await sendTelegramMessage(chatId, '⚠️ Tidak ada pengguna untuk menerima pesan broadcast.');
    return;
  }

  for (const userChatId of userChatIds) {
    try {
      await sendTelegramMessage(userChatId, broadcastMessage);
    } catch (error) {
      console.error(`Error mengirim pesan ke ${userChatId}:`, error);
    }
  }

  await sendTelegramMessage(chatId, `✅ Pesan telah disebarkan ke ${userChatIds.length} pengguna.`);
}

// Fungsi untuk mengirim pesan ke pengguna melalui Telegram API
async function sendTelegramMessage(chatId, message) {
  const url = `${TELEGRAM_API_URL}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown', // Untuk memformat teks
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('Gagal mengirim pesan:', result);
    }
  } catch (error) {
    console.error('Error saat mengirim pesan:', error);
  }
}

// Function to handle the /start command
async function handleStartCommand(chatId) {
  const welcomeMessage = `
🎉 Selamat datang di Free Vpn Bot! 🎉

💡 Cara Penggunaan:
1️⃣ Kirimkan Proxy IP:Port dalam format yang benar.
       Contoh: \`192.168.1.1:8080\`
2️⃣ Bot akan mengecek status Proxy untuk Anda.

✨ Anda bisa memilih opsi untuk membuat VPN Tunnel CloudFlare Gratis Menggunakan ProxyIP yang sudah di Cek dengan format:
- 🌐 VLESS
- 🔐 TROJAN
- 🛡️ Shadowsocks

🚀 Mulai sekarang dengan mengirimkan Proxy IP:Port Anda!

📌 Daftar Commands : 


/getrandomip
/getcountry
/listwildcard
/listpremium
/subapi


👨‍💻 Dikembangkan oleh: [Mode](https://t.me/kstore877)

🌐 WEB VPN TUNNEL : [VPN Tunnel CloudFlare](https://privasi.bmkg.xyz)
📺 CHANNEL : [Channel](https://t.me/kstore877)
👥 GROUP TELE : [Grup](https://t.me/+Rs4HvJtagXZlYTNl)
👥 GROUP WA : [Grup WA](https://chat.whatsapp.com/L9bbkRbzyozEFJHgGc9pPh)

ORDER PREMIUM CONTACT ADMIN
🧔 ADMIN TELE : [ADMIN TELE](https://t.me/kcepu877)
🧔 ADMIN WA : [ADMIN WA](https://wa.me/6281335135082)

  `;
  await sendTelegramMessage(chatId, welcomeMessage);
}

async function handleGetInfo(chatId) {
  const InfoMessage = `
🎉 Commands di Free Vpn Bot! 🎉

🟢 \`/getrandomip\`
🟢 \`/getcountry\`
🟢 \`/listwildcard\`
🟢 \`/listpremium\`
🟢 \`/subapi\`

👨‍💻 Dikembangkan oleh: [Mode](https://t.me/kstore877)

🌐 WEB VPN TUNNEL : [VPN Tunnel CloudFlare](https://privasi.bmkg.xyz)
📺 CHANNEL : [Channel](https://t.me/kstore877
👥 GROUP TELE : [Grup](https://t.me/+Rs4HvJtagXZlYTNl)
👥 GROUP WA : [Grup WA](https://chat.whatsapp.com/L9bbkRbzyozEFJHgGc9pPh)

ORDER PREMIUM CONTACT ADMIN
🧔 ADMIN TELE : [ADMIN TELE](https://t.me/kcepu877)
🧔 ADMIN WA : [ADMIN WA](https://wa.me/6281335135082)
  `;
  await sendTelegramMessage(chatId, InfoMessage);
}

async function handleGetsubapi(chatId) {
  const InfoMessage = `
🎉 Commands di Free Vpn Bot! 🎉


URL = https://privasi.bmkg.xyz/api
aplikasi = v2ray, v2rayng, clash, nekobox, singbox, surfboard, husi,
Acount = ?type=vless, trojan, ss,
Bug = &bug=\`quiz.int.vidio.com\`, 
    \`ava.game.naver.com\`,
    \`business.blibli.com\`,
    \`graph.instagram.com\`,
    \`quiz.int.vidio.com\`,
    \`live.iflix.com\`,
    \`support.zoom.us\`,
    \`blog.webex.com\`,
    \`investors.spotify.com\`,
    \`cache.netflix.com\`,
    \`zaintest.vuclip.com\`,
    \`ads.ruangguru.com\`,
    \`api.midtrans.com\`,
    \`investor.fb.com\`,
tls/ntls = &tls=true, false,
wildcard = &wildcard=true, false
limit = &limit=10
Country = &country=RANDOM, all, SG, ID, US, DLL


https://privasi.bmkg.xyz/api/v2ray?type=vless&bug=quiz.int.vidio.com&tls=true&wildcard=true&limit=10&country=SG

👨‍💻 Dikembangkan oleh: [Mode](https://t.me/kstore877)

🌐 WEB VPN TUNNEL : [VPN Tunnel CloudFlare](https://privasi.bmkg.xyz)
📺 CHANNEL : [Channel](https://t.me/kstore877
👥 GROUP TELE : [Grup](https://t.me/+Rs4HvJtagXZlYTNl)
👥 GROUP WA : [Grup WA](https://chat.whatsapp.com/L9bbkRbzyozEFJHgGc9pPh)

ORDER PREMIUM CONTACT ADMIN
🧔 ADMIN TELE : [ADMIN TELE](https://t.me/kcepu877)
🧔 ADMIN WA : [ADMIN WA](https://wa.me/6281335135082)
  `;
  await sendTelegramMessage(chatId, InfoMessage);
}


async function handleGetgetcountry(chatId) {
  const InfoMessage = `
🎉 Commands di Free Vpn Bot! 🎉

🎮 Pilih Command Negara:
`;

  // Daftar tombol inline yang terdiri dari bendera dan kode negara
  const inline_keyboard = [
  [
{ text: '🇮🇩 ID', callback_data: '/getrandomID' },
{ text: '🇸🇬 SG', callback_data: '/getrandomSG' },
{ text: '🇦🇩 AD', callback_data: '/getrandomAD' },
{ text: '🇦🇪 AE', callback_data: '/getrandomAE' },
{ text: '🇦🇱 AL', callback_data: '/getrandomAL' },
],
  [
{ text: '🇦🇲 AM', callback_data: '/getrandomAM' },
{ text: '🇦🇷 AR', callback_data: '/getrandomAR' },
{ text: '🇦🇹 AT', callback_data: '/getrandomAT' },
{ text: '🇦🇺 AU', callback_data: '/getrandomAU' },
{ text: '🇦🇿 AZ', callback_data: '/getrandomAZ' },
],
  [
{ text: '🇧🇩 BD', callback_data: '/getrandomBD' },
{ text: '🇧🇪 BE', callback_data: '/getrandomBE' },
{ text: '🇧🇬 BG', callback_data: '/getrandomBG' },
{ text: '🇧🇭 BH', callback_data: '/getrandomBH' },
{ text: '🇧🇷 BR', callback_data: '/getrandomBR' },
],
  [
{ text: '🇧🇾 BY', callback_data: '/getrandomBY' },
{ text: '🇨🇦 CA', callback_data: '/getrandomCA' },
{ text: '🇨🇭 CH', callback_data: '/getrandomCH' },
{ text: '🇨🇱 CL', callback_data: '/getrandomCL' },
{ text: '🇨🇳 CN', callback_data: '/getrandomCN' },
],
  [
{ text: '🇨🇴 CO', callback_data: '/getrandomCO' },
{ text: '🇨🇾 CY', callback_data: '/getrandomCY' },
{ text: '🇨🇿 CZ', callback_data: '/getrandomCZ' },
{ text: '🇩🇪 DE', callback_data: '/getrandomDE' },
{ text: '🇩🇰 DK', callback_data: '/getrandomDK' },
],
  [
{ text: '🇩🇴 DO', callback_data: '/getrandomDO' },
{ text: '🇪🇪 EE', callback_data: '/getrandomEE' },
{ text: '🇪🇬 EG', callback_data: '/getrandomEG' },
{ text: '🇪🇸 ES', callback_data: '/getrandomES' },
{ text: '🇫🇮 FI', callback_data: '/getrandomFI' },
],
  [
{ text: '🇫🇷 FR', callback_data: '/getrandomFR' },
{ text: '🇬🇧 GB', callback_data: '/getrandomGB' },
{ text: '🇬🇪 GE', callback_data: '/getrandomGE' },
{ text: '🇬🇮 GI', callback_data: '/getrandomGI' },
{ text: '🇬🇷 GR', callback_data: '/getrandomGR' },
],
  [
{ text: '🇭🇰 HK', callback_data: '/getrandomHK' },
{ text: '🇭🇷 HR', callback_data: '/getrandomHR' },
{ text: '🇭🇺 HU', callback_data: '/getrandomHU' },
{ text: '🇮🇪 IE', callback_data: '/getrandomIE' },
{ text: '🇮🇱 IL', callback_data: '/getrandomIL' },
],
  [
{ text: '🇮🇳 IN', callback_data: '/getrandomIN' },
{ text: '🇮🇷 IR', callback_data: '/getrandomIR' },
{ text: '🇮🇸 IS', callback_data: '/getrandomIS' },
{ text: '🇮🇹 IT', callback_data: '/getrandomIT' },
{ text: '🇯🇵 JP', callback_data: '/getrandomJP' },
],
  [
{ text: '🇰🇬 KG', callback_data: '/getrandomKG' },
{ text: '🇰🇷 KR', callback_data: '/getrandomKR' },
{ text: '🇰🇼 KW', callback_data: '/getrandomKW' },
{ text: '🇰🇿 KZ', callback_data: '/getrandomKZ' },
{ text: '🇱🇧 LB', callback_data: '/getrandomLB' },
],
  [
{ text: '🇱🇸 LD', callback_data: '/getrandomLD' },
{ text: '🇻🇳 VN', callback_data: '/getrandomVN' },
{ text: '🇿🇦 ZA', callback_data: '/getrandomZA' },
{ text: '🇱🇹 LT', callback_data: '/getrandomLT' },
{ text: '🇱🇺 LU', callback_data: '/getrandomLU' },
],
  [
{ text: '🇱🇻 LV', callback_data: '/getrandomLV' },
{ text: '🇱🇸 LX', callback_data: '/getrandomLX' },
{ text: '🇱🇾 LY', callback_data: '/getrandomLY' },
{ text: '🇲🇩 MD', callback_data: '/getrandomMD' },
{ text: '🇲🇰 MK', callback_data: '/getrandomMK' },
],
  [
{ text: '🇲🇺 MU', callback_data: '/getrandomMU' },
{ text: '🇲🇽 MX', callback_data: '/getrandomMX' },
{ text: '🇲🇾 MY', callback_data: '/getrandomMY' },
{ text: '🇳🇱 NL', callback_data: '/getrandomNL' },
{ text: '🇳🇴 NO', callback_data: '/getrandomNO' },
],
  [
{ text: '🇳🇿 NZ', callback_data: '/getrandomNZ' },
{ text: '🇵🇭 PH', callback_data: '/getrandomPH' },
{ text: '🇵🇱 PL', callback_data: '/getrandomPL' },
{ text: '🇵🇷 PR', callback_data: '/getrandomPR' },
{ text: '🇵🇹 PT', callback_data: '/getrandomPT' },
],
  [
{ text: '🇶🇦 QA', callback_data: '/getrandomQA' },
{ text: '🇷🇴 RO', callback_data: '/getrandomRO' },
{ text: '🇷🇸 RS', callback_data: '/getrandomRS' },
{ text: '🇷🇺 RU', callback_data: '/getrandomRU' },
{ text: '🇸🇦 SA', callback_data: '/getrandomSA' },
],
  [
{ text: '🇸🇪 SE', callback_data: '/getrandomSE' },
{ text: '🇸🇮 SI', callback_data: '/getrandomSI' },
{ text: '🇸🇰 SK', callback_data: '/getrandomSK' },
{ text: '🇹🇱 T1', callback_data: '/getrandomT1' },
{ text: '🇹🇭 TH', callback_data: '/getrandomTH' },
],
  [
{ text: '🇹🇷 TR', callback_data: '/getrandomTR' },
{ text: '🇹🇼 TW', callback_data: '/getrandomTW' },
{ text: '🇺🇦 UA', callback_data: '/getrandomUA' },
{ text: '🇺🇸 US', callback_data: '/getrandomUS' },
{ text: '🇺🇿 UZ', callback_data: '/getrandomUZ' },
  ],
  // Anda dapat terus melanjutkan dengan menambahkan tombol negara sesuai kebutuhan
];

  // Kirimkan pesan dengan tombol inline
  const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: InfoMessage, // Menambahkan pesan utama
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to send inline keyboard:', errorText);
  } else {
    console.log('Inline keyboard sent successfully.');
  }
}



async function handleListWildcard(chatId) {
  const wildkere = `privasi.bmkg.xyz`;
  const infoMessage = `
🎉 List Wildcard VPN Tunnel Free Vpn Bot! 


🟢 \`ava.game.naver.com.${wildkere}\`
🟢 \`business.blibli.com.${wildkere}\`
🟢 \`graph.instagram.com.${wildkere}\`
🟢 \`quiz.int.vidio.com.${wildkere}\`
🟢 \`live.iflix.com.${wildkere}\`
🟢 \`support.zoom.us.${wildkere}\`
🟢 \`blog.webex.com.${wildkere}\`
🟢 \`investors.spotify.com.${wildkere}\`
🟢 \`cache.netflix.com.${wildkere}\`
🟢 \`zaintest.vuclip.com.${wildkere}\`
🟢 \`ads.ruangguru.com.${wildkere}\`
🟢 \`api.midtrans.com.${wildkere}\`


👨‍💻 Dikembangkan oleh: [Mode](https://t.me/kstore877)

🌐 WEB VPN TUNNEL : [VPN Tunnel CloudFlare](https://privasi.bmkg.xyz)
📺 CHANNEL : [Channel](https://t.me/kstore877)
👥 GROUP TELE : [Grup Tele](https://t.me/+Rs4HvJtagXZlYTNl)
👥 GROUP WA : [Grup WA](https://chat.whatsapp.com/L9bbkRbzyozEFJHgGc9pPh)

ORDER PREMIUM CONTACT ADMIN
🧔 ADMIN TELE : [ADMIN TELE](https://t.me/kcepu877)
🧔 ADMIN WA : [ADMIN WA](https://wa.me/6281335135082)


  `;
  await sendTelegramMessage(chatId, infoMessage);
}


async function handleListDomain(chatId) {
  const wildkere = `privasi.bmkg.xyz`;
  const infoMessage = `
🎉 List Domain VPN Tunnel Free Vpn Bot! 


✅ \`free-cf.xhamster.biz.id\` ✅
✅ \`free-cf.turah.my.id\` ✅
✅ \`free-cf.ndeso.xyz\` ✅
✅ \`free-cf.ndeso.web.id\` ✅
✅ \`free-cf.kere.us.kg\` ✅
✅ \`free-cf.cepu.us.kg\` ✅
✅ \`free-cf.najah.biz.id.\` ✅
✅ \`web.bmkg.xyz\` ✅
✅ \`loss.cloudproxyip.my.id\` ✅



👨‍💻 Dikembangkan oleh: [Mode](https://t.me/kstore877)

🌐 WEB VPN TUNNEL : [VPN Tunnel CloudFlare](https://privasi.bmkg.xyz)
📺 CHANNEL : [Channel](https://t.me/kstore877)
👥 GROUP TELE : [Grup Tele](https://t.me/+Rs4HvJtagXZlYTNl)
👥 GROUP WA : [Grup WA](https://chat.whatsapp.com/L9bbkRbzyozEFJHgGc9pPh)

ORDER PREMIUM CONTACT ADMIN
🧔 ADMIN TELE : [ADMIN TELE](https://t.me/kcepu877)
🧔 ADMIN WA : [ADMIN WA](https://wa.me/6281335135082)


  `;
  await sendTelegramMessage(chatId, infoMessage);
}


async function handleListPremium(chatId) {
  const infoMessage = `
🎉 *List PREMIUM VPN Tunnel Bot!* 🎉

READY SERVER PREMIUM SSH, VLESS, VMESS & TROJAN. SUPPORT VC, GAME DLL
[MASA AKTIF 30 HARI & FULL GARANSI]


📌 *Daftar Server:*

\`\`\`
server--🇮🇩ID-BIZNET PRO1 2DEV
"12K"
"VMESS & TROJAN"
\`\`\`
\`\`\`
server--🇮🇩ID-BIZNET 2
"10K"
"VMESS & TROJAN"
\`\`\`
\`\`\`
server--🇮🇩ID-UNINET STB1
"12K"
"TROJAN"
\`\`\`
\`\`\`
server--🇮🇩ID1-RTRWNET VOCUHERAN
"65K"
"VMESS"
\`\`\`
\`\`\`
server--🇮🇩WIJAYA1
"10K"
"VMESS & VLESS"
\`\`\`
\`\`\`
server--🇮🇩ID-DEWAWEB2
"10K"
"VMESS & TROJAN"
\`\`\`
\`\`\`
server--🇮🇩ID-AMS1
"10K"
"VMESS & VLESS"
\`\`\`
\`\`\`
server--🇸🇬SGGS-2 STB
"12K"
"TROJAN"
\`\`\`
\`\`\`
server--🇸🇬SGGS-1 STB
"12K"
"VMESS"
\`\`\`
\`\`\`
server--🇸🇬DO1-NON STB
"8K"
"TROJAN"
\`\`\`
\`\`\`
server--🇸🇬SG1-RTRWNET SINGAPORE
"45K"
"VMESS"
\`\`\`
\`\`\`
server--🇸🇬DO3-SSH
"8K"
"SSH"
\`\`\`
\`\`\`
server--🇸🇬SG1-LINODE
"10K"
"SSH, VMESS & TROJAN"
\`\`\`
\`\`\`
server--🇸🇬DO2-NON STB
"8K"
"VMESS & VLESS"
\`\`\`
\`\`\`
server--🇸🇬SGDO-2DEV
"10K"
"SSH, VLESS, VMESS & TROJAN"
\`\`\`
\`\`\`
server--🇸🇬DO-4 NON STB
"8K"
"VMESS & VLESS"
\`\`\`
\`\`\`
server--🇸🇬SG-PREM1
"10K"
"VMESS"
\`\`\`
\`\`\`
server--🇮🇩ID-SANTOSA1 50Mbps
"8K"
"VMESS & TROJAN"
\`\`\`
\`\`\`
server--🇮🇩ID-NUSA MAX
"12K"
"SSH & VMESS"
\`\`\`

----------------------------------------

👨‍💻 *Admin & Kontak:*  
🛠 *ADMIN 1:* @kcepu877  
🛠 *ADMIN 2:* @epoenk877  

🔗 *Website FREE VPN Tunnel:* [FREE VPN Tunnel CloudFlare](https://privasi.bmkg.xyz)  
📢 *Channel Telegram:* [Klik di sini](https://t.me/kstore877)  
👥 *Grup Telegram:* [Klik di sini](https://t.me/+Rs4HvJtagXZlYTNl)  
👥 *Grup WhatsApp:* [Klik di sini](https://chat.whatsapp.com/L9bbkRbzyozEFJHgGc9pPh)  

📩 *Order Premium:*  
📱 *Admin Telegram:* [Klik di sini](https://t.me/kcepu877)  
📱 *Admin WhatsApp:* [Klik di sini](https://wa.me/6281335135082)  

----------------------------------------
  `;
  await sendTelegramMessage(chatId, infoMessage);
}





// Function to handle the /getrandomip command
async function handleGetRandomIPCommand(chatId) {
  try {
    // Fetching the Proxy IP list from the GitHub raw URL
    const response = await fetch('https://proxy.xhamster.biz.id/proxyList.txt');
    const data = await response.text();

    // Split the data into an array of Proxy IPs
    const proxyList = data.split('\n').filter(line => line.trim() !== '');

    // Randomly select 10 Proxy IPs
    const randomIPs = [];
    for (let i = 0; i < 10 && proxyList.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * proxyList.length);
      randomIPs.push(proxyList[randomIndex]);
      proxyList.splice(randomIndex, 1); // Remove the selected item from the list
    }

    // Format the random IPs into a message
    const message = `🔑 **Here are 10 random Proxy IPs:**\n\n` +
      randomIPs.map(ip => {
        const [ipAddress, port, country, provider] = ip.split(',');
        // Replace dots with spaces in the provider name
        const formattedProvider = provider.replace(/\./g, ' ');
        return `🌍 **\`${ipAddress}:${port}\`**\n📍 **Country:** ${country}\n💻 **Provider:** ${formattedProvider}\n`;
      }).join('\n');

    await sendTelegramMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching proxy list:', error);
    await sendTelegramMessage(chatId, '⚠️ There was an error fetching the Proxy list. Please try again later.');
  }
}

// Function to handle the /getrandom <Country> command
async function handleGetRandomCountryCommand(chatId, countryId) {
  try {
    const response = await fetch('https://proxy.xhamster.biz.id/proxyList.txt');
    const data = await response.text();
    const proxyList = data.split('\n').filter(line => line.trim() !== '');
    const filteredProxies = proxyList.filter(ip => {
      const [ipAddress, port, country, provider] = ip.split(',');
      return country.toUpperCase() === countryId.toUpperCase(); // Country case-insensitive comparison
    });
    const randomIPs = [];
    for (let i = 0; i < 10 && filteredProxies.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * filteredProxies.length);
      randomIPs.push(filteredProxies[randomIndex]);
      filteredProxies.splice(randomIndex, 1); // Remove the selected item from the list
    }
    if (randomIPs.length === 0) {
      await sendTelegramMessage(chatId, `⚠️ No proxies found for country code **${countryId}**.`);
      return;
    }
    const message = `🔑 **Here are 10 random Proxy IPs for country ${countryId}:**\n\n` +
      randomIPs.map(ip => {
        const [ipAddress, port, country, provider] = ip.split(',');
        // Replace dots with spaces in the provider name
        const formattedProvider = provider.replace(/\./g, ' ');
        return `🌍 **\`${ipAddress}:${port}\`**\n📍 **Country:** ${country}\n💻 **Provider:** ${formattedProvider}\n`;
      }).join('\n');

    await sendTelegramMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching proxy list:', error);
    await sendTelegramMessage(chatId, '⚠️ There was an error fetching the Proxy list. Please try again later.');
  }
}
  
async function handleIPPortCheck(ipPortText, chatId) {
  const [ip, port] = ipPortText.split(':');
  const result = await checkIPPort(ip, port, chatId);
  if (result) await sendTelegramMessage(chatId, result);
}

function isValidIPPortFormat(input) {
  const regex = /^(\d{1,3}\.){3}\d{1,3}:\d{1,5}$/;
  return regex.test(input);
}

async function checkIPPort(ip, port, chatId) {
  try {
    // Kirim pesan sementara bahwa IP sedang diperiksa
    await sendTelegramMessage(chatId, `🔍 *Cheking ProxyIP ${ip}:${port}...*`);
    const response = await fetch(`${APICF}?ip=${ip}:${port}`);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    const data = await response.json();
    const filterISP = (isp) => {
      // Hapus karakter selain huruf, angka, spasi, dan tanda kurung ( )
      const sanitizedISP = isp.replace(/[^a-zA-Z0-9\s()]/g, "");
      const words = sanitizedISP.split(" ");
      if (words.length <= 3) return sanitizedISP; // Jika ISP memiliki <= 3 kata, kembalikan apa adanya
      return `${words.slice(0, 2).join(" ")} ${words[words.length - 1]}`;
    };
    const filteredISP = filterISP(data.ISP);

    // Tentukan status aktif/tidak
    const status = data.STATUS === "✔ AKTIF ✔" ? "✅ Aktif" : "❌ Tidak Aktif";

    // Buat pesan hasil cek
    const resultMessage = `
🌐 Hasil Cek IP dan Port:
━━━━━━━━━━━━━━━━━━━━━━━
📍 IP: ${data.IP}
🔌 Port: ${data.PORT}
📡 ISP: ${filteredISP}
🏢 ASN: ${data.ASN}
🌆 Kota: ${data.KOTA}
📶 Status: ${status}
━━━━━━━━━━━━━━━━━━━━━━━
 
    `;

    // Kirim hasil cek
    await sendTelegramMessage(chatId, resultMessage);

    // Kirim keyboard interaktif
    await sendInlineKeyboard(chatId, data.IP, data.PORT, filteredISP);

  } catch (error) {
    // Tampilkan pesan error
    await sendTelegramMessage(chatId, `⚠️ Terjadi kesalahan saat memeriksa IP dan port: ${error.message}`);
  }
}



async function handleBmkgCreation(chatId, ip, port, isp) {
  
  const UUIDS = "aaaaaaa1-bbbb-4ccc-accc-eeeeeeeeeee1";  // Perbaiki UUID tanpa backtick yang berlebihan
  const path = `/Free-CF-Proxy-${ip}-${port}`;

  // Konfigurasi Link VPN
  const ssTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.bmkg.xyz:443?encryption=none&type=ws&host=privasi.bmkg.xyz&path=${encodeURIComponent(path)}&security=tls&sni=privasi.bmkg.xyz#${isp}`;
  const ssNTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.bmkg.xyz:80?encryption=none&type=ws&host=privasi.bmkg.xyz&path=${encodeURIComponent(path)}&security=none&sni=privasi.bmkg.xyz#${isp}`;
  const vlessTLS = `vless://${UUIDS}@privasi.bmkg.xyz:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.bmkg.xyz&type=ws&sni=privasi.bmkg.xyz#${isp}`;
  const vlessNTLS = `vless://${UUIDS}@privasi.bmkg.xyz:80?path=${encodeURIComponent(path)}&security=none&host=privasi.bmkg.xyz&type=ws&sni=privasi.bmkg.xyz#${isp}`;
  const trojanTLS = `trojan://${UUIDS}@privasi.bmkg.xyz:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.bmkg.xyz&type=ws&sni=privasi.bmkg.xyz#${isp}`;
  const trojanNTLS = `trojan://${UUIDS}@privasi.bmkg.xyz:80?path=${encodeURIComponent(path)}&security=none&host=privasi.bmkg.xyz&type=ws&sni=privasi.bmkg.xyz#${isp}`;

  
      const message = `
Success Create Vpn Server 
🌍 \`${isp}\` \n⚜️ \`${ip}:${port}\` ⚜️
⚜️ **VPN Configurations** ⚜️

━━━━━━━━━━━━━━━━━━━━━━━
🔗 **VLESS** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${vlessTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${vlessNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Trojan** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${trojanTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${trojanNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **ShadowSocks** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${ssTls}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${ssNTls}
\`\`\`



━━━━━━━━━━━━━━━━━━━━━━━
[WEB FREE VPN](https://privasi.bmkg.xyz)
🚀 **ORDER PREMIUM CONTACT ADMIN**  
[ADMIN TELE](https://t.me/kcepu877)  
[ADMIN WA](https://wa.me/6281335135082)  

`;

  await sendTelegramMessage(chatId, message);
}
 
async function handleNdesoCreation(chatId, ip, port, isp) {
  
  const UUIDS = "aaaaaaa1-bbbb-4ccc-accc-eeeeeeeeeee1";  // Perbaiki UUID tanpa backtick yang berlebihan
  const path = `/Free-CF-Proxy-${ip}-${port}`;

  // Konfigurasi Link VPN
  const ssTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.ndeso.xyz:443?encryption=none&type=ws&host=privasi.ndeso.xyz&path=${encodeURIComponent(path)}&security=tls&sni=privasi.ndeso.xyz#${isp}`;
  const ssNTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.ndeso.xyz:80?encryption=none&type=ws&host=privasi.ndeso.xyz&path=${encodeURIComponent(path)}&security=none&sni=privasi.ndeso.xyz#${isp}`;
  const vlessTLS = `vless://${UUIDS}@privasi.ndeso.xyz:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.ndeso.xyz&type=ws&sni=privasi.ndeso.xyz#${isp}`;
  const vlessNTLS = `vless://${UUIDS}@privasi.ndeso.xyz:80?path=${encodeURIComponent(path)}&security=none&host=privasi.ndeso.xyz&type=ws&sni=privasi.ndeso.xyz#${isp}`;
  const trojanTLS = `trojan://${UUIDS}@privasi.ndeso.xyz:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.ndeso.xyz&type=ws&sni=privasi.ndeso.xyz#${isp}`;
  const trojanNTLS = `trojan://${UUIDS}@privasi.ndeso.xyz:80?path=${encodeURIComponent(path)}&security=none&host=privasi.ndeso.xyz&type=ws&sni=privasi.ndeso.xyz#${isp}`;

  
      const message = `
Success Create Vpn Server 
🌍 \`${isp}\` \n⚜️ \`${ip}:${port}\` ⚜️
⚜️ **VPN Configurations** ⚜️

━━━━━━━━━━━━━━━━━━━━━━━
🔗 **VLESS** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${vlessTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${vlessNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Trojan** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${trojanTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${trojanNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **ShadowSocks** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${ssTls}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${ssNTls}
\`\`\`



━━━━━━━━━━━━━━━━━━━━━━━
[WEB FREE VPN](https://privasi.bmkg.xyz)
🚀 **ORDER PREMIUM CONTACT ADMIN**  
[ADMIN TELE](https://t.me/kcepu877)  
[ADMIN WA](https://wa.me/6281335135082)  

`;

  await sendTelegramMessage(chatId, message);
}
 
async function handleNdeso1Creation(chatId, ip, port, isp) {
  
  const UUIDS = "aaaaaaa1-bbbb-4ccc-accc-eeeeeeeeeee1";  // Perbaiki UUID tanpa backtick yang berlebihan
  const path = `/Free-CF-Proxy-${ip}-${port}`;

  // Konfigurasi Link VPN
  const ssTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.ndeso.web.id:443?encryption=none&type=ws&host=privasi.ndeso.web.id&path=${encodeURIComponent(path)}&security=tls&sni=privasi.ndeso.web.id#${isp}`;
  const ssNTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.ndeso.web.id:80?encryption=none&type=ws&host=privasi.ndeso.web.id&path=${encodeURIComponent(path)}&security=none&sni=privasi.ndeso.web.id#${isp}`;
  const vlessTLS = `vless://${UUIDS}@privasi.ndeso.web.id:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.ndeso.web.id&type=ws&sni=privasi.ndeso.web.id#${isp}`;
  const vlessNTLS = `vless://${UUIDS}@privasi.ndeso.web.id:80?path=${encodeURIComponent(path)}&security=none&host=privasi.ndeso.web.id&type=ws&sni=privasi.ndeso.web.id#${isp}`;
  const trojanTLS = `trojan://${UUIDS}@privasi.ndeso.web.id:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.ndeso.web.id&type=ws&sni=privasi.ndeso.web.id#${isp}`;
  const trojanNTLS = `trojan://${UUIDS}@privasi.ndeso.web.id:80?path=${encodeURIComponent(path)}&security=none&host=privasi.ndeso.web.id&type=ws&sni=privasi.ndeso.web.id#${isp}`;

  
      const message = `
Success Create Vpn Server 
🌍 \`${isp}\` \n⚜️ \`${ip}:${port}\` ⚜️
⚜️ **VPN Configurations** ⚜️

━━━━━━━━━━━━━━━━━━━━━━━
🔗 **VLESS** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${vlessTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${vlessNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Trojan** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${trojanTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${trojanNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **ShadowSocks** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${ssTls}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${ssNTls}
\`\`\`



━━━━━━━━━━━━━━━━━━━━━━━
[WEB FREE VPN](https://privasi.bmkg.xyz)
🚀 **ORDER PREMIUM CONTACT ADMIN**  
[ADMIN TELE](https://t.me/kcepu877)  
[ADMIN WA](https://wa.me/6281335135082)  

`;

  await sendTelegramMessage(chatId, message);
}
 
async function handleTurahCreation(chatId, ip, port, isp) {
  
  const UUIDS = "aaaaaaa1-bbbb-4ccc-accc-eeeeeeeeeee1";  // Perbaiki UUID tanpa backtick yang berlebihan
  const path = `/Free-CF-Proxy-${ip}-${port}`;

  // Konfigurasi Link VPN
  const ssTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.turah.my.id:443?encryption=none&type=ws&host=privasi.turah.my.id&path=${encodeURIComponent(path)}&security=tls&sni=privasi.turah.my.id#${isp}`;
  const ssNTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.turah.my.id:80?encryption=none&type=ws&host=privasi.turah.my.id&path=${encodeURIComponent(path)}&security=none&sni=privasi.turah.my.id#${isp}`;
  const vlessTLS = `vless://${UUIDS}@privasi.turah.my.id:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.turah.my.id&type=ws&sni=privasi.turah.my.id#${isp}`;
  const vlessNTLS = `vless://${UUIDS}@privasi.turah.my.id:80?path=${encodeURIComponent(path)}&security=none&host=privasi.turah.my.id&type=ws&sni=privasi.turah.my.id#${isp}`;
  const trojanTLS = `trojan://${UUIDS}@privasi.turah.my.id:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.turah.my.id&type=ws&sni=privasi.turah.my.id#${isp}`;
  const trojanNTLS = `trojan://${UUIDS}@privasi.turah.my.id:80?path=${encodeURIComponent(path)}&security=none&host=privasi.turah.my.id&type=ws&sni=privasi.turah.my.id#${isp}`;

  
      const message = `
Success Create Vpn Server 
🌍 \`${isp}\` \n⚜️ \`${ip}:${port}\` ⚜️
⚜️ **VPN Configurations** ⚜️

━━━━━━━━━━━━━━━━━━━━━━━
🔗 **VLESS** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${vlessTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${vlessNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Trojan** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${trojanTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${trojanNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **ShadowSocks** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${ssTls}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${ssNTls}
\`\`\`



━━━━━━━━━━━━━━━━━━━━━━━
[WEB FREE VPN](https://privasi.bmkg.xyz)
🚀 **ORDER PREMIUM CONTACT ADMIN**  
[ADMIN TELE](https://t.me/kcepu877)  
[ADMIN WA](https://wa.me/6281335135082)  

`;

  await sendTelegramMessage(chatId, message);
}
 
async function handleNajahCreation(chatId, ip, port, isp) {
  
  const UUIDS = "aaaaaaa1-bbbb-4ccc-accc-eeeeeeeeeee1";  // Perbaiki UUID tanpa backtick yang berlebihan
  const path = `/Free-CF-Proxy-${ip}-${port}`;

  // Konfigurasi Link VPN
  const ssTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.najah.biz.id:443?encryption=none&type=ws&host=privasi.najah.biz.id&path=${encodeURIComponent(path)}&security=tls&sni=privasi.najah.biz.id#${isp}`;
  const ssNTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.najah.biz.id:80?encryption=none&type=ws&host=privasi.najah.biz.id&path=${encodeURIComponent(path)}&security=none&sni=privasi.najah.biz.id#${isp}`;
  const vlessTLS = `vless://${UUIDS}@privasi.najah.biz.id:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.najah.biz.id&type=ws&sni=privasi.najah.biz.id#${isp}`;
  const vlessNTLS = `vless://${UUIDS}@privasi.najah.biz.id:80?path=${encodeURIComponent(path)}&security=none&host=privasi.najah.biz.id&type=ws&sni=privasi.najah.biz.id#${isp}`;
  const trojanTLS = `trojan://${UUIDS}@privasi.najah.biz.id:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.najah.biz.id&type=ws&sni=privasi.najah.biz.id#${isp}`;
  const trojanNTLS = `trojan://${UUIDS}@privasi.najah.biz.id:80?path=${encodeURIComponent(path)}&security=none&host=privasi.najah.biz.id&type=ws&sni=privasi.najah.biz.id#${isp}`;

  
      const message = `
Success Create Vpn Server 
🌍 \`${isp}\` \n⚜️ \`${ip}:${port}\` ⚜️
⚜️ **VPN Configurations** ⚜️

━━━━━━━━━━━━━━━━━━━━━━━
🔗 **VLESS** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${vlessTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${vlessNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Trojan** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${trojanTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${trojanNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **ShadowSocks** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${ssTls}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${ssNTls}
\`\`\`



━━━━━━━━━━━━━━━━━━━━━━━
[WEB FREE VPN](https://privasi.bmkg.xyz)
🚀 **ORDER PREMIUM CONTACT ADMIN**  
[ADMIN TELE](https://t.me/kcepu877)  
[ADMIN WA](https://wa.me/6281335135082)  

`;

  await sendTelegramMessage(chatId, message);
}
 
async function handleCoudproxyCreation(chatId, ip, port, isp) {
  
  const UUIDS = "aaaaaaa1-bbbb-4ccc-accc-eeeeeeeeeee1";  // Perbaiki UUID tanpa backtick yang berlebihan
  const path = `/Free-CF-Proxy-${ip}-${port}`;

  // Konfigurasi Link VPN
  const ssTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.cloudproxyip.my.id:443?encryption=none&type=ws&host=privasi.cloudproxyip.my.id&path=${encodeURIComponent(path)}&security=tls&sni=privasi.cloudproxyip.my.id#${isp}`;
  const ssNTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.cloudproxyip.my.id:80?encryption=none&type=ws&host=privasi.cloudproxyip.my.id&path=${encodeURIComponent(path)}&security=none&sni=privasi.cloudproxyip.my.id#${isp}`;
  const vlessTLS = `vless://${UUIDS}@privasi.cloudproxyip.my.id:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.cloudproxyip.my.id&type=ws&sni=privasi.cloudproxyip.my.id#${isp}`;
  const vlessNTLS = `vless://${UUIDS}@privasi.cloudproxyip.my.id:80?path=${encodeURIComponent(path)}&security=none&host=privasi.cloudproxyip.my.id&type=ws&sni=privasi.cloudproxyip.my.id#${isp}`;
  const trojanTLS = `trojan://${UUIDS}@privasi.cloudproxyip.my.id:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.cloudproxyip.my.id&type=ws&sni=privasi.cloudproxyip.my.id#${isp}`;
  const trojanNTLS = `trojan://${UUIDS}@privasi.cloudproxyip.my.id:80?path=${encodeURIComponent(path)}&security=none&host=privasi.cloudproxyip.my.id&type=ws&sni=privasi.cloudproxyip.my.id#${isp}`;

  
      const message = `
Success Create Vpn Server 
🌍 \`${isp}\` \n⚜️ \`${ip}:${port}\` ⚜️
⚜️ **VPN Configurations** ⚜️

━━━━━━━━━━━━━━━━━━━━━━━
🔗 **VLESS** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${vlessTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${vlessNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Trojan** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${trojanTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${trojanNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **ShadowSocks** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${ssTls}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${ssNTls}
\`\`\`



━━━━━━━━━━━━━━━━━━━━━━━
[WEB FREE VPN](https://privasi.bmkg.xyz)
🚀 **ORDER PREMIUM CONTACT ADMIN**  
[ADMIN TELE](https://t.me/kcepu877)  
[ADMIN WA](https://wa.me/6281335135082)  

`;

  await sendTelegramMessage(chatId, message);
}
 
async function handleXhamsterCreation(chatId, ip, port, isp) {
  
  const UUIDS = "aaaaaaa1-bbbb-4ccc-accc-eeeeeeeeeee1";  // Perbaiki UUID tanpa backtick yang berlebihan
  const path = `/Free-CF-Proxy-${ip}-${port}`;

  // Konfigurasi Link VPN
  const ssTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.xhamster.biz.id:443?encryption=none&type=ws&host=privasi.xhamster.biz.id&path=${encodeURIComponent(path)}&security=tls&sni=privasi.xhamster.biz.id#${isp}`;
  const ssNTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.xhamster.biz.id:80?encryption=none&type=ws&host=privasi.xhamster.biz.id&path=${encodeURIComponent(path)}&security=none&sni=privasi.xhamster.biz.id#${isp}`;
  const vlessTLS = `vless://${UUIDS}@privasi.xhamster.biz.id:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.xhamster.biz.id&type=ws&sni=privasi.xhamster.biz.id#${isp}`;
  const vlessNTLS = `vless://${UUIDS}@privasi.xhamster.biz.id:80?path=${encodeURIComponent(path)}&security=none&host=privasi.xhamster.biz.id&type=ws&sni=privasi.xhamster.biz.id#${isp}`;
  const trojanTLS = `trojan://${UUIDS}@privasi.xhamster.biz.id:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.xhamster.biz.id&type=ws&sni=privasi.xhamster.biz.id#${isp}`;
  const trojanNTLS = `trojan://${UUIDS}@privasi.xhamster.biz.id:80?path=${encodeURIComponent(path)}&security=none&host=privasi.xhamster.biz.id&type=ws&sni=privasi.xhamster.biz.id#${isp}`;

  
      const message = `
Success Create Vpn Server 
🌍 \`${isp}\` \n⚜️ \`${ip}:${port}\` ⚜️
⚜️ **VPN Configurations** ⚜️

━━━━━━━━━━━━━━━━━━━━━━━
🔗 **VLESS** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${vlessTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${vlessNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Trojan** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${trojanTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${trojanNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **ShadowSocks** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${ssTls}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${ssNTls}
\`\`\`



━━━━━━━━━━━━━━━━━━━━━━━
[WEB FREE VPN](https://privasi.bmkg.xyz)
🚀 **ORDER PREMIUM CONTACT ADMIN**  
[ADMIN TELE](https://t.me/kcepu877)  
[ADMIN WA](https://wa.me/6281335135082)  

`;

  await sendTelegramMessage(chatId, message);
}
 
async function handleCepuCreation(chatId, ip, port, isp) {
  
  const UUIDS = "aaaaaaa1-bbbb-4ccc-accc-eeeeeeeeeee1";  // Perbaiki UUID tanpa backtick yang berlebihan
  const path = `/Free-CF-Proxy-${ip}-${port}`;

  // Konfigurasi Link VPN
  const ssTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.cepu.us.kg:443?encryption=none&type=ws&host=privasi.cepu.us.kg&path=${encodeURIComponent(path)}&security=tls&sni=privasi.cepu.us.kg#${isp}`;
  const ssNTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.cepu.us.kg:80?encryption=none&type=ws&host=privasi.cepu.us.kg&path=${encodeURIComponent(path)}&security=none&sni=privasi.cepu.us.kg#${isp}`;
  const vlessTLS = `vless://${UUIDS}@privasi.cepu.us.kg:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.cepu.us.kg&type=ws&sni=privasi.cepu.us.kg#${isp}`;
  const vlessNTLS = `vless://${UUIDS}@privasi.cepu.us.kg:80?path=${encodeURIComponent(path)}&security=none&host=privasi.cepu.us.kg&type=ws&sni=privasi.cepu.us.kg#${isp}`;
  const trojanTLS = `trojan://${UUIDS}@privasi.cepu.us.kg:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.cepu.us.kg&type=ws&sni=privasi.cepu.us.kg#${isp}`;
  const trojanNTLS = `trojan://${UUIDS}@privasi.cepu.us.kg:80?path=${encodeURIComponent(path)}&security=none&host=privasi.cepu.us.kg&type=ws&sni=privasi.cepu.us.kg#${isp}`;

  
      const message = `
Success Create Vpn Server 
🌍 \`${isp}\` \n⚜️ \`${ip}:${port}\` ⚜️
⚜️ **VPN Configurations** ⚜️

━━━━━━━━━━━━━━━━━━━━━━━
🔗 **VLESS** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${vlessTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${vlessNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Trojan** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${trojanTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${trojanNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **ShadowSocks** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${ssTls}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${ssNTls}
\`\`\`



━━━━━━━━━━━━━━━━━━━━━━━
[WEB FREE VPN](https://privasi.bmkg.xyz)
🚀 **ORDER PREMIUM CONTACT ADMIN**  
[ADMIN TELE](https://t.me/kcepu877)  
[ADMIN WA](https://wa.me/6281335135082)  

`;

  await sendTelegramMessage(chatId, message);
}
 
async function handleKereCreation(chatId, ip, port, isp) {
  
  const UUIDS = "aaaaaaa1-bbbb-4ccc-accc-eeeeeeeeeee1";  // Perbaiki UUID tanpa backtick yang berlebihan
  const path = `/Free-CF-Proxy-${ip}-${port}`;

  // Konfigurasi Link VPN
  const ssTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.kere.us.kg:443?encryption=none&type=ws&host=privasi.kere.us.kg&path=${encodeURIComponent(path)}&security=tls&sni=privasi.kere.us.kg#${isp}`;
  const ssNTls = `ss://${btoa(`none:${UUIDS}`)}@privasi.kere.us.kg:80?encryption=none&type=ws&host=privasi.kere.us.kg&path=${encodeURIComponent(path)}&security=none&sni=privasi.kere.us.kg#${isp}`;
  const vlessTLS = `vless://${UUIDS}@privasi.kere.us.kg:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.kere.us.kg&type=ws&sni=privasi.kere.us.kg#${isp}`;
  const vlessNTLS = `vless://${UUIDS}@privasi.kere.us.kg:80?path=${encodeURIComponent(path)}&security=none&host=privasi.kere.us.kg&type=ws&sni=privasi.kere.us.kg#${isp}`;
  const trojanTLS = `trojan://${UUIDS}@privasi.kere.us.kg:443?path=${encodeURIComponent(path)}&security=tls&host=privasi.kere.us.kg&type=ws&sni=privasi.kere.us.kg#${isp}`;
  const trojanNTLS = `trojan://${UUIDS}@privasi.kere.us.kg:80?path=${encodeURIComponent(path)}&security=none&host=privasi.kere.us.kg&type=ws&sni=privasi.kere.us.kg#${isp}`;

  
      const message = `
Success Create Vpn Server 
🌍 \`${isp}\` \n⚜️ \`${ip}:${port}\` ⚜️
⚜️ **VPN Configurations** ⚜️

━━━━━━━━━━━━━━━━━━━━━━━
🔗 **VLESS** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${vlessTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${vlessNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Trojan** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${trojanTLS}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${trojanNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **ShadowSocks** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS** : 
\`\`\`
${ssTls}
\`\`\`
✅ **Non-TLS** : 
\`\`\`
${ssNTls}
\`\`\`



━━━━━━━━━━━━━━━━━━━━━━━
[WEB FREE VPN](https://privasi.bmkg.xyz)
🚀 **ORDER PREMIUM CONTACT ADMIN**  
[ADMIN TELE](https://t.me/kcepu877)  
[ADMIN WA](https://wa.me/6281335135082)  

`;

  await sendTelegramMessage(chatId, message);
}
 
 
async function handleXnxxxCreation(chatId, ip, port, isp, domain = 'privasi.zifxoyfpuf0uf0ycphcoyf0684wd.us.kg') {
  const UUIDS = "aaaaaaa1-bbbb-4ccc-accc-eeeeeeeeeee1";
  const path = `/Free-CF-Proxy-${ip}-${port}`;

  // Gunakan domain yang dipilih, atau fallback ke default jika tidak ada
  const host = domain === 'nowildcard' ? 'privasi.zifxoyfpuf0uf0ycphcoyf0684wd.us.kg' : domain;

  // Konfigurasi Link VPN
  const ssTls = `ss://${btoa(`none:${UUIDS}`)}@${host}:443?encryption=none&type=ws&host=${host}&path=${encodeURIComponent(path)}&security=tls&sni=${host}#${isp}`;
  const ssNTls = `ss://${btoa(`none:${UUIDS}`)}@${host}:80?encryption=none&type=ws&host=${host}&path=${encodeURIComponent(path)}&security=none&sni=${host}#${isp}`;
  const vlessTLS = `vless://${UUIDS}@${host}:443?path=${encodeURIComponent(path)}&security=tls&host=${host}&type=ws&sni=${host}#${isp}`;
  const vlessNTLS = `vless://${UUIDS}@${host}:80?path=${encodeURIComponent(path)}&security=none&host=${host}&type=ws&sni=${host}#${isp}`;
  const trojanTLS = `trojan://${UUIDS}@${host}:443?path=${encodeURIComponent(path)}&security=tls&host=${host}&type=ws&sni=${host}#${isp}`;
  const trojanNTLS = `trojan://${UUIDS}@${host}:80?path=${encodeURIComponent(path)}&security=none&host=${host}&type=ws&sni=${host}#${isp}`;

  // Pesan konfigurasi
  const message = `
Success Create VPN Server  
🌍 ISP: \`${isp}\`  
⚜️ IP: \`${ip}:${port}\` ⚜️  
🌐 Domain: \`${host}\`  

━━━━━━━━━━━━━━━━━━━━━━━
🔗 **VLESS** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS**:  
\`\`\`
${vlessTLS}
\`\`\`
✅ **Non-TLS**:  
\`\`\`
${vlessNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Trojan** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS**:  
\`\`\`
${trojanTLS}
\`\`\`
✅ **Non-TLS**:  
\`\`\`
${trojanNTLS}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
🔗 **ShadowSocks** 
━━━━━━━━━━━━━━━━━━━━━━━
✅ **TLS**:  
\`\`\`
${ssTls}
\`\`\`
✅ **Non-TLS**:  
\`\`\`
${ssNTls}
\`\`\`


━━━━━━━━━━━━━━━━━━━━━━━
[WEB FREE VPN](https://privasi.bmkg.xyz)  
🚀 **ORDER PREMIUM CONTACT ADMIN**  
[ADMIN TELE](https://t.me/kcepu877)  
[ADMIN WA](https://wa.me/6281335135082)  
`;

  await sendTelegramMessage(chatId, message);
}

 
async function sendXnxxxButtons(chatId, ip, port, isp) {
  const wildcards = [
    'ava.game.naver.com',
    'business.blibli.com',
    'graph.instagram.com',
    'quiz.int.vidio.com',
    'live.iflix.com',
    'support.zoom.us',
    'blog.webex.com',
    'investors.spotify.com',
    'cache.netflix.com',
    'zaintest.vuclip.com',
    'ads.ruangguru.com',
    'api.midtrans.com',
    'investor.fb.com',
    'bakrie.ac.id'
  ];

  // Buat tombol wildcard secara otomatis
  const buttons = {
    inline_keyboard: wildcards.map(domain => [
      { text: domain, callback_data: `create_xnxxx|${ip}|${port}|${isp}|${domain}` }
    ])
  };

  // Tambahkan tombol No Wildcard di bagian bawah
  buttons.inline_keyboard.push([
    { text: "No Wildcard", callback_data: `create_xnxxx|${ip}|${port}|${isp}|nowildcard` }
  ]);

  // Kirim pesan dengan tombol ke Telegram
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Pilih Wildcard atau No Wildcard untuk:\n🌍 IP: \`${ip}\`\n🔌 Port: \`${port}\`\n🏷️ ISP: \`${isp}\``,
        parse_mode: 'Markdown',
        reply_markup: buttons
      }),
    });

    if (!response.ok) {
      console.error('Gagal mengirim tombol:', response.statusText);
    } else {
      console.log('Tombol berhasil dikirim!');
    }
  } catch (error) {
    console.error('Error mengirim tombol:', error);
  }
}

 

async function sendInlineKeyboard(chatId, ip, port, isp) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'Pilih opsi berikut untuk membuat VPN Tunnel:',
        reply_markup: {
          inline_keyboard: [

            [
              { text: '🌐 bmkg.xyz', callback_data: `create_bmkg|${ip}|${port}|${isp}` },
            ],
                        [
              { text: '🌐 Server ndeso.xyz', callback_data: `create_ndeso|${ip}|${port}|${isp}` },
            ],
                        [
              { text: '🌐 ndeso.web.id', callback_data: `create_ndeso1|${ip}|${port}|${isp}` },
            ],
                        [
              { text: '🌐 turah.my.id', callback_data: `create_turah|${ip}|${port}|${isp}` },
            ],
                        [
              { text: '🌐 najah.biz.id', callback_data: `create_najah|${ip}|${port}|${isp}` },
            ],
                        [
              { text: '🌐 cloudproxyip.my.id', callback_data: `create_coudproxy|${ip}|${port}|${isp}` },
            ],
                        [
              { text: '🌐 xhamster.biz.id', callback_data: `create_xhamster|${ip}|${port}|${isp}` },
            ],
                        [
              { text: '🌐 cepu.us.kg', callback_data: `create_cepu|${ip}|${port}|${isp}` },
            ],
                        [
              { text: '🌐 kere.us.kg', callback_data: `create_kere|${ip}|${port}|${isp}` },
            ],
                        [
              { text: '🌐 zifxoyfpuf0uf0ycphcoyf0684wd.us.kg', callback_data: `send_xnxxx_buttons|${ip}|${port}|${isp}` },
            ],
          ],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send inline keyboard:', errorText);
    } else {
      console.log('Inline keyboard sent successfully.');
    }
  } catch (error) {
    console.error('Error sending inline keyboard:', error);
  }
}



// Constant
