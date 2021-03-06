var express = require('express');
var router = express.Router();
var authorize = require('../middleware/authorize');
var jwt = require('jsonwebtoken');
var Database = require('../helpers/database');
var UserType = require('../constants/user-type');
var ErrorType = require('../constants/error-type');

router.post('/create', authorize, async function(req, res, next) {
  if (!req.employer) {
    res.sendStatus(403);
  } else {
    var newJob = {
      employer: req.employer._id,
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      instructions: req.body.instructions,
      addressName: req.body.addressName,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      imageUrl: req.body.imageUrl,
      categories: req.body.categories
    };
    Database.Job.create(newJob)
      .then(async createdJob => {
        res.json({ isSuccess: true, job: createdJob });
      })
      .catch(error => { 
        res.json({ isSuccess: false, errorCode: ErrorType.DATABASE_PROBLEM, errorMessage: error.message });
      });
  }
});

router.get('/:id', async function(req, res, next) {
  var response = { isSuccess: false };

  response.job = await Database.Job.findById(req.params.id).exec()
    .catch((error) => { response.errorMessage = error.message; });
  response.isSuccess = response.job != null;
  
  res.json(response);
});

module.exports = router;