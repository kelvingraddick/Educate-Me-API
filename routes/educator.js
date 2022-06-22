var express = require('express');
var router = express.Router();
var authenticate = require('../middleware/authenticate');
var authorize = require('../middleware/authorize');
var jwt = require('jsonwebtoken');
var Database = require('../helpers/database');
var UserType = require('../constants/user-type');
var ErrorType = require('../constants/error-type');

router.post('/authenticate', authenticate, async function(req, res, next) {
  res.json({ isSuccess: true, token: res.token, educator: res.educator, ssoToken: res.ssoToken });
});

router.post('/authorize', authorize, async function(req, res, next) {
  res.json({ isSuccess: true, educator: req.educator });
});

router.post('/register', async function(req, res, next) {
  var existingEducator = await Database.Educator.findOne({ emailAddress: req.body.emailAddress }).exec();
  if (existingEducator) {
    res.json({ isSuccess: false, errorCode: ErrorType.EMAIL_TAKEN, errorMessage: 'This email address is already taken.' });
  } else {
    var newEducator = {
      name: req.body.name,
      emailAddress: req.body.emailAddress,
      phoneNumber: req.body.phoneNumber,
      password: req.body.password,
      title: req.body.title,
      bio: req.body.bio,
      imageUrl: req.body.imageUrl,
      gender: req.body.gender,
      race: req.body.race,
      documentUrls: req.body.documentUrls,
      locations: req.body.locations,
      locationTypes: req.body.locationTypes,
      schoolTypes: req.body.schoolTypes,
      schoolLevels: req.body.schoolLevels,
      certificationStatus: req.body.certificationStatus
    };
    Database.Educator.create(newEducator)
      .then(async createdEducator => {
        var token = jwt.sign({ type: UserType.EDUCATOR }, process.env.TOKEN_SECRET, { subject: createdEducator._id.toString(), issuer: 'EducateME', expiresIn: '90d' });
        res.json({ isSuccess: true, educator: createdEducator, token: token });
      })
      .catch(error => { 
        res.json({ isSuccess: false, errorCode: ErrorType.DATABASE_PROBLEM, errorMessage: error.message });
      });
  }
});

router.post('/:educatorId/update', authorize, async function(req, res, next) {
  var educatorId = req.params.educatorId;
  var existingEducator = await Database.Educator.findOne({ emailAddress: req.body.emailAddress }).exec();
  if (existingEducator && existingEducator._id != educatorId) {
    res.json({ isSuccess: false, errorCode: ErrorType.EMAIL_TAKEN, errorMessage: 'This email address is already taken.' });
  } else if (educatorId != req.educator.id) {
    res.sendStatus(403);
  } else {
    var updatedEducator = {
      name: req.body.name,
      emailAddress: req.body.emailAddress,
      phoneNumber: req.body.phoneNumber,
      title: req.body.title,
      bio: req.body.bio,
      imageUrl: req.body.imageUrl,
      gender: req.body.gender,
      race: req.body.race,
      documentUrls: req.body.documentUrls,
      locations: req.body.locations,
      locationTypes: req.body.locationTypes,
      schoolTypes: req.body.schoolTypes,
      schoolLevels: req.body.schoolLevels,
      certificationStatus: req.body.certificationStatus
    };
    Database.Educator.update({ _id: educatorId }, updatedEducator)
      .then(async numberUpdated => {
        console.info('Number of educators updated: ' + JSON.stringify(numberUpdated));

        var foundEducator = await Database.Educator.findById(educatorId);
        
        /* TODO: educator changed email
        await Email.send(foundEducator.get().emailAddress, 'Welcome to EDCOM HQ Jobs ' + foundEducator.get().firstName + '!', 'Thank you for joining the EDCOM HQ Jobs platform', Email.templates.WELCOME_PATIENT)
          .then(() => {}, error => console.error('Email error: ' + error.message))
          .catch(error => console.error('Email error: ' + error.message));
        */

        res.json({ isSuccess: true, educator: foundEducator });
      })
      .catch(error => { 
        res.json({ isSuccess: false, errorCode: ErrorType.DATABASE_PROBLEM, errorMessage: error.message });
      });
  }
});

router.delete('/:educatorId/delete', authorize, async function(req, res, next) {
  var educatorId = req.params.educatorId;
  if (educatorId != req.educator.id) {
    res.sendStatus(403);
  } else {
    Database.Educator.deleteOne({ _id: educatorId })
      .then(async result => {
        console.info('Educator delete query success: ' + JSON.stringify(result));
        res.json({ isSuccess: true });
      })
      .catch(error => { 
        res.json({ isSuccess: false, errorCode: ErrorType.DATABASE_PROBLEM, errorMessage: error.message });
      });
  }
});

router.get('/:id', async function(req, res, next) {
  var response = { isSuccess: false };

  response.educator = await Database.Educator.findById(req.params.id).exec()
    .catch((error) => { response.errorMessage = error.message; });
  response.isSuccess = response.educator != null;
  
  res.json(response);
});

router.get('/:educatorId/jobs', authorize, async function(req, res, next) {
  var educatorId = req.params.educatorId;
  if (educatorId != req.educator.id) {
    res.sendStatus(403);
  } else {
    var response = { isSuccess: false };

    const allJobs = await Database.Job
      .find()
      .exec()
      .catch((error) => { response.errorMessage = error.message; });

    response.jobs = allJobs.filter(x =>
      (!req.educator.locations || req.educator.locations.includes(x.city + ', ' + x.state)) &&
      (!req.educator.locationTypes || req.educator.locationTypes.includes(x.locationType)) &&
      (!req.educator.schoolTypes || req.educator.schoolTypes.includes(x.schoolType)) &&
      (!req.educator.schoolLevels || req.educator.schoolLevels.includes(x.schoolLevel))
    );
    response.isSuccess = response.jobs != null;
    
    res.json(response);
  }
});

module.exports = router;
