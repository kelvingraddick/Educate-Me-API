var express = require('express');
var router = express.Router();
var authenticate = require('../middleware/authenticate');
var authorize = require('../middleware/authorize');
var jwt = require('jsonwebtoken');
var Database = require('../helpers/database');
var UserType = require('../constants/user-type');
var ErrorType = require('../constants/error-type');

router.post('/authenticate', authenticate, async function(req, res, next) {
  res.json({ isSuccess: true, token: res.token, employer: res.employer, ssoToken: res.ssoToken });
});

router.post('/authorize', authorize, async function(req, res, next) {
  res.json({ isSuccess: true, employer: req.employer });
});

router.post('/register', async function(req, res, next) {
  var existingEmployer = await Database.Employer.findOne({ emailAddress: req.body.emailAddress }).exec();
  if (existingEmployer) {
    res.json({ isSuccess: false, errorCode: ErrorType.EMAIL_TAKEN, errorMessage: 'This email address is already taken.' });
  } else {
    var newEmployer = {
      isAdmin: false,
      name: req.body.name,
      emailAddress: req.body.emailAddress,
      phoneNumber: req.body.phoneNumber,
      password: req.body.password,
      website: req.body.website,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      bio: req.body.bio,
      imageUrl: req.body.imageUrl
    };
    Database.Employer.create(newEmployer)
      .then(async createdEmployer => {
        var token = jwt.sign({ type: UserType.EMPLOYER }, process.env.TOKEN_SECRET, { subject: createdEmployer._id.toString(), issuer: 'EducateME', expiresIn: '90d' });
        res.json({ isSuccess: true, employer: createdEmployer, token: token });
      })
      .catch(error => { 
        res.json({ isSuccess: false, errorCode: ErrorType.DATABASE_PROBLEM, errorMessage: error.message });
      });
  }
});

router.post('/:employerId/update', authorize, async function(req, res, next) {
  var employerId = req.params.employerId;
  var existingEmployer = await Database.Employer.findOne({ emailAddress: req.body.emailAddress }).exec();
  if (existingEmployer && existingEmployer._id != employerId) {
    res.json({ isSuccess: false, errorCode: ErrorType.EMAIL_TAKEN, errorMessage: 'This email address is already taken.' });
  } else if (employerId != req.employer?.id && !req.educator?.isAdmin && !req.employer?.isAdmin) {
    res.sendStatus(403);
  } else {
    var updatedEmployer = {
      name: req.body.name,
      emailAddress: req.body.emailAddress,
      phoneNumber: req.body.phoneNumber,
      website: req.body.website,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      bio: req.body.bio,
      imageUrl: req.body.imageUrl
    };
    Database.Employer.update({ _id: employerId }, updatedEmployer)
      .then(async numberUpdated => {
        console.info('Number of employers updated: ' + JSON.stringify(numberUpdated));

        var foundEmployer = await Database.Employer.findById(employerId);
        
        /* TODO: employer changed email
        await Email.send(foundEmployer.get().emailAddress, 'Welcome to EDCOM HQ Jobs ' + foundEmployer.get().firstName + '!', 'Thank you for joining the EDCOM HQ Jobs platform', Email.templates.WELCOME_PATIENT)
          .then(() => {}, error => console.error('Email error: ' + error.message))
          .catch(error => console.error('Email error: ' + error.message));
        */

        res.json({ isSuccess: true, employer: foundEmployer });
      })
      .catch(error => { 
        res.json({ isSuccess: false, errorCode: ErrorType.DATABASE_PROBLEM, errorMessage: error.message });
      });
  }
});

router.delete('/:employerId/delete', authorize, async function(req, res, next) {
  var employerId = req.params.employerId;
  if (employerId != req.employer?.id && !req.educator?.isAdmin && !req.employer?.isAdmin) {
    res.sendStatus(403);
  } else {
    var response = { isSuccess: false };

    var employerJobsDeleteResult = await Database.Job.deleteMany({ employer: employerId }).exec()
      .catch((error) => { response.errorMessage = error.message; });
    console.info('Employer jobs delete query success: ' + JSON.stringify(employerJobsDeleteResult));

    var employerDeleteResult = await Database.Employer.deleteOne({ _id: employerId }).exec()
      .catch((error) => { response.errorMessage = error.message; });
    console.info('Employer delete query success: ' + JSON.stringify(employerDeleteResult));

    response.isSuccess = response.errorMessage == null;
    
    res.json(response);
  }
});

router.get('/:id', async function(req, res, next) {
  var response = { isSuccess: false };

  response.employer = await Database.Employer.findById(req.params.id).exec()
    .catch((error) => { response.errorMessage = error.message; });

  if (response.employer != null) {
    response.employer.jobs = await Database.Job.find({ employer: req.params.id }).exec()
      .catch((error) => { response.errorMessage = error.message; });
  }

  response.isSuccess = response.errorMessage == null;
  
  res.json(response);
});

router.get('/:employerId/educators', authorize, async function(req, res, next) {
  var employerId = req.params.employerId;
  if (employerId != req.employer?.id && !req.educator?.isAdmin && !req.employer?.isAdmin) {
    res.sendStatus(403);
  } else {
    var response = { isSuccess: false };

    req.employer.jobs = await Database.Job.find({ employer: req.employer._id }).exec()
      .catch((error) => { response.errorMessage = error.message; });
    var employerJobLocations = req.employer.jobs && req.employer.jobs.map(x => x.city + ', ' + x.state);
    var employerJobLocationTypes = req.employer.jobs && req.employer.jobs.map(x => x.locationType);
    var employerJobSchoolTypes = req.employer.jobs && req.employer.jobs.map(x => x.schoolType);
    var employerJobSchoolLevels = req.employer.jobs && req.employer.jobs.map(x => x.schoolLevel);

    const allEducators = await Database.Educator
      .find()
      .exec()
      .catch((error) => { response.errorMessage = error.message; });

    response.educators = allEducators.filter(x =>
      (!x.locations || !employerJobLocations || x.locations.filter(y => employerJobLocations.includes(y)).length > 0) &&
      (!x.locationTypes || !employerJobLocationTypes || x.locationTypes.filter(y => employerJobLocationTypes.includes(y)).length > 0) &&
      (!x.schoolTypes || !employerJobSchoolTypes || x.schoolTypes.filter(y => employerJobSchoolTypes.includes(y)).length > 0) &&
      (!x.schoolLevels || ! employerJobSchoolLevels || x.schoolLevels.filter(y => employerJobSchoolLevels.includes(y)).length > 0)
    );

    response.isSuccess = response.educators != null;
    
    res.json(response);
  }
});

module.exports = router;
