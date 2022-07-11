const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  isAdmin: Boolean,
  name: String,
  emailAddress: String,
  phoneNumber: String,
  password: String,
  website: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  zipCode: String,
  bio: String,
  imageUrl: String,
  jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }]
});

module.exports = mongoose.model('Employer', schema);