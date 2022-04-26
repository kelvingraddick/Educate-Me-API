var express = require('express');
var router = express.Router();
var authorize = require('../middleware/authorize');
var Database = require('../helpers/database');

router.get('/', async function(req, res, next) {
  var response = { isSuccess: false };

  var query = Database.Employer.find();

  if (req.query.query) {
    query.or([
      { 'name': { $regex: req.query.query || '', $options: 'i' } },
      { 'bio': { $regex: req.query.query || '', $options: 'i' } }
    ])
  }

  if (req.query.bio) {
    query.where('bio', { $regex: req.query.bio || '', $options: 'i' });
  }

  if (req.query.city) {
    query.where('city', { $regex: req.query.city || '', $options: 'i' });
  }

  if (req.query.state) {
    query.where('state', { $regex: req.query.state || '', $options: 'i' });
  }

  if (req.query.zipCode) {
    query.where('zipCode', { $regex: req.query.zipCode || '', $options: 'i' });
  }

  query.select('-password');
  query.setOptions({
    skip: parseInt(req.query.skip),
    limit: parseInt(req.query.limit)
  });

  response.employers = await query
    .exec()
    .catch((error) => { response.errorMessage = error.message; });

  response.isSuccess = response.employers != null;
  
  res.json(response);
});

router.get('/matches', authorize, async function(req, res, next) {
    var response = {
      isSuccess: false,
      matches: []
    };

    const allEmployers  = await Database.Employer
      .find()
      .select('-password')
      .exec()
      .catch((error) => { response.errorMessage = error.message; });

    const allEducators = await Database.Educator
      .find()
      .exec()
      .catch((error) => { response.errorMessage = error.message; });

    for (const employer of allEmployers) {
      var match = {
        employer: employer,
        educators: allEducators.filter(x => employer.city && employer.state && x.locations.includes((employer.city + ', ' + employer.state)))
      };
      response.matches.push(match);
    }
    
    response.isSuccess = response.matches.length > 0;
    
    res.json(response);
});

module.exports = router;
