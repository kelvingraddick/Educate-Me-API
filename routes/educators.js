var express = require('express');
var router = express.Router();
var Database = require('../helpers/database');

router.get('/', async function(req, res, next) {
  var response = { isSuccess: false };

  var query = Database.Educator.find();

  if (req.query.query) {
    query.or([
      { 'name.first': { $regex: req.query.query || '', $options: 'i' } },
      { 'name.last': { $regex: req.query.query || '', $options: 'i' } }
    ])
  }

  if (req.query.title) {
    query.where('title', { $regex: req.query.title || '', $options: 'i' });
  }

  if (req.query.location) {
    query.where('locations', { $regex: req.query.location || '', $options: 'i' });
  }

  query.select('-password');
  query.setOptions({
    skip: parseInt(req.query.skip),
    limit: parseInt(req.query.limit)
  });

  response.educators = await query
    .exec()
    .catch((error) => { response.errorMessage = error.message; });

  response.isSuccess = response.educators != null;
  
  res.json(response);
});

module.exports = router;
