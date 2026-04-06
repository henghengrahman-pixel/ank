const {
  getMarkets,
  getResultsFile,
  readJson,
  writeJson,
  getMeta,
  saveMeta
} = require('./data');

const { getTodayWIBDate, getDayNameIndonesia } = require('./time');

function normalizePrize1(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, 4)
    .padStart(4, '0');
}

function getLatestResultByMarket(slug) {
  const history = readJson(getResultsFile(slug), []);
  if (!Array.isArray(history) || history.length === 0) return null;
  return history[0];
}

function getResultHistoryByMarket(slug) {
  const history = readJson(getResultsFile(slug), []);
  return Array.isArray(history) ? history : [];
}

function saveDailyResult(slug, payload) {
  const file = getResultsFile(slug);
  const history = readJson(file, []);

  const date = payload.date || getTodayWIBDate();

  const entry = {
    id: payload.id || `${slug}-${date}`,
    date,
    dayName: payload.dayName || getDayNameIndonesia(date),
    prize1: normalizePrize1(payload.prize1),
    resultTime: payload.resultTime || '00:00',
    createdAt: new Date().toISOString()
  };

  const existingIndex = history.findIndex(
    (item) => item.id === entry.id || item.date === entry.date
  );

  if (existingIndex >= 0) {
    history[existingIndex] = {
      ...history[existingIndex],
      ...entry
    };
  } else {
    history.unshift(entry);
  }

  history.sort((a, b) => new Date(b.date) - new Date(a.date));
  writeJson(file, history);

  return entry;
}

function ensureDailyReset() {
  const today = getTodayWIBDate();
  const meta = getMeta();

  if (meta.lastResultResetDate === today) {
    return;
  }

  getMarkets().forEach((market) => {
    const file = getResultsFile(market.slug);
    const history = readJson(file, []);
    writeJson(file, Array.isArray(history) ? history : []);
  });

  meta.lastResultResetDate = today;
  saveMeta(meta);
}

module.exports = {
  getLatestResultByMarket,
  getResultHistoryByMarket,
  saveDailyResult,
  ensureDailyReset
};
