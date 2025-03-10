
const menuMember = (ctx,role,credit) => {
    if (!ctx.session) {
        ctx.session = {}; // Pastikan sesi ada
    }
   
    ctx.session.previousMenu = 'main-member';
    return ctx.reply(`👋 Selamat datang! Pilih menu:\n\n→ 🪪 Username: ${ctx.from.username}\n→ 🏢 Role: ${role}\n→ 💲 My Balance: Rp.${credit}`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📖 Fitur', callback_data: 'fitur' }],
                [{ text: '🚩 Report', callback_data: 'report' }],
                [{ text: '👤 My Status', callback_data: 'status' }]
            ]
        }
    });
}
const menuAdmin = (ctx,role,credit) => {
    if (!ctx.session) {
        ctx.session = {}; // Pastikan sesi ada
    }
    ctx.session.previousMenu = 'main-admin';
    return ctx.reply(`👋 Selamat datang Admin! Pilih Menu: \n\n→ 🪪 Username: ${ctx.from.username}\n→ 🏢 Role: ${role}\n→ 💲 My Balance: Rp.${credit}`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📢 Broadcast', callback_data: 'bc' }],
                [{ text: '⚠️ Warn', callback_data: 'warn' }],
                [{ text: '💰 Transfer', callback_data: 'transfer' }],
                [{ text: '📖 Fitur', callback_data: 'fitur' }]
            ]
        }
    });
}
const goBack = (ctx) => {
    if (!ctx.session) {
        ctx.session = {}; // Pastikan sesi ada
    }
    const previousMenu = ctx.session.previousMenu;
    if (previousMenu === 'main-member') {
        return menuMember(ctx, 'Member');  // Kembali ke menu utama
    } else if(previousMenu === 'main-admin'){
        return menuAdmin(ctx, 'Admin')
    }
    return ctx.reply('Tidak ada menu sebelumnya yang disimpan.');
};
const getFitur = (ctx) => {
    return ctx.reply(`👋 Berikuat adalah List Fitur yang ada di Bot ini: `, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '1️⃣ Downloader', callback_data: 'downloader' }],
                [{ text: '2️⃣ Information', callback_data: 'information' }],
                [{ text: '3️⃣ AniManga', callback_data: 'animemanga' }],
                [{ text: '4️⃣ Game', callback_data: 'game' }],
                [{ text: '🔙 Back', callback_data: 'back'}]
            ]
        }
    });
}
const getReport = (ctx) => {
    return ctx.reply(`👋 Kirim pesan yang ingin anda laporkan kepada admin: `, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'back'}]
            ]
        }
    });
}
const getDownloader = (ctx) => {
    return ctx.reply(`📎 Ingin Download apa hari ini ? `, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '1️⃣ Youtube', callback_data: 'yt' }],
                [{ text: '2️⃣ Tiktok(NoWM)', callback_data: 'tt' }],
                [{ text: '3️⃣ Facebook', callback_data: 'fb' }],
                [{ text: '🔙 Back', callback_data: 'back'}]
            ]
        }
    });
}
const getInformation = (ctx) => {
    return ctx.reply(`👋 Berikuat adalah List Fitur yang ada di Bot ini: `, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '1️⃣ Cuaca', callback_data: 'cuaca' }],
                [{ text: '2️⃣ Gempa Terbaru[Acak Tedekat]', callback_data: 'gempanew' }],
                [{ text: '3️⃣ Wikipedia', callback_data: 'wikped' }],
                [{ text: '🔙 Back', callback_data: 'back'}]
            ]
        }
    });
}
const getAnimanga = (ctx) => {
    return ctx.reply(`👋 Berikuat adalah List Fitur yang ada di Bot ini: `, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '1️⃣ Anime', callback_data: 'anime' }],
                [{ text: '2️⃣ Chara Search', callback_data: 'charasearch' }],
                [{ text: '3️⃣ Manga Search', callback_data: 'mangasearch' }],
                [{ text: '4️⃣ Random Waifu', callback_data: 'randomwaifu'}],
                [{ text: '🔙 Back', callback_data: 'back'}]
            ]
        }
    });
}
const getGame = (ctx) => {
    return ctx.reply(`👋 Berikuat adalah List Fitur yang ada di Bot ini: `, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '1️⃣ Slot', callback_data: 'selot' }]
                [{ text: '🔙 Back', callback_data: 'back'}]
            ]
        }
    });
}
const bcUmum = (ctx, getIdAll, text) => {
    for (const target of getIdAll) {
     ctx.sendMessage(target, `─────| 📢 Pengumuman |─────\n${text}`);
    }
}
module.exports = {menuAdmin, menuMember, goBack, getFitur,getReport, getDownloader, getInformation, getAnimanga, getGame, bcUmum}
