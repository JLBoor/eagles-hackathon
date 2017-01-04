 
/**
 * GET /news
 */

  var googleFinance = require('google-finance');

  exports.get = (req, res) => {
    googleFinance.companyNews({
      symbol: 'NASDAQ:AAPL'
    }, function (err, news) {
      res.send(news);
    });
  };
