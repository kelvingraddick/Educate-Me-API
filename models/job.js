const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer' },
  type: String,
  title: String,
  description: String,
  instructions: String,
  postDate: { type: Date, default: Date.now },
  addressName: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  zipCode: String,
  locationType: String,
  imageUrl: String,
  postingUrl: String,
  schoolType: String,
  schoolLevel: String,
  certificationStatus: String
});

module.exports = mongoose.model('Job', schema);