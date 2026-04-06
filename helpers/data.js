const path = require('path');
const { readJson, writeJson, ensureDir, ensureFile } = require('./fileStore');
const { getTodayWIBDate, getDayNameIndonesia } = require('./time');

function getDataDir() {
  return path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
}

function getPaths() {
  const base = getDataDir();
  return {
    base,
    settings: path.join(base, 'settings.json'),
    sliders: path.join(base, 'sliders.json'),
    markets: path.join(base, 'markets.json'),
    admins: path.join(base, 'admins.json'),
    meta: path.join(base, 'meta.json'),
    resultsDir: path.join(base, 'results'),
    predictionsDir: path.join(base, 'predictions')
  };
}

function bootstrapData() {
  const paths = getPaths();

  ensureDir(paths.base);
  ensureDir(paths.resultsDir);
  ensureDir(paths.predictionsDir);

  ensureFile(paths.settings, {
    siteName: 'Dashboard Pasaran',
    logoUrl: 'https://dummyimage.com/180x50/111827/ffffff&text=LOGO',
    headerPromo: 'Dashboard Pasaran Angka',
    whatsappLink: '#',
    loginLink: '#',
    registerLink: '#',
    backgroundMain: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop',
    footerText: 'Dashboard pasaran angka dark premium Railway.'
  });

  ensureFile(paths.sliders, [
    {
      id: 's1',
      imageUrl: 'https://dummyimage.com/1200x420/111827/f59e0b&text=Banner+1',
      title: 'Banner 1',
      active: true
    }
  ]);

  ensureFile(paths.markets, [
    {
      id: 'm1',
      name: 'HONGKONG',
      slug: 'hongkong',
      liveDrawLink: '#',
      logoUrl: 'https://dummyimage.com/180x90/1f2937/ffffff&text=HK',
      closeTime: '23:00',
      resultTime: '23:45',
      description: 'Hongkong Pools'
    },
    {
      id: 'm2',
      name: 'SINGAPORE',
      slug: 'singapore',
      liveDrawLink: '#',
      logoUrl: 'https://dummyimage.com/180x90/1f2937/ffffff&text=SGP',
      closeTime: '17:00',
      resultTime: '18:00',
      description: 'Singapore Pools'
    }
  ]);

  ensureFile(paths.admins, []);
  ensureFile(paths.meta, {
    lastPredictionResetDate: getTodayWIBDate(),
    lastResultResetDate: getTodayWIBDate()
  });

  const markets = readJson(paths.markets, []);

  markets.forEach((market) => {
    const resultFile = path.join(paths.resultsDir, `${market.slug}.json`);
    const predictionFile = path.join(paths.predictionsDir, `${market.slug}.json`);

    ensureFile(resultFile, []);

    ensureFile(predictionFile, {
      current: null,
      history: []
    });
  });
}

function getSettings() {
  return readJson(getPaths().settings, {});
}

function saveSettings(data) {
  return writeJson(getPaths().settings, data);
}

function getSliders() {
  return readJson(getPaths().sliders, []);
}

function saveSliders(data) {
  return writeJson(getPaths().sliders, data);
}

function getMarkets() {
  return readJson(getPaths().markets, []);
}

function saveMarkets(data) {
  return writeJson(getPaths().markets, data);
}

function getAdmins() {
  return readJson(getPaths().admins, []);
}

function saveAdmins(data) {
  return writeJson(getPaths().admins, data);
}

function getMeta() {
  return readJson(getPaths().meta, {});
}

function saveMeta(data) {
  return writeJson(getPaths().meta, data);
}

function getResultsFile(slug) {
  return path.join(getPaths().resultsDir, `${slug}.json`);
}

function getPredictionFile(slug) {
  return path.join(getPaths().predictionsDir, `${slug}.json`);
}

module.exports = {
  bootstrapData,
  getPaths,
  getSettings,
  saveSettings,
  getSliders,
  saveSliders,
  getMarkets,
  saveMarkets,
  getAdmins,
  saveAdmins,
  getMeta,
  saveMeta,
  getResultsFile,
  getPredictionFile,
  readJson,
  writeJson,
  getTodayWIBDate
};
