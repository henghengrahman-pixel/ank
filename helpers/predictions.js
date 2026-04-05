const { getMarkets, getPredictionFile, readJson, writeJson, getMeta, saveMeta, getTodayWIBDate } = require('./data');

function randomDigits(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function generatePredictionForMarket() {
  const a = randomDigits(5);
  return {
    date: getTodayWIBDate(),
    angkaMain: a,
    top4d: `${a.slice(0,4)}*${a.slice(1,5)}*${randomDigits(4)}*${randomDigits(4)}*${randomDigits(4)}`,
    top3d: `${randomDigits(3)}*${randomDigits(3)}*${randomDigits(3)}*${randomDigits(3)}`,
    top2d: `${randomDigits(2)}*${randomDigits(2)}*${randomDigits(2)}*${randomDigits(2)}*${randomDigits(2)}`,
    colokBebas: `${Math.floor(Math.random()*10)} / ${Math.floor(Math.random()*10)}`,
    colok2d: `${randomDigits(2)} / ${randomDigits(2)}`,
    shio: ['Naga', 'Ayam', 'Macan', 'Kuda', 'Babi', 'Ular'][Math.floor(Math.random() * 6)],
    createdAt: new Date().toISOString()
  };
}

function savePredictionHistory(slug, currentPrediction) {
  const file = getPredictionFile(slug);
  const payload = readJson(file, { current: null, history: [] });
  if (currentPrediction) payload.history.unshift(currentPrediction);
  writeJson(file, payload);
}

function ensureDailyPredictions() {
  const today = getTodayWIBDate();
  const meta = getMeta();
  if (meta.lastPredictionResetDate === today) return;

  getMarkets().forEach((market) => {
    const file = getPredictionFile(market.slug);
    const payload = readJson(file, { current: null, history: [] });
    if (payload.current) payload.history.unshift(payload.current);
    payload.current = generatePredictionForMarket(market);
    writeJson(file, payload);
  });

  meta.lastPredictionResetDate = today;
  saveMeta(meta);
}

module.exports = { ensureDailyPredictions, generatePredictionForMarket, savePredictionHistory };
