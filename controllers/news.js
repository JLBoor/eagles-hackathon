
/**
 * GET /news
 */

  var googleFinance = require('google-finance');

  exports.get = (req, res) => {

    if(!req.query.symbol) {
      return [];
    }

    googleFinance.companyNews({
      symbol: req.query.symbol
    }, function (err, news) {
      res.send(news.splice(0, 5));
    });
  };
