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
      name: { first: req.body.firstName, last: req.body.lastName },
      emailAddress: req.body.emailAddress,
      phoneNumber: req.body.phoneNumber,
      password: req.body.password,
      title: req.body.title,
      bio: req.body.bio,
      locations: [req.body.city + ', ' + req.body.state],
      imageUrl: req.body.imageUrl
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
      name: { first: req.body.firstName, last: req.body.lastName },
      emailAddress: req.body.emailAddress,
      phoneNumber: req.body.phoneNumber,
      title: req.body.title,
      bio: req.body.bio,
      imageUrl: req.body.imageUrl
    };
    Database.Educator.update({ _id: educatorId }, updatedEducator)
      .then(async numberUpdated => {
        console.info('Number of educators updated: ' + JSON.stringify(numberUpdated));

        var foundEducator = await Database.Educator.findById(educatorId);
        
        /* TODO: educator changed email
        await Email.send(foundEducator.get().emailAddress, 'Welcome to EducateME ' + foundEducator.get().firstName + '!', 'Thank you for joining the EducateME platform', Email.templates.WELCOME_PATIENT)
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

router.get('/:id', async function(req, res, next) {
  var response = { isSuccess: false };

  response.educator = await Database.Educator.findById(req.params.id).exec()
    .catch((error) => { response.errorMessage = error.message; });
  response.isSuccess = response.educator != null;
  
  res.json(response);
});

module.exports = router;
