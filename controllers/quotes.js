
/**
 * GET /news
 */

  var googleFinance = require('google-finance');

  exports.fiftytwoweeks = (req, res) => {
    res.send('Not implemented yet.');
  };

  exports.quotes = (req, res) => {
    googleFinance.historical({
      symbol: 'NASDAQ:AAPL',
      from: '2016-12-25',
      to: '2017-01-05'
    }, function (err, quotes) {
      res.send(quotes);
    });
  };
