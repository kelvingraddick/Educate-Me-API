const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  isAdmin: Boolean,
  name: { first: String, last: String },
  emailAddress: String,
  phoneNumber: String,
  password: String,
  title: String,
  bio: String,
  imageUrl: String,
  gender: String,
  race: String,
  documentUrls: [String],
  locations: [String],
  locationTypes: [String],
  schoolTypes: [String],
  schoolLevels: [String],
  certificationStatus: String
});

module.exports = mongoose.model('Educator', schema);