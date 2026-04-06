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
  const cleaned = String(value || '').replace(/\D/g, '').slice(0, 4);
  return cleaned;
}

function readResultPayload(slug) {
  const file = getResultsFile(slug);
  const payload = readJson(file, { current: null, history: [], latest: null });

  return {
    current: payload && typeof payload === 'object' ? payload.current || null : null,
    history: payload && Array.isArray(payload.history) ? payload.history : [],
    latest: payload && typeof payload === 'object' ? payload.latest || null : null
  };
}

function writeResultPayload(slug, payload) {
  const file = getResultsFile(slug);
  writeJson(file, {
    current: payload.current || null,
    history: Array.isArray(payload.history) ? payload.history.slice(0, 14) : [],
    latest: payload.latest || null
  });
}

function getLatestResultByMarket(slug) {
  const payload = readResultPayload(slug);

  if (payload.latest) return payload.latest;
  if (payload.current) return payload.current;
  if (payload.history.length) return payload.history[0];

  return null;
}

function getResultHistoryByMarket(slug) {
  const payload = readResultPayload(slug);
  return Array.isArray(payload.history) ? payload.history : [];
}

function getCurrentResultByMarket(slug) {
  const payload = readResultPayload(slug);
  return payload.current || null;
}

function saveDailyResult(slug, payload) {
  const date = payload.date || getTodayWIBDate();
  const resultValue = normalizePrize1(payload.prize1);

  const entry = {
    id: payload.id || `${slug}-${date}`,
    date,
    dayName: payload.dayName || getDayNameIndonesia(date),
    prize1: resultValue,
    resultTime: payload.resultTime || '00:00',
    createdAt: new Date().toISOString()
  };

  const resultPayload = readResultPayload(slug);

  resultPayload.current = entry;
  resultPayload.latest = entry;

  writeResultPayload(slug, resultPayload);

  return entry;
}

function ensureDailyReset() {
  const today = getTodayWIBDate();
  const meta = getMeta();

  if (meta.lastResultResetDate === today) {
    return;
  }

  getMarkets().forEach((market) => {
    const payload = readResultPayload(market.slug);

    if (payload.current && payload.current.date !== today) {
      payload.history = payload.history.filter((item) => item.date !== payload.current.date);
      payload.history.unshift(payload.current);
      payload.history = payload.history.slice(0, 14);
      payload.current = null;
    }

    writeResultPayload(market.slug, payload);
  });

  meta.lastResultResetDate = today;
  saveMeta(meta);
}

module.exports = {
  getLatestResultByMarket,
  getCurrentResultByMarket,
  getResultHistoryByMarket,
  saveDailyResult,
  ensureDailyReset
};
