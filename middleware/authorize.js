var jwt = require('jsonwebtoken');
var UserType = require('../constants/user-type');
var Database = require('../helpers/database');

async function authorize(req, res, next) {
  try {
    var authorizationHeader = req.headers['authorization'];
    var requestToken = authorizationHeader && authorizationHeader.split(' ')[1];
    var decodedToken = jwt.verify(requestToken, process.env.TOKEN_SECRET, { issuer: 'EducateME' });
    if (decodedToken) {
      if (decodedToken.type == UserType.EDUCATOR) {
        req.educator = await Database.Educator
					.findOne({ _id: decodedToken.sub })
					.exec()
          .catch((err) => { console.error(err.message); return res.sendStatus(500); });
        if (req.educator) { return next(); }
        res.sendStatus(403);
      } else if (decodedToken.type == UserType.EMPLOYER) {
        req.employer = await Database.Employer
					.findOne({ _id: decodedToken.sub })
          .populate('jobs')
					.exec()
          .catch((err) => { console.error(err.message); return res.sendStatus(500); });
        if (req.employer) { return next(); }
        res.sendStatus(403);
      }
    }
    res.sendStatus(401);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(500);
  }
}

module.exports = authorize;