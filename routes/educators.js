var express = require('express');
var router = express.Router();
var authorize = require('../middleware/authorize');
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

router.get('/matches', authorize, async function(req, res, next) {
    var response = {
      isSuccess: false,
      matches: []
    };

    const allEducators  = await Database.Educator
      .find()
      .select('-password')
      .exec()
      .catch((error) => { response.errorMessage = error.message; });

    const allJobs = await Database.Job
      .find()
      .exec()
      .catch((error) => { response.errorMessage = error.message; });

    for (const educator of allEducators) {
      var match = {
        educator: educator,
        jobs: allJobs.filter(x =>
          (!educator.locations || educator.locations.includes(x.city + ', ' + x.state)) &&
          (!educator.locationTypes || educator.locationTypes.includes(x.locationType)) &&
          (!educator.schoolTypes || educator.schoolTypes.includes(x.schoolType)) &&
          (!educator.schoolLevels || educator.schoolLevels.includes(x.schoolLevel))
        )
      };
      response.matches.push(match);
    }
    
    response.isSuccess = response.matches.length > 0;
    
    res.json(response);
});

module.exports = router;
