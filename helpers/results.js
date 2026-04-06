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
  return String(value || '').replace(/\D/g, '').slice(0, 4);
}

function readResultPayload(slug) {
  const file = getResultsFile(slug);
  const payload = readJson(file, { current: null, latest: null, history: [] });

  return {
    current: payload && typeof payload === 'object' ? payload.current || null : null,
    latest: payload && typeof payload === 'object' ? payload.latest || null : null,
    history: payload && Array.isArray(payload.history) ? payload.history : []
  };
}

function writeResultPayload(slug, payload) {
  const file = getResultsFile(slug);

  writeJson(file, {
    current: payload.current || null,
    latest: payload.latest || null,
    history: Array.isArray(payload.history) ? payload.history.slice(0, 14) : []
  });
}

function getLatestResultByMarket(slug) {
  const payload = readResultPayload(slug);
  return payload.latest || payload.current || null;
}

function getCurrentResultByMarket(slug) {
  const payload = readResultPayload(slug);
  return payload.current || payload.latest || null;
}

function getResultHistoryByMarket(slug) {
  const payload = readResultPayload(slug);
  return Array.isArray(payload.history) ? payload.history : [];
}

function saveDailyResult(slug, payload) {
  const resultPayload = readResultPayload(slug);
  const date = payload.date || getTodayWIBDate();
  const prize1 = normalizePrize1(payload.prize1);

  const entry = {
    id: payload.id || `${slug}-${date}`,
    date,
    dayName: payload.dayName || getDayNameIndonesia(date),
    prize1,
    resultTime: payload.resultTime || '00:00',
    createdAt: new Date().toISOString()
  };

  if (date === getTodayWIBDate()) {
    resultPayload.current = entry;
    resultPayload.latest = entry;
  } else {
    resultPayload.history = resultPayload.history.filter((item) => item.date !== date);
    resultPayload.history.unshift(entry);
    resultPayload.history = resultPayload.history.slice(0, 14);
  }

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
