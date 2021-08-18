var express = require('express');
var router = express.Router();
var Database = require('../helpers/database');

router.get('/', async function(req, res, next) {
  var response = { isSuccess: false };

  var query = Database.Job.find();

  if (req.query.query) {
    query.or([
      { 'title': { $regex: req.query.query || '', $options: 'i' } },
      { 'description': { $regex: req.query.query || '', $options: 'i' } }
    ])
  }

  if (req.query.title) {
    query.where('title', { $regex: req.query.title || '', $options: 'i' });
  }

  if (req.query.location) {
    query.or([
      { 'addressName': { $regex: req.query.location, $options: 'i' } },
      { 'city': { $regex: req.query.location, $options: 'i' } },
      { 'state': { $regex: req.query.location, $options: 'i' } },
      { 'zipCode': { $regex: req.query.location, $options: 'i' } }
    ])
  }

  query.populate('employer');
  query.select('-password');
  query.setOptions({
    skip: parseInt(req.query.skip),
    limit: parseInt(req.query.limit)
  });

  response.jobs = await query
    .exec()
    .catch((error) => { response.errorMessage = error.message; });

  response.isSuccess = response.jobs != null;
  
  res.json(response);
});

module.exports = router;