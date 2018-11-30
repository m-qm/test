'use strict';

const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  id: String,
  IP: String,
  location: {
    type: {
      type: String
    },
    coordinates: [Number]
  }
});

userSchema.index({ location: '2dsphere' });

const User = mongoose.model("User", userSchema);

module.exports = User;