const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { first: String, last: String },
  emailAddress: String,
  phoneNumber: String,
  password: String,
  title: String,
  bio: String,
  imageUrl: String,
  locations: [String],
  jobCategories: [String],
  jobs: [Object]
});

module.exports = mongoose.model('Educator', schema);