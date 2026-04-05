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
    siteName: 'OMTOGEL',
    logoUrl: 'https://dummyimage.com/180x50/111827/ffffff&text=OMTOGEL',
    headerPromo: 'Selamat datang di dashboard pasaran angka premium',
    whatsappLink: 'https://wa.me/6281234567890',
    loginLink: '#',
    registerLink: '#',
    backgroundMain: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop',
    backgroundLeft: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=900&auto=format&fit=crop',
    backgroundRight: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=900&auto=format&fit=crop',
    footerText: 'Dashboard pasaran angka dark premium siap Railway.'
  });
  ensureFile(paths.sliders, [
    { id: 's1', imageUrl: 'https://dummyimage.com/1200x420/111827/f59e0b&text=Banner+Promo+1', title: 'Promo 1', active: true },
    { id: 's2', imageUrl: 'https://dummyimage.com/1200x420/000000/22c55e&text=Banner+Promo+2', title: 'Promo 2', active: true }
  ]);
  ensureFile(paths.markets, [
    {
      id: 'm1',
      name: 'Carolina Day',
      slug: 'carolina-day',
      liveDrawLink: '#',
      logoUrl: 'https://dummyimage.com/180x90/1f2937/ffffff&text=Carolina+Day',
      closeTime: '14:00',
      resultTime: '03:00',
      description: 'Pasaran Carolina Day dengan update result harian.'
    },
    {
      id: 'm2',
      name: 'Florida Mid',
      slug: 'florida-mid',
      liveDrawLink: '#',
      logoUrl: 'https://dummyimage.com/180x90/1f2937/ffffff&text=Florida+Mid',
      closeTime: '15:00',
      resultTime: '04:00',
      description: 'Pasaran Florida Mid dengan result dan prediksi lengkap.'
    },
    {
      id: 'm3',
      name: 'Cambodia',
      slug: 'cambodia',
      liveDrawLink: '#',
      logoUrl: 'https://dummyimage.com/180x90/1f2937/ffffff&text=Cambodia',
      closeTime: '19:00',
      resultTime: '23:00',
      description: 'Pasaran Cambodia dengan history result tersimpan.'
    },
    {
      id: 'm4',
      name: 'Vietnam',
      slug: 'vietnam',
      liveDrawLink: '#',
      logoUrl: 'https://dummyimage.com/180x90/1f2937/ffffff&text=Vietnam',
      closeTime: '17:00',
      resultTime: '20:00',
      description: 'Pasaran Vietnam dengan halaman prediksi detail.'
    }
  ]);
  ensureFile(paths.admins, []);
  ensureFile(paths.meta, { lastPredictionResetDate: getTodayWIBDate(), lastResultResetDate: getTodayWIBDate() });

  const markets = readJson(paths.markets, []);
  markets.forEach((market, index) => {
    const resultFile = path.join(paths.resultsDir, `${market.slug}.json`);
    const predictionFile = path.join(paths.predictionsDir, `${market.slug}.json`);
    ensureFile(resultFile, [
      {
        id: `${market.slug}-r1`,
        date: getTodayWIBDate(),
        dayName: getDayNameIndonesia(getTodayWIBDate()),
        prize1: `${8 + index}${9 - index}${1 + index}${6 + index}`,
        resultTime: market.resultTime || '00:00',
        createdAt: new Date().toISOString()
      }
    ]);
    ensureFile(predictionFile, {
      current: {
        date: getTodayWIBDate(),
        angkaMain: '73045',
        top4d: '7304*7305*7340*7345*7350*7354',
        top3d: '730*734*735*703*704*705*743',
        top2d: '73*70*74*75*37*30*34*35*07',
        colokBebas: '3 / 5',
        colok2d: '04 / 30',
        shio: 'Naga',
        createdAt: new Date().toISOString()
      },
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
