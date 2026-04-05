const { getSettings, getSliders, getMarkets, getPredictionFile, readJson } = require('../helpers/data');
const { getLatestResultByMarket, getResultHistoryByMarket } = require('../helpers/results');
const { formatDisplayDate, getTodayWIBDate } = require('../helpers/time');

function buildHomeMarkets() {
  return getMarkets().map((market) => ({
    ...market,
    latestResult: getLatestResultByMarket(market.slug)
  }));
}

function home(req, res) {
  res.render('pages/home', {
    pageTitle: 'Home',
    settings: getSettings(),
    sliders: getSliders().filter((item) => item.active !== false),
    markets: buildHomeMarkets(),
    formatDisplayDate
  });
}

function predictions(req, res) {
  const markets = getMarkets().map((market) => {
    const predictionPayload = readJson(getPredictionFile(market.slug), { current: null, history: [] });
    return { ...market, prediction: predictionPayload.current };
  });
  res.render('pages/predictions', {
    pageTitle: 'Prediksi',
    settings: getSettings(),
    markets,
    today: getTodayWIBDate(),
    formatDisplayDate
  });
}

function predictionDetail(req, res) {
  const market = getMarkets().find((item) => item.slug === req.params.slug);
  if (!market) return res.status(404).render('pages/404', { pageTitle: 'Tidak ditemukan', settings: getSettings() });
  const predictionPayload = readJson(getPredictionFile(market.slug), { current: null, history: [] });
  res.render('pages/prediction-detail', {
    pageTitle: `Prediksi ${market.name}`,
    settings: getSettings(),
    market,
    current: predictionPayload.current,
    history: predictionPayload.history || [],
    formatDisplayDate
  });
}

function resultDetail(req, res) {
  const market = getMarkets().find((item) => item.slug === req.params.slug);
  if (!market) return res.status(404).render('pages/404', { pageTitle: 'Tidak ditemukan', settings: getSettings() });
  const history = getResultHistoryByMarket(market.slug);
  res.render('pages/result-detail', {
    pageTitle: `Result ${market.name}`,
    settings: getSettings(),
    market,
    history,
    formatDisplayDate
  });
}

module.exports = { home, predictions, predictionDetail, resultDetail };
