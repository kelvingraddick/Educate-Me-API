var express = require('express');
var router = express.Router();
var authenticate = require('../middleware/authenticate');
var authorize = require('../middleware/authorize');
var jwt = require('jsonwebtoken');
var Database = require('../helpers/database');
var UserType = require('../constants/user-type');
var ErrorType = require('../constants/error-type');

router.post('/authenticate', authenticate, async function(req, res, next) {
  res.json({ isSuccess: true, token: res.token, educator: res.educator });
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

router.get('/:id', async function(req, res, next) {
  var response = { isSuccess: false };

  response.educator = await Database.Educator.findById(req.params.id).exec()
    .catch((error) => { response.errorMessage = error.message; });
  response.isSuccess = response.educator != null;
  
  res.json(response);
});

module.exports = router;
