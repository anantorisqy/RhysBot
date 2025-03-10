const { google } = require("googleapis");
const axios = require('axios');
const credentials = require("./credentials.json"); // File kredensial Google Service Account
const config = require('./config.json')
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = '1Qmp-QKdT55Dn13pX1Oixuib-ATW2idVXg1BosCmolmM'; // Ganti dengan ID Spreadsheet Anda

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
async function addAdmin(ctx, userId, name, username) {
    try {
        let credit = parseInt(1000000)
        // Data yang akan ditambahkan ke Sheet
        const values = [[userId, name, username,credit]];

        // Menambahkan data ke dalam Google Sheets pada Sheet "Admins"
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Admins!A:C', // Menargetkan kolom A (UserID), B (Name), C (Username)
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
        });

        console.log(`✅ Admin baru ditambahkan: ${username} (${userId})`);
        return true;
    } catch (error) {
        console.error('❌ Gagal menambahkan admin:', error);
        return false;
    }
}

async function addMember(ctx, id, name, username, roles, credit) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Members!A:C',
            valueInputOption: 'RAW',
            resource: {
                values: [[id, name, username, roles, credit || '-']]
            }
        });
        ctx.reply('✅ Pendaftaran berhasil! Anda sekarang dapat menggunakan bot.');
    } catch (error) {
        console.error('Gagal mendaftarkan user:', error);
        ctx.reply('❌ Terjadi kesalahan saat mendaftar. Coba lagi.');
    }
}
async function getAdminList() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID, // Ganti dengan ID spreadsheet Anda
            range: 'Admins!A:A', // Hanya mengambil data di kolom A (ID Admin)
        });

        // Mengembalikan array yang berisi hanya ID Admin
        return res.data.values ? res.data.values.map(row => row[0]) : []; // Ambil kolom pertama (ID)
    } catch (error) {
        console.error('Gagal mengambil data Admin:', error);
        return [];
    }
}


// Function untuk mengirim pesan ke semua Admin
async function sendBCUmum(bot, text) {
    try {
        const admins = await getAllUser(); // Mengambil list admin dari Google Sheets
        for (const admin of admins) {

                try {
                    await bot.telegram.sendMessage(admin, `─────| 📢 Pengumuman |─────\n${text}`);
                } catch (error) {
                    console.error(`Gagal mengirim pesan ke Admin ID ${admin}:`, error);
                }
            
        }
    } catch (error) {
        console.error("Gagal mengambil data admin:", error);
    }
}
// Function untuk mengirim pesan ke semua Admin
async function sendMessageToAdmins(bot, text) {
    try {
        const admins = await getAdminList(); // Mengambil list admin dari Google Sheets
        for (const admin of admins) {

                try {
                    await bot.telegram.sendMessage(admin, `📢 Laporan untuk Admin: \r\n**${text}**`);
                    console.log(`Pesan berhasil dikirim ke Admin dengan ID: ${admin}`);
                } catch (error) {
                    console.error(`Gagal mengirim pesan ke Admin ID ${admin}:`, error);
                }
            
        }
    } catch (error) {
        console.error("Gagal mengambil data admin:", error);
    }
}
// Fungsi mengambil seluruh ID dari sheet Admins
async function getAdminIds() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Admins!A:A', // Kolom A berisi userId admin
        });
        return res.data.values ? res.data.values.flat() : [];
    } catch (error) {
        console.error('Gagal mengambil data admin:', error);
        return [];
    }
}

// Fungsi mengambil seluruh ID dari sheet Members
async function getMemberIds() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Members!A:A', // Kolom A berisi userId member
        });
        return res.data.values ? res.data.values.flat() : [];
    } catch (error) {
        console.error('Gagal mengambil data member:', error);
        return [];
    }
}

// Fungsi mengambil semua ID dari Admins dan Members
async function getAllUser() {
    const adminIds = await getAdminIds();
    const memberIds = await getMemberIds();
    
    // Gabungkan keduanya, hindari duplikasi jika ada ID yang sama
    const allIds = [...new Set([...adminIds, ...memberIds])];
    
    return allIds;
}

async function getCredit(ctx, userId) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Members!A:E',
        });

        const members = res.data.values || [];
      
        if (!members.length) {
            console.error('❌ Tidak ada data di Google Sheets!');
            return null;
        }

        // Mencari user berdasarkan userId
        const user = members.find(row => row[0] && row[0].toString() === userId.toString());

        if (!user) {
            console.error(`❌ User ID ${userId} tidak ditemukan di database!`);
            return null;
        }

        
        // Pastikan user[4] (kolom credit) ada sebelum mengaksesnya
        return user[4] ? parseInt(user[4]) : 0;
    } catch (error) {
        console.error('❌ Gagal mengambil data credit:', error);
        return null;
    }
}
async function useCredit(ctx, userId, amount) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Members!A:E',
        });

        const members = res.data.values || [];
        if (!members.length) {
            console.error('❌ Tidak ada data di Google Sheets!');
            return false;
        }

        // Mencari user berdasarkan userId
        const userIndex = members.findIndex(row => row[0] && row[0].toString() === userId.toString());

        if (userIndex === -1) {
            console.error(`❌ User ID ${userId} tidak ditemukan di database!`);
            return false;
        }

        let currentCredit = members[userIndex][4] ? parseInt(members[userIndex][4]) : 0;

        if (currentCredit < amount) {
            return ctx.reply(`❌ Kredit tidak cukup! User ${userId} hanya memiliki ${currentCredit} kredit.`)
           
        }

        let newCredit = currentCredit - amount;
        members[userIndex][4] = newCredit.toString();

        // Update data di Google Sheets
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `Members!E${userIndex + 1}`,
            valueInputOption: 'RAW',
            resource: { values: [[newCredit]] },
        });
        
        return ctx.reply(`✅ Berhasil! Sisa Balance anda Rp.${newCredit}.`)
       
    } catch (error) {
        console.error('❌ Gagal mengurangi kredit:', error);
        return false;
    }
}
async function getCreditAdmin(ctx, userId) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Admins!A:D',
        });

        const members = res.data.values || [];
      
        if (!members.length) {
            console.error('❌ Tidak ada data di Google Sheets!');
            return null;
        }

        // Mencari user berdasarkan userId
        const user = members.find(row => row[0] && row[0].toString() === userId.toString());

        if (!user) {
            console.error(`❌ User ID ${userId} tidak ditemukan di database!`);
            return null;
        }

        
        // Pastikan user[4] (kolom credit) ada sebelum mengaksesnya
        return user[3] ? parseInt(user[3]) : 0;
    } catch (error) {
        console.error('❌ Gagal mengambil data credit:', error);
        return null;
    }
}
async function resetCredit(userId) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Members!A:E',
        });

        const members = res.data.values || [];
        if (!members.length) {
            console.error('❌ Tidak ada data di Google Sheets!');
            return false;
        }

        // Mencari user berdasarkan userId
        const userIndex = members.findIndex(row => row[0] && row[0].toString() === userId.toString());

        if (userIndex === -1) {
            console.error(`❌ User ID ${userId} tidak ditemukan di database!`);
            return false;
        }

        // Mengatur kredit kembali ke nilai default (10000)
        const defaultCredit = config.credit;
        members[userIndex][4] = defaultCredit.toString();

        // Update data di Google Sheets
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `Members!E${userIndex + 1}`,
            valueInputOption: 'RAW',
            resource: { values: [[defaultCredit]] },
        });

        console.log(`✅ Kredit user ${userId} telah di-reset ke ${defaultCredit}`);
        return true;
    } catch (error) {
        console.error('❌ Gagal mereset kredit:', error);
        return false;
    }
}
async function scrapeData(type, url){
    try{
        let e = await axios.get(type + url);
        let data = e.data;
        return data
    } catch (error) {
        return error
    }
}
async function imgGempa(){
    try {
        const url = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'
        let dtGempa = await axios.get(url);
        let dgempa = dtGempa.data.Infogempa.gempa.Shakemap
        let imgempa = 'https://data.bmkg.go.id/DataMKG/TEWS/' + dgempa
        return imgempa
    } catch (error) {
        console.log("Error Terjadi karena", error);
        return null
    }
}
async function textGempa() {
    try {
        const url = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'
        let dataGempa = await axios.get(url);
        let gempa = dataGempa.data.Infogempa.gempa
        let textGempa = `➡️ Tanggal: ${gempa.Tanggal}\n➡️ Jam: ${gempa.Jam}\n➡️ Coordinates: ${gempa.Coordinates}\n➡️ Magnitude: ${gempa.Magnitude}\n➡️ Kedalaman: ${gempa.Kedalaman}\n➡️ Wilayah: ${gempa.Wilayah}\n➡️ Dirasakan: ${gempa.Dirasakan} `
        return textGempa
    } catch (error) {
        console.log('Error terjadi karena', error);
        return null
    }
}
module.exports = { isAdmin, isMember, addAdmin, addMember, sendBCUmum, sendMessageToAdmins, getAllUser, getCredit, useCredit, getCreditAdmin, resetCredit, scrapeData, imgGempa, textGempa};
