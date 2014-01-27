
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.render('index', { title: 'Express' });
};
