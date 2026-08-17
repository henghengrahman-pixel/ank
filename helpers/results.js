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
  const raw = String(value || '').trim();
  if (!/^\d{4,5}$/.test(raw)) return '';
  return raw;
}

function makeEmptyPayload() {
  return {
    current: null,
    latest: null,
    history: []
  };
}

function readResultPayload(slug) {
  const file = getResultsFile(slug);
  const payload = readJson(file, makeEmptyPayload());

  return {
    current: payload && typeof payload === 'object' ? payload.current || null : null,
    latest: payload && typeof payload === 'object' ? payload.latest || null : null,
    history: payload && Array.isArray(payload.history) ? payload.history : []
  };
}

function sortHistory(history) {
  return [...history].sort((a, b) => {
    const dateCompare = new Date(b.date) - new Date(a.date);
    if (dateCompare !== 0) return dateCompare;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

function trimHistory(history) {
  return sortHistory(history).slice(0, 14);
}

function writeResultPayload(slug, payload) {
  const file = getResultsFile(slug);

  writeJson(file, {
    current: payload.current || null,
    latest: payload.latest || null,
    history: trimHistory(Array.isArray(payload.history) ? payload.history : [])
  });
}

function getLatestResultByMarket(slug) {
  const payload = readResultPayload(slug);
  return payload.latest || null;
}

function getCurrentResultByMarket(slug) {
  const payload = readResultPayload(slug);
  return payload.current || null;
}

function getResultHistoryByMarket(slug) {
  const payload = readResultPayload(slug);
  return trimHistory(payload.history || []);
}

function saveDailyResult(slug, payload) {
  const today = getTodayWIBDate();
  const resultPayload = readResultPayload(slug);
  const date = payload.date || today;
  const prize1 = normalizePrize1(payload.prize1);

  const entry = {
    id: payload.id || `${slug}-${date}`,
    date,
    dayName: payload.dayName || getDayNameIndonesia(date),
    prize1,
    resultTime: payload.resultTime || '00:00',
    createdAt: new Date().toISOString(),
    source: payload.source || 'manual',
    sourceType: payload.sourceType || '',
    sourceName: payload.sourceName || '',
    sourcePeriod: payload.sourcePeriod || '',
    sourceUrl: payload.sourceUrl || ''
  };

  if (!prize1) {
    throw new Error('Prize 1 wajib 4 atau 5 digit angka.');
  }

  if (date === today) {
    resultPayload.current = entry;
  } else {
    resultPayload.history = (resultPayload.history || []).filter((item) => item.date !== date);
    resultPayload.history.unshift(entry);
    resultPayload.history = trimHistory(resultPayload.history);
  }

  // latest selalu menunjuk result paling baru yang berhasil disimpan.
  const oldLatestDate = resultPayload.latest && resultPayload.latest.date ? resultPayload.latest.date : '';
  if (!oldLatestDate || date >= oldLatestDate) {
    resultPayload.latest = entry;
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
      payload.history = (payload.history || []).filter(
        (item) => item.date !== payload.current.date
      );

      payload.history.unshift(payload.current);
      payload.history = trimHistory(payload.history);
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
