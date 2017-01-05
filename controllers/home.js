/**
 * GET /
 * Home page.
 */

exports.quickQuote = (req, res) => {
  res.render('quick-quote', {
    title: 'Quick Quote'
  });
};

exports.dashboard = (req, res) => {
  res.render('home', {
    title: 'Dashboard'
  });
};
