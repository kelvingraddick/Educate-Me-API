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

router.get('/:id', async function(req, res, next) {
  var response = { isSuccess: false };

  response.employer = await Database.Employer.findById(req.params.id).exec()
    .catch((error) => { response.errorMessage = error.message; });
  response.isSuccess = response.employer != null;
  
  res.json(response);
});

module.exports = router;
