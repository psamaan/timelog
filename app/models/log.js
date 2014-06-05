/**
 * Created by petersamaan on 5/16/14.
 */
// app/models/log.js

'use strict';
var mongoose = require('mongoose');
var logSchema = mongoose.Schema({
    datetime: { type : Date, default : Date.now, index : { expires : 60*60 }}, //60*60*24*365*5
    eid: mongoose.Schema.Types.ObjectId,
    name: String,
    action: { type: String, enum: ["in","out"] },
    loc: {}
});

module.exports = mongoose.model('Log',logSchema);