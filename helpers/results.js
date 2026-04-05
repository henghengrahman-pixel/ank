const { getMarkets, getResultsFile, readJson, writeJson, getMeta, saveMeta, getTodayWIBDate } = require('./data');
const { getDayNameIndonesia } = require('./time');

function getLatestResultByMarket(slug) {
  const history = readJson(getResultsFile(slug), []);
  return history[0] || null;
}

function getResultHistoryByMarket(slug) {
  return readJson(getResultsFile(slug), []);
}

function saveDailyResult(slug, payload) {
  const file = getResultsFile(slug);
  const history = readJson(file, []);
  const entry = {
    id: payload.id || `${slug}-${Date.now()}`,
    date: payload.date || getTodayWIBDate(),
    dayName: payload.dayName || getDayNameIndonesia(payload.date || getTodayWIBDate()),
    prize1: String(payload.prize1 || '').slice(0, 4),
    resultTime: payload.resultTime || '00:00',
    createdAt: new Date().toISOString()
  };

  const existingIndex = history.findIndex((item) => item.id === entry.id || item.date === entry.date);
  if (existingIndex >= 0) history[existingIndex] = { ...history[existingIndex], ...entry };
  else history.unshift(entry);

  writeJson(file, history.sort((a, b) => new Date(b.date) - new Date(a.date)));
  return entry;
}

function ensureDailyReset() {
  const today = getTodayWIBDate();
  const meta = getMeta();
  if (meta.lastResultResetDate === today) return;
  getMarkets().forEach((market) => {
    const file = getResultsFile(market.slug);
    const history = readJson(file, []);
    writeJson(file, history);
  });
  meta.lastResultResetDate = today;
  saveMeta(meta);
}

module.exports = { getLatestResultByMarket, getResultHistoryByMarket, saveDailyResult, ensureDailyReset };
