const { Telegraf, Markup, session } = require('telegraf');
const { google } = require('googleapis');
const func = require('./function');
const apiku = require('./api.json')
// === Konfigurasi Bot Telegram ===
const bot = new Telegraf('7783365165:AAH3ASxL-stQ_0I33JaRX6mR9KlGSGxlIIM'); // Ganti dengan token bot Anda


bot.use(session());
bot.use((ctx, next) => {
    if (!ctx.session) ctx.session = { history: [], waitingForWarn: false, waitingForChannelId: false, waitingForGroupId: false, waitingFor: null, previousMenu: null};
    return next();
});

function saveHistory(ctx, menu) {
    ctx.session.history.push(menu);
}

// === Konfigurasi Google Sheets API ===
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = '1Qmp-QKdT55Dn13pX1Oixuib-ATW2idVXg1BosCmolmM'; // Ganti dengan ID Spreadsheet Anda

// === Fungsi Cek Admin ===
async function isAdmin(userId) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Admins!A:A'
        });
        const adminIds = res.data.values ? res.data.values.flat() : [];
        return adminIds.includes(userId.toString());
    } catch (error) {
        console.error('Gagal memeriksa admin:', error);
        return false;
    }
}
// === Fungsi Cek Member ===
async function isMember(userId) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Members!A:A'
        });
        const memberIds = res.data.values ? res.data.values.flat() : [];
        return memberIds.includes(userId.toString());
    } catch (error) {
        console.error('Gagal memeriksa member:', error);
        return false;
    }
}
function handleBack(ctx) {
    ctx.session.history.pop(); // Hapus menu saat ini
    const previousMenu = ctx.session.history.pop(); // Ambil menu sebelumnya

    if (previousMenu) {
        bot.commands[previousMenu]?.(ctx); // Jalankan ulang command sebelumnya
    } else {
        ctx.reply('🔙 Anda sudah berada di menu utama.');
    }
}

// === Fungsi untuk Mengambil Daftar Member dari Google Sheets ===
async function getAllMembers() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Members!A:A', // Mengambil semua User ID
        });
        return res.data.values ? res.data.values.flat() : [];
    } catch (error) {
        console.error('Gagal mengambil data member:', error);
        return [];
    }
}
async function getAllChannels() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Channels!A:A',
        });
        return res.data.values ? res.data.values.flat() : [];
    } catch (error) {
        console.error('Gagal mengambil data channel:', error);
        return [];
    }
}
async function saveIDToSheet(sheetName, id) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A:A`,
            valueInputOption: 'RAW',
            resource: {
                values: [[id]]
            }
        });
        return true;
    } catch (error) {
        console.error(`Gagal menyimpan ID ke ${sheetName}:`, error);
        return false;
    }
}

async function getAllGroups() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Groups!A:A',
        });
        return res.data.values ? res.data.values.flat() : [];
    } catch (error) {
        console.error('Gagal mengambil data group:', error);
        return [];
    }
}

// === Fungsi Menambahkan Laporan Member ===
async function addReport(username, message) {
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Reports!A:B',
        valueInputOption: 'RAW',
        resource: { values: [[username, message]] },
    });
}
// === Fungsi Cek User Terdaftar ===
async function isRegistered(userId) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Members!A:A'
        });
        const userIds = res.data.values ? res.data.values.flat() : [];
        return userIds.includes(userId.toString());
    } catch (error) {
        console.error('Gagal memeriksa pendaftaran:', error);
        return false;
    }
}

async function registerUser(ctx) {
    try {
        const { id, first_name, username } = ctx.from;
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Members!A:C',
            valueInputOption: 'RAW',
            resource: {
                values: [[id, first_name, username || '-']]
            }
        });
        ctx.reply('✅ Pendaftaran berhasil! Anda sekarang dapat menggunakan bot.');
    } catch (error) {
        console.error('Gagal mendaftarkan user:', error);
        ctx.reply('❌ Terjadi kesalahan saat mendaftar. Coba lagi.');
    }
}

// === Fungsi Member: Cek Status ===
async function getStatus(userId) {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Members!A:C',
    });
    const data = res.data.values || [];
    const member = data.find((row) => row[0] === userId.toString());

    return member ? `Status Anda: ${member[2]}` : 'Anda belum terdaftar.';
}
// === Fungsi Tambah Channel ID ===
async function addChannelId(channelId) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Channels!A:A',
            valueInputOption: 'RAW',
            resource: { values: [[channelId]] }
        });
    } catch (error) {
        console.error('Gagal menambahkan ID Channel:', error);
    }
}

// === Fungsi Tambah Group ID ===
async function addGroupId(groupId) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Groups!A:A',
            valueInputOption: 'RAW',
            resource: { values: [[groupId]] }
        });
    } catch (error) {
        console.error('Gagal menambahkan ID Group:', error);
    }
}

// === Fungsi Admin: Memberikan Peringatan ===
async function warnUser(userId, username) {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Warnings!A:C',
    });
    const data = res.data.values || [];
    const index = data.findIndex((row) => row[0] === userId.toString());

    if (index !== -1) {
        const currentWarnings = parseInt(data[index][2]) + 1;
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `Warnings!C${index + 1}`,
            valueInputOption: 'RAW',
            resource: { values: [[currentWarnings]] },
        });
        return `Pengguna ${username} telah diperingatkan. Total peringatan: ${currentWarnings}`;
    } else {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Warnings!A:C',
            valueInputOption: 'RAW',
            resource: { values: [[userId, username, 1]] },
        });
        return `Pengguna ${username} telah diberikan peringatan pertama.`;
    }
}
// === Middleware Cek Pendaftaran ===
bot.use(async (ctx, next) => {
    // Mengecualikan middleware untuk proses registrasi
    const exemptedCommands = ['register', '/start'];
    const isRegisterAction = ctx.callbackQuery?.data === 'register';
    const isExemptedCommand = exemptedCommands.includes(ctx.message?.text);

    if (!isRegisterAction && !isExemptedCommand) {
        const userId = ctx.from.id;
        const registered = await isRegistered(userId);

        if (!registered) {
            return ctx.reply('⚠️ Anda belum terdaftar. Silakan daftar terlebih dahulu:', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📋 Register', callback_data: 'register' }]
                    ]
                }
            });
        }
    }
    return next(); // Lanjutkan jika sudah terdaftar atau sedang mendaftar
});
// === Menu Utama Berdasarkan Status ===
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    ctx.session.previousMenu = 'start';

    if (await isAdmin(userId)) {
        ctx.reply('👋 Selamat datang Admin! Pilih menu:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '➕ Add', callback_data: 'add' }],
                    [{ text: '📢 Broadcast', callback_data: 'bc' }],
                    [{ text: '⚠️ Warn', callback_data: 'warn' }],
                    [{ text: '📖 Fitur', callback_data: 'fitur' }]
                ]
            }
        });
    } else if (await isMember(userId)) {
        ctx.reply('👋 Selamat datang Member! Pilih menu:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📖 Fitur', callback_data: 'fitur' }],
                    [{ text: '🚩 Report', callback_data: 'report' }],
                    [{ text: '👤 My Status', callback_data: 'status' }]
                ]
            }
        });
    } else {
        ctx.reply('⚠️ Anda belum terdaftar. Silakan daftar terlebih dahulu:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📋 Register', callback_data: 'register' }]
                ]
            }
        });
    }
});

bot.command('help', async (ctx) => {
    let userId = ctx.message.from.id;

    if (await isMember(userId)) {
        return ctx.reply(
            "📖 Panduan Penggunaan Bot:\n\n" +
            "✅ `/start` - Menampilkan menu utama\n" +
            "✅ `/help` - Menampilkan panduan ini\n" +
            "✅ `/profile` - Menampilkan profil Anda\n\n" +
            "Gunakan tombol di bawah untuk navigasi cepat:",
          
        );
    } else {
        return ctx.reply(
            "Anda belum terdaftar! Silakan klik tombol di bawah untuk register.",
            Markup.inlineKeyboard([
                Markup.button.url("📝 Register", `https://t.me/${ctx.botInfo.username}?start=register`)
            ])
        );
    }
});
bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;
    if (action === 'register') {
        await registerUser(ctx);
    }
    if (action === 'back' && ctx.session.previousMenu) {
        ctx.session.waitingFor = null;
        ctx.session.previousMenu = null;
        return bot.start(ctx);
    }
    
    ctx.session.previousMenu = action;



    switch (action) {
        case 'add':
            ctx.reply('Pilih jenis ID yang ingin ditambahkan:', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '➕ Tambahkan ID Channels', callback_data: 'add_channel' }],
                        [{ text: '➕ Tambahkan ID Groups', callback_data: 'add_group' }],
                        [{ text: '⬅️ Back', callback_data: 'back' }]
                    ]
                }
            });
            break;
        case 'add_channel':
            ctx.session.waitingFor = 'channel';
            ctx.reply('📥 Masukkan ID Channel yang ingin ditambahkan:');
            break;
        case 'add_group':
            ctx.session.waitingFor = 'group';
            ctx.reply('📥 Masukkan ID Group yang ingin ditambahkan:');
            break;
        case 'bc':
            if (await isAdmin(ctx.from.id)) {
                ctx.session.waitingFor = 'broadcast';
                ctx.reply('📢 Kirimkan pesan yang ingin dibroadcast:', {
                    reply_markup: { inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'back' }]] }
                });
                
            } else {
                ctx.reply('❌ Anda tidak memiliki akses.');
            }
            break;
        case 'warn':
            ctx.session.waitingFor = 'warn';
            ctx.reply('⚠️ Kirimkan ID user yang ingin diperingatkan:');
            break;
        case 'fitur':
            ctx.reply('📖 List Command/Fitur dari Bot', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🍡 Random Waifu Image', callback_data: 'waifu' }],
                        [{ text: 'ℹ️ Info Gempa Terbaru', callback_data: 'gempa'}],
                        [{ text: '🌍 Facebook Downloader', callback_data: 'fb'}],
                        [{ text: 'Instagram Downloader', callback_data: 'ig'}]
                    ]
                }
            });
            break;
        case 'report':
            ctx.reply('🚩 Kirim pesan laporan Anda.');
            break;
        case 'status':
            ctx.reply(`👤 Status Anda:
- Nama: ${ctx.from.first_name}
- Username: @${ctx.from.username || '-'}`);
            break;

        case 'waifu':
            let waifu = await func.scrapeData(apiku.waifu);
            ctx.sendPhoto(waifu.url, { caption: "Sukses Mengirim Waifu Secara Acak." })
        break
        case 'gempa':
            let gempa = await func.textGempa()
            let imgempa = await func.imgGempa()
            ctx.sendPhoto(imgempa, { caption : gempa})
        break
        case 'fb':
            ctx.session.waitingFor = 'fb';
            ctx.reply("📥 Masukan URL yang ingin di unduh!");
        break
        case 'ig':
            ctx.session.waitingFor = 'ig';
            ctx.reply("📥 Masukan URL yang ingin di unduh!");
        break
        default:
            ctx.reply('❌ Perintah tidak dikenal.');
    }

    ctx.answerCbQuery();
});


  // === Handler Teks ===
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;

    if (ctx.session.waitingFor === 'channel') {
        await addChannelId(text);
        ctx.reply(`✅ ID Channel ${text} berhasil ditambahkan.`);
    } else if (ctx.session.waitingFor === 'group') {
        await addGroupId(text);
        ctx.reply(`✅ ID Group ${text} berhasil ditambahkan.`);
    } else if (ctx.session.waitingFor === 'fb'){
        let dataVideo = await func.fbDL(text)
        ctx.replyWithVideo(dataVideo, { caption: "Sukses Download!!"})
    } else if (ctx.session.waitingFor === 'ig'){
        let data = await func.igDL(text)
        ctx.reply("✅ Sukses Mengambil Data dari Instagram dan sedang mengirim Media")
        if (data && Array.isArray(data.result) && data.result.length > 0) {
            for (let i = 0; i < data.result.length; i++) {
                const url = data.result[i];

                if (data.type === 'video') {
                    await ctx.replyWithVideo({ url });
                } else if (data.type === 'photo') {
                    await ctx.replyWithPhoto({ url });
                }
                
            }
        } else {
            ctx.reply('Gagal mengambil data. Pastikan URL benar.');
        }
        
    } else if (ctx.session.waitingFor === 'broadcast') {
        const members = await getAllMembers();
        const channels = await getAllChannels();
        const groups = await getAllGroups();
        for (const userId of [...members, ...channels, ...groups]) {
            try {
                await bot.telegram.sendMessage(userId, `📢 Pesan broadcast: \r\n**${text}**`);
            } catch (error) {
                console.error(`Gagal mengirim ke ${userId}:`, error);
            }
        }
        ctx.reply('✅ Broadcast berhasil dikirim!');
    } else if (ctx.session.waitingFor === 'warn') {
        ctx.reply(`⚠️ Peringatan dikirimkan ke ID: ${text}`);
    }

    ctx.session.waitingFor = null;
});



// === Menjalankan Bot ===
bot.launch();
console.log('Bot sedang berjalan...');
