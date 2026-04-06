const { getMarkets, getPredictionFile, readJson, writeJson } = require('./data');
const { getTodayWIBDate } = require('./time');

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function randFromSeed(seed, max) {
  return Math.floor(seededRandom(seed) * max);
}

function buildSeed(slug, date) {
  const dateSeed = Number(String(date).replace(/-/g, ''));
  let slugSeed = 0;

  for (let i = 0; i < slug.length; i += 1) {
    slugSeed += slug.charCodeAt(i) * (i + 1);
  }

  return dateSeed + slugSeed;
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

  let n = parseInt(num, 10);

  if (Number.isNaN(n)) n = 12;
  if (n === 0) n = 12;
  if (n > 12) n = n % 12;
  if (n === 0) n = 12;

  return shioMap[n] || 'Kambing';
}

function generatePredictionForMarket(slug) {
  const today = getTodayWIBDate();
  const seedBase = buildSeed(slug, today);

  const angkaMain = String(randFromSeed(seedBase + 1, 10000)).padStart(4, '0');

  const top4d = Array.from({ length: 6 }, (_, i) =>
    String(randFromSeed(seedBase + 10 + i, 10000)).padStart(4, '0')
  ).join('*');

  const top3d = Array.from({ length: 6 }, (_, i) =>
    String(randFromSeed(seedBase + 30 + i, 1000)).padStart(3, '0')
  ).join('*');

  const top2d = Array.from({ length: 6 }, (_, i) =>
    String(randFromSeed(seedBase + 50 + i, 100)).padStart(2, '0')
  ).join('*');

  const colokBebas = Array.from({ length: 2 }, (_, i) =>
    randFromSeed(seedBase + 70 + i, 10)
  ).join(' / ');

  const colok2d = Array.from({ length: 2 }, (_, i) =>
    String(randFromSeed(seedBase + 80 + i, 100)).padStart(2, '0')
  ).join(' / ');

  const shio = getShio(angkaMain.slice(-1));

  return {
    date: today,
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
      payload.history = Array.isArray(payload.history) ? payload.history.slice(0, 14) : [];
      writeJson(file, payload);
      continue;
    }

    if (payload.current.date !== today) {
      payload.history.unshift(payload.current);
      payload.current = generatePredictionForMarket(market.slug);
    }

    payload.history = Array.isArray(payload.history) ? payload.history.slice(0, 14) : [];
    writeJson(file, payload);
  }
}

module.exports = {
  ensureDailyPredictions,
  generatePredictionForMarket,
  getShio
};
