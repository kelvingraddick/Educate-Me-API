const mongoose = require('mongoose');

mongoose.connect('mongodb://' + process.env.DATABASE_HOST + '/' + process.env.DATABASE_NAME, {useNewUrlParser: true});

const Database = mongoose.connection;
Database.on('error', console.error.bind(console, 'connection error:'));
Database.once('open', function() {
  Database.Educator = require('../models/educator');
});

module.exports = Database;