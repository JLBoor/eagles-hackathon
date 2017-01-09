/**
 * GET /
 * Home page.
 */

 exports.customized = (req, res) => {
   res.render('customized', {
     title: 'Customized'
   });
 };

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
