var jwt = require('jsonwebtoken');
var crypto = require('crypto');
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
          if (req.body.ssoSource == 'bevy' && req.body.ssoToken) {
            res.ssoToken = getBevyResponseToken(res.educator, req.body.ssoToken);
          }
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

function getBevyResponseToken(user, requestToken) {
  var bevyUser = user && JSON.stringify({
    uid: user._id,
    email: user.emailAddress,
    first_name: user.name.first,
    last_name: user.name.last,
    bio: user.bio
  });

  var salt = process.env.BEVY_SECRET_KEY + process.env.BEVY_CLIENT_ID;

  var sha1Hash = crypto.createHash('sha1', salt).update(requestToken).digest('base64');

  var cipher = crypto.createCipheriv('aes-128-cbc', sha1Hash.substr(0, 16), requestToken.substr(0, 16));
  var encrypted = cipher.update(bevyUser, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  console.info("Bevy Response Token: " + encrypted);

  return encrypted;
}

module.exports = authenticate;