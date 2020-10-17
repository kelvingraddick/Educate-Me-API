var jwt = require('jsonwebtoken');
var IdentityType = require('../constants/identity-type');
var UserType = require('../constants/user-type');
var Database = require('../helpers/database');

async function authenticate(req, res, next) {
  try {
    if (req.body.identityType == IdentityType.EDUCATEME) {
      var emailAddress = req.body.emailAddress;
      var password = req.body.password;
      if (req.body.userType == UserType.EDUCATOR) {
        res.educator = await Database.Educator
          .findOne({ emailAddress: emailAddress, password: password })
          .exec()
          .catch((err) => { console.error(err.message); return res.sendStatus(500); });
        if (res.educator) {
          res.token = jwt.sign({ type: UserType.EDUCATOR }, process.env.TOKEN_SECRET, { subject: res.educator._id.toString(), issuer: 'EducateME', expiresIn: '90d' });
          return next();
        }
      }
    }
    res.sendStatus(401);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(500);
  }
}

module.exports = authenticate;