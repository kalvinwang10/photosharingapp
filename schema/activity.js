"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');


var activitySchema = new mongoose.Schema({
    user: String,
    event_type: String,
    date_time: Date,
    photo: String,
    comment: String,
});

var Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;
