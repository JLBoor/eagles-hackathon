
/**
 * GET /news
 */

  var yahooFinance = require('yahoo-finance');

  exports.fiftytwoweeks = (req, res) => {
    yahooFinance.snapshot({
      symbol: req.query.symbol,
      fields: ['k', 'j']
    }, function (err, quotes) {
      res.send(quotes);
    });
  };

  exports.quotes = (req, res) => {
    yahooFinance.historical({
      symbol: req.query.symbol,
      from: req.query.from,
      to: req.query.to
    }, function (err, quotes) {
      if(!err){
       res.send(quotes);
      }
    });
  };


exports.snapshot = (req, res) => {
  yahooFinance.snapshot({symbol: req.query.symbol, fields: ['p2']}, (err, quotes) => { 
    if(!err){ res.send(quotes) }
  });
};
