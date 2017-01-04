
/**
 * GET /news
 */

  var googleFinance = require('google-finance');

  exports.fiftytwoweeks = (req, res) => {
    res.send('Not implemented yet.');
  };

  exports.quotes = (req, res) => {
    googleFinance.historical({
      symbol: req.query.symbol,
      from: req.query.from,
      to: req.query.to
    }, function (err, quotes) {
      res.send(quotes);
    });
  };
