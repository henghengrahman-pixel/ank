const { getMarkets, getPredictionFile, readJson, writeJson } = require('./data');
const { getTodayWIBDate } = require('./time');

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function randFromSeed(seed, max) {
  return Math.floor(seededRandom(seed) * max);
}

function generateNumbers(seedBase) {
  const angkaMain = String(randFromSeed(seedBase, 10000)).padStart(4, '0');

  const top4d = Array.from({ length: 5 }, (_, i) =>
    String(randFromSeed(seedBase + i + 1, 10000)).padStart(4, '0')
  ).join(' ');

  const top3d = Array.from({ length: 5 }, (_, i) =>
    String(randFromSeed(seedBase + i + 10, 1000)).padStart(3, '0')
  ).join(' ');

  const top2d = Array.from({ length: 5 }, (_, i) =>
    String(randFromSeed(seedBase + i + 20, 100)).padStart(2, '0')
  ).join(' ');

  const colokBebas = Array.from({ length: 3 }, (_, i) =>
    randFromSeed(seedBase + i + 30, 10)
  ).join(' ');

  const colok2d = Array.from({ length: 3 }, (_, i) =>
    String(randFromSeed(seedBase + i + 40, 100)).padStart(2, '0')
  ).join(' ');

  return { angkaMain, top4d, top3d, top2d, colokBebas, colok2d };
}

function getShio(num) {
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
  const today = getTodayWIBDate().replace(/-/g, '');
  const seedBase = Number(today) + slug.length * 100;

  const nums = generateNumbers(seedBase);

  const lastDigit = nums.angkaMain.slice(-1);
  const shio = getShio(lastDigit);

  return {
    date: getTodayWIBDate(),
    angkaMain: nums.angkaMain,
    top4d: nums.top4d,
    top3d: nums.top3d,
    top2d: nums.top2d,
    colokBebas: nums.colokBebas,
    colok2d: nums.colok2d,
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
