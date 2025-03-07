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

module.exports = { scrapeData, imgGempa, textGempa };