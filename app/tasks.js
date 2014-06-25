/**
 * Created by petersamaan on 6/24/14.
 */


var schedule = require('node-schedule');

// load up the user and log models
var User = require('./models/user');
var Log = require('./models/log');

module.exports = function() {
    'use strict';

    var dailyRule0 = new schedule.RecurrenceRule();
    dailyRule0.hour = 16;
    dailyRule0.minute = 56;

    var clockOutAll = schedule.scheduleJob(dailyRule0, function () {

        console.log("auto clock out started");

        Log.collection.find({}).each(function (dayLog) {
            console.log(dayLog);
                    var hasClockOut = false;
                    for (var l = 0 ; l < dayLog.logEntries.length ; l++) {
                        if (dayLog.logEntries[l].action === "clock out") hasClockOut = true;
                    }
                    if (!hasClockOut) {
                        var clockInIndex = -1;
                        for (var i = dayLog.logEntries.length - 1; i >= 0; i--) {
                            if (dayLog.logEntries[i].action === "clock in") {
                                clockInIndex = i;
                                break;
                            }
                        }
                        var clockLog = {};
                        clockLog.action = "clock out";
                        clockLog.datetime = dayLog.logEntries[clockInIndex].datetime;
                        clockLog.loc = {
                            lon: "-117.74",
                            lat: "33.63"
                        };
                        dayLog.logEntries.push(clockLog);
                        dayLog.worked_minutes += ((Date.now() - dayLog.logEntries[clockInIndex].datetime) / 60000 - dayLog.lunch_minutes);
                        var query = {};
                        query.fullname = dayLog.name;
                        User.findOne(query, function (err, user) {
                            if (err) throw err;
                            if (dayLog.worked_minutes > user.hours * 60) dayLog.overtime_minutes = dayLog.worked_minutes - user.hours * 60;
                            dayLog.mComment = "System Generated Comment: Employee did not clock out manually, record was closed automatically at the end of the day. Worked hours and overtime should be reviewed by " + user.manager;
                            dayLog.save(function (err) {
                                if (err) throw err;
                                user.state = "off";
                                user.save(function (err) {
                                    if (err) throw err;
                                    //all worked, send changed user
                                    console.log("success closing open clock");
                                });
                            });
                        });
                    }
        });
    });
};
