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
      employer.jobs = await Database.Job.find({ employer: employer._id }).exec()
        .catch((error) => { response.errorMessage = error.message; });
      var employerJobLocations = employer.jobs && employer.jobs.map(x => x.city + ', ' + x.state);
      var employerJobLocationTypes = employer.jobs && employer.jobs.map(x => x.locationType);
      var employerJobSchoolTypes = employer.jobs && employer.jobs.map(x => x.schoolType);
      var employerJobSchoolLevels = employer.jobs && employer.jobs.map(x => x.schoolLevel);

      var match = {
        employer: employer,
        educators: allEducators.filter(x =>
          (!x.locations || !employerJobLocations || x.locations.filter(y => employerJobLocations.includes(y)).length > 0) &&
          (!x.locationTypes || !employerJobLocationTypes || x.locationTypes.filter(y => employerJobLocationTypes.includes(y)).length > 0) &&
          (!x.schoolTypes || !employerJobSchoolTypes || x.schoolTypes.filter(y => employerJobSchoolTypes.includes(y)).length > 0) &&
          (!x.schoolLevels || ! employerJobSchoolLevels || x.schoolLevels.filter(y => employerJobSchoolLevels.includes(y)).length > 0)
        )
      };
      response.matches.push(match);
    }
    
    response.isSuccess = response.matches.length > 0;
    
    res.json(response);
});

module.exports = router;
