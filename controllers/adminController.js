function resultsPage(req, res) {
  const today = getTodayWIBDate();

  const markets = getMarkets()
    .map((market) => {
      const history = getResultHistoryByMarket(market.slug);
      const todayResult = Array.isArray(history)
        ? history.find((item) => item.date === today)
        : null;

      return {
        ...market,
        history,
        hasTodayResult: !!todayResult
      };
    })
    .sort((a, b) => {
      if (a.hasTodayResult === b.hasTodayResult) return 0;
      return a.hasTodayResult ? 1 : -1;
    });

  res.render('admin/results', {
    pageTitle: 'Result Pasaran',
    settings: getSettings(),
    markets,
    today
  });
}
