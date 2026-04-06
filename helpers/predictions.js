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

function getShioFromNumber(num) {
  const shioMap = {
    1: 'Kuda',
    2: 'Ular',
    3: 'Naga',
    4: 'Kelinci',
    5: 'Harimau',
    6: 'Kerbau',
    7: 'Tikus',
    8: 'Babi',
    9: 'Anjing',
    10: 'Ayam',
    11: 'Monyet',
    12: 'Kambing'
  };

  let n = parseInt(num);
  if (n === 0) n = 12;
  if (n > 12) n = n % 12;
  if (n === 0) n = 12;

  return shioMap[n];
}

function generatePredictionForMarket(slug) {
  const angkaMain = random4D();

  const top4d = Array.from({ length: 5 }, () => random4D()).join(' ');
  const top3d = Array.from({ length: 5 }, () => String(rand(1000)).padStart(3, '0')).join(' ');
  const top2d = Array.from({ length: 5 }, () => String(rand(100)).padStart(2, '0')).join(' ');
  const colokBebas = Array.from({ length: 3 }, () => randDigit()).join(' ');
  const colok2d = Array.from({ length: 3 }, () => String(rand(100)).padStart(2, '0')).join(' ');

  // shio dari angka main digit terakhir
  const lastDigit = angkaMain[angkaMain.length - 1];
  const shio = getShioFromNumber(lastDigit);

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

    if (!payload.current) {
      payload.current = generatePredictionForMarket(market.slug);
      writeJson(file, payload);
      continue;
    }

    if (payload.current.date !== today) {
      payload.history.unshift(payload.current);
      payload.current = generatePredictionForMarket(market.slug);
    }

    // history max 14 hari
    payload.history = payload.history.slice(0, 14);

    writeJson(file, payload);
  }
}

module.exports = {
  ensureDailyPredictions,
  generatePredictionForMarket
};
