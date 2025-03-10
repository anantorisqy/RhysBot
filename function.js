const axios = require('axios');
async function scrapeData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
        
    } catch (error) {
        console.error('Gagal mengambil data:', error);
        return null;
    }
}
async function imgGempa(){
    try {
        const url = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'
        let dtGempa = await scrapeData(url);
        let dgempa = dtGempa.Infogempa.gempa.Shakemap
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
        let dataGempa = await scrapeData(url);
        let gempa = dataGempa.Infogempa.gempa
        let textGempa = `➡️ Tanggal      : ${gempa.Tanggal}\n
        ➡️ Jam          : ${gempa.Jam}\n
        ➡️ Coordinates  : ${gempa.Coordinates}\n
        ➡️ Magnitude    : ${gempa.Magnitude}\n
        ➡️ Kedalaman    : ${gempa.Kedalaman}\n
        ➡️ Wilayah      : ${gempa.Wilayah}\n
        ➡️ Dirasakan    : ${gempa.Dirasakan}\n
        `
        return textGempa
    } catch (error) {
        console.log('Error terjadi karena', error);
        return null
    }
}
async function fbDL(url){
    try {
        const dataUrl = 'https://api.lolhuman.xyz/api/facebook?apikey=risqyananto&url=' + url;
        let dataFacebook = await scrapeData(dataUrl);
        let fb = dataFacebook.result[0];
        return fb
    } catch (error){
        console.log("Error")
        return null
    }
}
async function igDL(instagramUrl) {
    try {
        // Periksa apakah URL adalah reels atau post
        let type = '';
        if (instagramUrl.includes('/reels/')) {
            type = 'video';
        } else if (instagramUrl.includes('/p/')) {
            type = 'photo';
        } else {
            throw new Error('URL Instagram tidak valid. Pastikan mengandung "/reels/" atau "/p/"');
        }
        
        // API endpoint
        const apiKey = 'risqyananto';
        const apiUrl = `https://api.lolhuman.xyz/api/instagram?apikey=${apiKey}&url=` + instagramUrl
        
        // Request ke API
        const response = await axios.get(apiUrl);
        let result = response.data.result
    
        if (Array.isArray(result) && result.length > 0) {
           
            result.forEach((link, index) => console.log(`${index + 1}. ${link}`));
        } else {
         
        }
        
        return { type, result };


    } catch (error) {
        console.error('Terjadi kesalahan:', error.message);
    }
}

module.exports = { scrapeData, imgGempa, textGempa, fbDL, igDL };
