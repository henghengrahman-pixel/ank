const { getMarkets, getPredictionFile, readJson, writeJson } = require('./data');
const { getTodayWIBDate } = require('./time');

const SYSTEM_VERSION = 'system-v4';

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function rand(seed, max) {
  return Math.floor(seededRandom(seed) * max);
}

function slugToNumber(slug) {
  let num = 0;
  for (let i = 0; i < slug.length; i++) {
    num += slug.charCodeAt(i) * (i + 5);
  }
  return num;
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
  const slugSeed = slugToNumber(slug);
  const base = Number(today) + slugSeed;

  const angkaMain = String(rand(base + 1, 10000)).padStart(4, '0');

  const top4d = Array.from({ length: 6 }, (_, i) =>
    String(rand(base + 10 + i, 10000)).padStart(4, '0')
  ).join('*');

  const top3d = Array.from({ length: 6 }, (_, i) =>
    String(rand(base + 30 + i, 1000)).padStart(3, '0')
  ).join('*');

  const top2d = Array.from({ length: 6 }, (_, i) =>
    String(rand(base + 50 + i, 100)).padStart(2, '0')
  ).join('*');

  const colokBebas = Array.from({ length: 2 }, (_, i) =>
    rand(base + 70 + i, 10)
  ).join(' / ');

  const colok2d = Array.from({ length: 2 }, (_, i) =>
    String(rand(base + 80 + i, 100)).padStart(2, '0')
  ).join(' / ');

  const shio = getShio(angkaMain.slice(-1));

  return {
    date: getTodayWIBDate(),
    angkaMain,
    top4d,
    top3d,
    top2d,
    colokBebas,
    colok2d,
    shio,
    systemVersion: SYSTEM_VERSION,
    createdAt: new Date().toISOString()
  };
}

function ensureDailyPredictions() {
  const markets = getMarkets();
  const today = getTodayWIBDate();

  for (const market of markets) {
    const file = getPredictionFile(market.slug);
    const payload = readJson(file, { current: null, history: [] });

    const mustRegenerate =
      !payload.current ||
      payload.current.date !== today ||
      payload.current.systemVersion !== SYSTEM_VERSION;

    if (mustRegenerate) {
      if (payload.current && payload.current.date !== today) {
        payload.history.unshift(payload.current);
      }

      payload.current = generatePredictionForMarket(market.slug);
    }

    payload.history = payload.history.slice(0, 14);
    writeJson(file, payload);
  }
}

module.exports = {
  ensureDailyPredictions,
  generatePredictionForMarket
};
