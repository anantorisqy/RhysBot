const func = require('./function');
const apiki = require('./api.json');

async function fetchData() {
    let e = await func.gempaTerbaru();
    console.log(e)
}
fetchData()
