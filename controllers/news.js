
/**
 * GET /news
 */

  var googleFinance = require('google-finance');

  exports.get = (req, res) => {
    googleFinance.companyNews({
      symbol: req.query.symbol
    }, function (err, news) {
      res.send(news);
    });
  };
