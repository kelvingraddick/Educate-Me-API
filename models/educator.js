const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { first: String, last: String },
  emailAddress: String,
  phoneNumber: String,
  password: String,
  title: String,
  bio: String,
  imageUrl: String
  //location: String,
  //gender: String,
  //raceAndEthnicity: String,
  //desiredPositions: Array,
  //contentAreas: Array,
  //gradeLevels: Array,
  //statesCertifiedIn: Array,
  //topCitiesOfChoice: Array,
  //yearsOfExperience: Number
});

module.exports = mongoose.model('Educator', schema);