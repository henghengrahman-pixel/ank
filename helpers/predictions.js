const { getMarkets, getPredictionFile, readJson, writeJson } = require('./data');
const { getTodayWIBDate } = require('./time');

function rand(n) {
  return Math.floor(Math.random() * n);
}

function randDigit() {
  return Math.floor(Math.random() * 10);
}

function random4D() {
  return String(rand(10000)).padStart(4, '0');
}

function generatePredictionForMarket(slug) {
  const angkaMain = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;

  const top4d = Array.from({ length: 5 }, () => random4D()).join(' ');
  const top3d = Array.from({ length: 5 }, () => String(rand(1000)).padStart(3, '0')).join(' ');
  const top2d = Array.from({ length: 5 }, () => String(rand(100)).padStart(2, '0')).join(' ');
  const colokBebas = Array.from({ length: 3 }, () => randDigit()).join(' ');
  const colok2d = Array.from({ length: 3 }, () => String(rand(100)).padStart(2, '0')).join(' ');

  const shioList = ['Tikus','Kerbau','Macan','Kelinci','Naga','Ular','Kuda','Kambing','Monyet','Ayam','Anjing','Babi'];
  const shio = shioList[rand(shioList.length)];

  return {
    date: getTodayWIBDate(),
    angkaMain,
    top4d,
    top3d,
    top2d,
    colokBebas,
    colok2d,
    shio,
    createdAt: new Date().toISOString()
  };
}

function ensureDailyPredictions() {
  const markets = getMarkets();
  const today = getTodayWIBDate();

  for (const market of markets) {
    const file = getPredictionFile(market.slug);
    const payload = readJson(file, { current: null, history: [] });

    // jika belum ada prediksi
    if (!payload.current) {
      payload.current = generatePredictionForMarket(market.slug);
      writeJson(file, payload);
      continue;
    }

    // jika hari baru
    if (payload.current.date !== today) {
      payload.history.unshift(payload.current);
      payload.current = generatePredictionForMarket(market.slug);
    }

    // hapus history lebih dari 14 hari
    payload.history = payload.history.filter(item => {
      const d1 = new Date(item.date);
      const d2 = new Date(today);
      const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
      return diff <= 14;
    });

    writeJson(file, payload);
  }
}

module.exports = {
  ensureDailyPredictions,
  generatePredictionForMarket
};
