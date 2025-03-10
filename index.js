const { Telegraf, Markup, session } = require('telegraf');
const msgHandler = require('./handler');
const func = require('./function');
const bad = require('./bad');
const config = require('./config')
const apiList = require('./api.json')
const axios = require('axios')
// === Konfigurasi Bot Telegram ===
const bot = new Telegraf('7783365165:AAH3ASxL-stQ_0I33JaRX6mR9KlGSGxlIIM'); // Ganti dengan token bot Anda

bot.use(session());
bot.use((ctx, next) => {
    // Waiting For 
    if (!ctx.session) ctx.session = { history: [], waitingForWarn: false, waitingForChannelId: false, waitingForGroupId: false, waitingFor: null, previousMenu: null};
    // Filter Toxic
    if (ctx.message?.text) {
        const messageText = ctx.message.text.toLowerCase();
        if (bad.some((word) => messageText.includes(word))) {
          ctx.deleteMessage();
          return ctx.reply("Jangan gunakan kata kasar! 🚫");
        }
      }
    // Log Utama
    if (ctx.message?.text) {
        console.log(`User ${ctx.from.id || ctx.from.id} mengirim: ${ctx.message.text}`);
    }
    // Mengecek apakah pesan adalah callback (misalnya tombol inline)
    else if (ctx.callbackQuery) {
        console.log(`User ${ctx.from.id || ctx.from.id} menekan tombol dengan data: ${ctx.callbackQuery.data}`);
    }
    
    return next();
  });


bot.start(async (ctx) => {
    
    const userId = ctx.from.id; // User ID asli di private chat
    const args = ctx.message.text.split(" "); // Tangkap parameter start
    let originalUserId = userId; // Default ke user ID di private chat

    if (args.length > 1 && args[1].startsWith("register_")) {
        originalUserId = args[1].replace("register_", ""); // Ambil user ID dari grup
    }

    // Cek apakah user sudah terdaftar
    const isAdmin = await func.isAdmin(originalUserId);
    const isMember = await func.isMember(originalUserId);
    const isPrivate = ctx.chat.type === 'private';


   /* Mengecek Serial ID sudah terdaftar atau belum */
   if (!isMember && !isAdmin) {
    // Jika belum terdaftar, beri tombol untuk daftar
    return ctx.reply('⚠️ Anda belum terdaftar. Silakan daftar dengan menekan tombol di bawah:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📋 Daftar Sekarang', callback_data: `confirm_register_${originalUserId}` }]
            ]
        }
    });
}


    // Jika sudah terdaftar, tampilkan menu
    if (isAdmin) {
        
    const creditAdmin = await func.getCreditAdmin(ctx,userId)
        await msgHandler.menuAdmin(ctx, "Admin", creditAdmin);
    } else {
        const credit = await func.getCredit(ctx, userId);
        await msgHandler.menuMember(ctx, "Member",credit);
    }
});

  bot.help((ctx) => {
    ctx.reply("📌 Daftar Perintah yang Tersedia:\n\n" +
              "🔹 /start - Mulai bot dan Menampilkan Menu\n" +
              "🔹 /help - Menampilkan daftar perintah\n");
  });
  bot.command('resetcredit', async(ctx)=>{
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ').slice(1); // Mengambil argumen setelah perintah /addadmin
    
    if (!args) {
        return ctx.reply("⚠️ Masukkan password untuk menambahkan admin!\n\nGunakan: `/addadmin {passwrpd}`")
    }

    const password = args[0];

    if (password !== "1288") {
        return ctx.reply("❌ Password salah! Anda tidak memiliki izin untuk menambahkan admin.");
    }

    const sukses = await func.resetCredit(userId);


    if (sukses) {
        ctx.reply("✅ Sukses! Anda telah mereset Credit.");
    } else {
        ctx.reply("❌ Gagal menambahkan Anda sebagai Admin.");
    }
      
    
  })
  bot.command('addadmin', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1); // Mengambil argumen setelah perintah /addadmin
    
    if (!args) {
        return ctx.reply("⚠️ Masukkan password untuk menambahkan admin!\n\nGunakan: `/addadmin {passwrpd}`")
    }

    const password = args[0];

    if (password !== "1288") {
        return ctx.reply("❌ Password salah! Anda tidak memiliki izin untuk menambahkan admin.");
    }

    // Jika password benar, tambahkan admin
    const success = await func.addAdmin(ctx, ctx.from.id, ctx.from.first_name, ctx.from.username);

    if (success) {
        ctx.reply("✅ Sukses! Anda sekarang telah menjadi Admin.");
    } else {
        ctx.reply("❌ Gagal menambahkan Anda sebagai Admin.");
    }
});

  //Callback Data
  bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;
    const userId = ctx.from.id;

    await ctx.answerCbQuery(); // Menghindari loading terus menerus

    if (action.startsWith('dl_')) {
        try {
            const query = action.substring(3); // Menghapus "dl_" dari callback_data
            const url = `https://api.lolhuman.xyz/api/kusonimesearch?apikey=risqyananto&query=${encodeURIComponent(query)}`;
            const response = await axios.get(url);
            const data = response.data.result.link_dl;
            let price = 2000;
            await func.useCredit(ctx, userId, price)
            if (!data) return ctx.reply("❌ Link download tidak ditemukan!");

            let downloadText = `📥 *Link Download untuk ${query}*:\n\n`;
            Object.keys(data).forEach((quality) => {
                downloadText += `🎞 *${quality}*:\n`;
                Object.keys(data[quality]).forEach((server) => {
                    downloadText += `🔗 [${server}](${data[quality][server]})\n`;
                });
                downloadText += `\n`;
            });

            ctx.reply(downloadText, { parse_mode: "Markdown", disable_web_page_preview: true });

        } catch (error) {
            console.error("❌ Error mengambil link download:", error);
            ctx.reply("Terjadi kesalahan saat mengambil link download.");
        }
    }

    if (action.startsWith('confirm_register_')) {
        const originalUserId = action.replace('confirm_register_', ''); // Ambil user ID asli

        // Cek apakah user sudah ada di database
        const isMember = await func.isMember(originalUserId);
        const isAdmin = await func.isAdmin(originalUserId);
        let newMemberCredit = parseInt(config.credit)
        if (isMember || isAdmin) {
            return ctx.reply('✅ Anda sudah terdaftar!');
        }

        // Simpan data pendaftaran di database
        await func.addMember(ctx, originalUserId, ctx.from.first_name, ctx.from.username, "Member", newMemberCredit);

        return ctx.reply('✅ Pendaftaran berhasil! Selamat datang di bot.');
    }

    switch (action) {
    case 'back':
    try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
    await msgHandler.goBack(ctx);
    break;
    case 'bc':
        try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        ctx.session.waitingFor = 'bc';
        ctx.reply("📣 Ingin membuat pengumuman apa admin ? ",  {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔔 Pengumuman', callback_data: 'umum'}],
                    [{ text: '🔔 Update', callback_data: 'update'}],
                    [{ text: '🔔 Event', callback_data: 'event'}],
                    [{ text: '🔔 Giveaway', callback_data: 'gw'}],
                    [{ text: '🔔 KHA', callback_data: 'kha'}],
                    [{ text: '⚠️ Warning', callback_data: 'warningadmin'}],
                    [{ text: '🔙 Back', callback_data: 'back'}]
                ]
            }
    })
    break
    case "umum":
    try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        ctx.session.waitingFor = 'bc-umum';
        ctx.reply("✍️ Masukan Pesan yang ingin di umumkan ",  {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                    ]
            }
        })
    break
    case "update":
    try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        ctx.session.waitingFor = 'bc-update';
        ctx.reply("✍️ Masukan Pesan Jenis atau Commands yang di update: ",  {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                    ]
            }
        })
    break        
    case "event":
    try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        ctx.session.waitingFor = 'bc-event';
        ctx.reply("✍️ Masukan pesan event yang ingin anda adakan: ",  {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                    ]
            }
        })
    break        
    case "gw":
    try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        ctx.session.waitingFor = 'bc-giveaway';
        ctx.reply("✍️ Masukan pesan giveaway anda:  ",  {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                    ]
            }
        })
    break        
    case "kha":
    try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        ctx.session.waitingFor = 'bc-kha';
        ctx.reply("✍️ Masukan pesan kata-kata hari ini anda: ",  {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                    ]
            }
        })
    break        
    case "warningadmin":
    try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        ctx.session.waitingFor = 'bc-warning';
        ctx.reply("✍️ Maskan pesan peringatan dari admin: ",  {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                    ]
            }
        })
    break                
    case 'report':
        try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        ctx.session.waitingFor = 'report';
        await msgHandler.getReport(ctx)
    break
    case 'fitur': 
    try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
    await msgHandler.getFitur(ctx);
    break;
    case 'downloader':
        try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        await msgHandler.getDownloader(ctx)
    break
    case 'information':
        try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        await msgHandler.getInformation(ctx)
    break
    case 'animemanga':
        try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        await msgHandler.getAnimanga(ctx)
    break
    case 'game':
        try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        await msgHandler.getGame(ctx)
    break

    // Fitur Downloader
    case 'yt':
        try { await ctx.deleteMessage(); } catch (e) { console.log("Pesan sudah dihapus."); }
        ctx.session.waitingFor = 'yt';
        ctx.reply("📁 Masukan URL Youtube yang ingin anda download: ",  {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                ]
            }
    })
    break
    case 'tt':
        try { await ctx.deleteMessage();} catch (e) {console.log("Done Delete")}
        ctx.session.waitingFor = 'tt';
        ctx.reply("📁 Masukan URL Tiktok yang ingin anda download: ",  {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                ]
            }})
    break
    case 'fb': 
    try { await ctx.deleteMessage();} catch (e) {console.log("Done Delete")}
        ctx.session.waitingFor = 'fb';
        ctx.reply("📁 Masukan URL Facebook yang ingin anda download: ", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                ]
            }})
    break

    // FItur Information
    case 'cuaca':
            try { await ctx.deleteMessage();} catch (e) {console.log("Done Delete")}
            ctx.session.waitingFor = 'cuaca';
            ctx.reply("Masukan nama kota yang ingin anda cari cuaca: (contoh: nganjuk, yogyakarta) ", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Back', callback_data: 'back'}]
                    ]
                }
            })
    break
    case 'gempanew':
        try { await ctx.deleteMessage();} catch (e) {console.log("Done Delete")}
        let price = 100;
        await func.useCredit(ctx, userId, price)
        let gempa = await func.textGempa()
        let imgempa = await func.imgGempa()
        ctx.sendPhoto(imgempa, { caption : gempa})
    break
    case 'wikped':
        try { await ctx.deleteMessage();} catch (e) {console.log("Done Delete")}
        ctx.session.waitingFor = 'wikped';
        ctx.reply("Tulis Pertanyaan atau istilah yang ingin anda cari di wikipedia: (contoh: kota nganjuk) ", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                ]
            }
        })
    break
    case 'anime':
        try { await ctx.deleteMessage();} catch (e) {console.log("Done Delete")}
        ctx.reply("Anda Ingin Men-Download atau Hanya mencari Info tentang anime ? (pilih salah satu menu di bawah ini) ", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '1️⃣ Download Anime', callback_data: 'donlodnimex'}],
                    [{ text: '2️⃣ Anime Info', callback_data: 'animinpo'}],
                    [{ text: '🔙 Back', callback_data: 'back'}]
                ]
            }
        })
    break
    case 'donlodnimex':
        try { await ctx.deleteMessage();} catch (e) {console.log("Done Delete")}
        ctx.session.waitingFor = 'donlodnimex';
        ctx.reply("Tulis Judul Anime yang ingin klean download: (contoh: naruto)", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                ]
            }
        })
    break
    case 'animinpo':
        try { await ctx.deleteMessage();} catch (e) {console.log("Done Delete")}
        ctx.session.waitingFor = 'animeinfo';
        ctx.reply("Tulis judul Anime yang ingin klean cari info nya: (contoh: naruto)", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back'}]
                ]
            }
        })
    break
    case 'test':
        try { await ctx.deleteMessage();} catch (e) {console.log("Done Delete")}
        ctx.session.waitingFor = 'tes';
        ctx.reply("📁 Masukan URL Facebook yang ingin anda download:")
    break
    }
  });
 
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    let price = ''
    if (ctx.session.waitingFor === 'report') {
        await func.sendMessageToAdmins(bot, text);
        ctx.reply(`✅ Laporan anda telah dikirim ke ADMIN!!.`);
    }
    if (ctx.session.waitingFor === 'tes') {
        let price = 1000
        await func.useCredit(ctx, userId, price)
        ctx.reply("200")
    }
    
    if (ctx.session.waitingFor === 'bc-umum') {
        await func.sendBCUmum(bot, text)
        ctx.reply('Sukses Bang')
    }
    /*
    if (ctx.session.waitingFor === 'bc-update') {
        let getIdAll = await func.getAllUser()
        await msgHandler.bcUpdate(ctx,getIdAll,text)
        ctx.reply("✅ Sukses Membuat Pengumuman")
    }
    if (ctx.session.waitingFor === 'bc-event') {
        let getIdAll = await func.getAllUser()
        await msgHandler.bcEvent(ctx,getIdAll,text)
        ctx.reply("✅ Sukses Membuat Pengumuman")
    }
    if (ctx.session.waitingFor === 'bc-giveaway') {
        let getIdAll = await func.getAllUser()
        await msgHandler.bcGiveaway(ctx,getIdAll,text)
        ctx.reply("✅ Sukses Membuat Pengumuman")
    }
    if (ctx.session.waitingFor === 'bc-kha') {
        let getIdAll = await func.getAllUser()
        await msgHandler.bcKha(ctx,getIdAll,text)
        ctx.reply("✅ Sukses Membuat Pengumuman")
    }
    if (ctx.session.waitingFor === 'bc-warning') {
        let getIdAll = await func.getAllUser()
        await msgHandler.bcWarning(ctx,getIdAll,text)
        ctx.reply("✅ Sukses Membuat Pengumuman")
    }
        */
    if (ctx.session.waitingFor === 'yt') {
        let price = 1000
        let type = apiList.yt;
        await func.useCredit(ctx, userId, price)
        const data = await func.scrapeData(type,text)
        ctx.sendVideo(data.result.link, { caption: `Judul: ${data.result.title}`})
        ctx.reply("✅ Sukses Download Konten");

    }
    if (ctx.session.waitingFor === 'fb') {
        let price = 1000
        let type = apiList.fb;
        await func.useCredit(ctx, userId, price)
        const data = await func.scrapeData(type,text)
        ctx.sendVideo(data.result[0])
    }
    if (ctx.session.waitingFor === 'tt') {
        let price = 1000
        let type = apiList.tt;
        await func.useCredit(ctx, userId, price)
        const data = await func.scrapeData(type,text)
        let dataSource = data.result;
        let captionTT = `➡️ Title: ${dataSource.title}\n➡️ Keyword: ${dataSource.keyword}\n➡️ Deskripsi: ${dataSource.description}\n➡️ Duration: ${dataSource.duration}\n➡️ Author: ${dataSource.author.nickname}(${dataSource.author.username}`
        ctx.sendVideo(dataSource.link, { caption: captionTT})
    }
    if (ctx.session.waitingFor === 'cuaca'){
        let textku = text + '?apikey=risqyananto'
        let price = 1000
        let type = apiList.cuaca
        await func.useCredit(ctx, userId, price)
        const data = await func.scrapeData(type,textku)
        let dataSource = data.result
        let imgUrl = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjIGl6owxajsiL8G5qxbbzJFy1phpPolAhgx9GH_HgOv9P6VQqy_vNPFW7So-JoS52lAReXChsy5ykcfeQF5uSaB4CahjNZsQx8O2ygzYqoQ_UvjBdbjz5fBmowIzVzfxodlMiwfM3oTPzotJ8ogzAiCX0MXdto_145LLH6vVfCHDvTU7563KfY5QOlG44/s1600/inert.jpg';
        let captionCuaca = `📍 Tempat: ${dataSource.tempat}\n🌐 Latitude: ${dataSource.latitude} / Longitude: ${dataSource.longitude}\n☁️ Cuaca: ${dataSource.cuaca}\n💨 Kecepatan Angin: ${dataSource.angin}\n💨 Keterangan: ${dataSource.description}\n🌦️ Kelembapan: ${dataSource.kelembapan}\n🌡️ Suhu: ${dataSource.suhu}\n🌫️ Udara: ${dataSource.udara}\n🌊 Permukaan Laut: ${dataSource.permukaan_laut}`
        ctx.sendPhoto(imgUrl, { caption: captionCuaca})

    }
    if (ctx.session.waitingFor === 'wikped'){
        let price = 1000
        let type = apiList.wikped
        await func.useCredit(ctx, userId, price)
        const data = await func.scrapeData(type,text)
        let dataSource = data.result
        let imgUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/800px-Wikipedia-logo-v2.svg.png';
        let captionCuaca = `🌐 Wikipedia Menjelaskan: ${dataSource} `
        ctx.sendPhoto(imgUrl, { caption: captionCuaca})

    }
    if (ctx.session.waitingFor === 'donlodnimex'){
        let price = 1000
        let type = apiList.wikped
        await func.useCredit(ctx, userId, price)
        const data = await func.scrapeData(type,text)
        let dataSource = data.result
        let imgUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/800px-Wikipedia-logo-v2.svg.png';
        let captionCuaca = `🌐 Wikipedia Menjelaskan: ${dataSource} `
        ctx.sendPhoto(imgUrl, { caption: captionCuaca})

    }
    if (ctx.session.waitingFor === 'animeinfo'){
        let price = 1000
        let type = apiList.animeinfo
        await func.useCredit(ctx, userId, price)
        const data = await func.scrapeData(type,text)
        let dataSource = data.result
        let captionNimex = `⌞Anime Inpo⌝\n✸ Title: ${dataSource.title.romaji}(${dataSource.title.native})\n✸ Type: ${dataSource.format}\n✸ Episode: ${dataSource.episodes}\n✸ Duration: ${dataSource.duration}\n✸ Status: ${dataSource.status}\n✸ Season: ${dataSource.season}(${dataSource.seasonYear})\n✸ Source: ${dataSource.source}\n✸ Aired: ${dataSource.startDate.year} - ${dataSource.endDate.year}\n✸ Description: ${dataSource.description}`
        ctx.sendPhoto(dataSource.coverImage.large, {
            caption: captionNimex,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📥 Download', callback_data: `dl_${text}` }]
                ]
            }
        });

    }
  });

  bot.on('inline_query', async (ctx) => {
    const results = [
        {
            type: 'article',
            id: '1',
            title: 'Mulai Bot',
            description: 'Klik untuk memulai bot dalam private chat',
            input_message_content: {
                message_text: 'Klik tombol di bawah untuk mulai menggunakan bot ini.'
            },
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 Start Bot', url: `https://t.me/${ctx.botInfo.username}?start=inline` }]
                ]
            }
        }
    ];

    ctx.answerInlineQuery(results);
});

bot.launch();
console.log("Bot telah berjalan...");
