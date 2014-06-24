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
    dailyRule0.hour = 23;
    dailyRule0.minute = 55;

    var clockOutAll = schedule.scheduleJob(dailyRule0, function () {

        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth();
        var yyyy = today.getFullYear();
        var hh = today.getHours();
        var todayStart = new Date(yyyy, mm, dd, hh - 7);
        Log.find({'dayDate': {$gte: todayStart}}, function (err, dayLogs) {
            for (var d = 0; d < dayLogs.length; d++) {
                if (dayLogs[d]) {
                    var hasClockOut = false;
                    for (var l = 0 ; l < dayLogs[d].logEntries.length ; l++) {
                        if (dayLogs[d].logEntries[l].action === "clock out") hasClockOut = true;
                    }
                    if (!hasClockOut) {
                        var clockInIndex = -1;
                        for (var i = dayLogs[d].logEntries.length - 1; i >= 0; i--) {
                            if (dayLogs[d].logEntries[i].action === "clock in") {
                                clockInIndex = i;
                                break;
                            }
                        }
                        var clockLog = {};
                        clockLog.action = "clock out";
                        clockLog.loc = {
                            lon: "-117.74",
                            lat: "33.63"
                        };
                        dayLogs[d].logEntries.push(clockLog);
                        dayLogs[d].worked_minutes += ((Date.now() - dayLogs[d].logEntries[clockInIndex].datetime) / 60000 - dayLogs[d].lunch_minutes);
                        User.findOne({ 'fullname': dayLogs[d].name }, function (err, user) {
                            if (err) throw err;
                            if (dayLogs[d].worked_minutes > user.hours * 60) dayLogs[d].overtime_minutes = dayLogs[d].worked_minutes - user.hours * 60;
                            dayLogs[d].mComment = "System Generated Comment: Employee did not clock out manually, record was closed automatically at the end of the day. Worked hours and overtime should be reviewed by " + user.manager;
                            dayLogs[d].save(function (err) {
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
                }
            }
        });
    });
};
