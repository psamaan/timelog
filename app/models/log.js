/**
 * Created by petersamaan on 5/16/14.
 */
// app/models/log.js

'use strict';
var mongoose = require('mongoose');
var logSchema = mongoose.Schema({
    day: { type : Date, default : Date.now, index : { expires : 60*60*24*366*5 }},
    eid: mongoose.Schema.Types.ObjectId,
    name: String,
    worked_hours: Number,
    overtime_hours: Number,
    eComment: String,
    mComment: String,
    logEntries: [{
        datetime: { type : Date, default : Date.now},
        action: { type: String, enum: ["clock in", "out to lunch", "back from lunch", "clock out"] },
        loc: {},
        changed: Boolean
    }]
});

module.exports = mongoose.model('Log',logSchema);