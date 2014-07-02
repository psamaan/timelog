/**
 * Created by petersamaan on 5/14/14.
 */


// load up the user and log models
var User = require('./models/user');
var Log = require('./models/log');

// app/routes.js
module.exports = function(app, passport, sendgrid) {

    'use strict';

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('landing.ejs'); // load the landing.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/in', // redirect to the secure section
        failureRedirect : '/login', // redirect back to the sign in page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // ADD USER (SECURED)===================
    // =====================================
    // show the add user form
    app.get('/manage-users', isLoggedInAdmin, function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('manage-users.ejs', { message: req.flash('signupMessage') });
    });

    // process the add user form by passing it to passport
    app.post('/add-user', isLoggedInAdmin, passport.authenticate('local-add', {
        successRedirect : '/in', // redirect to the secure section
        failureRedirect : '/add-user', // redirect back to the add user page if there is an error
        failureFlash : true // allow flash messages
    }));
    // =====================================
    // CHANGE PASSWORD =====================
    // =====================================
    // handle the change password form for a user, self or ir you're an admin
    app.post('/change-password', isLoggedIn, function(req, res) {
        if (req.user.credentials.admin || req.body.email === req.user.credentials.email) {
            if (req.body.pass !== req.body.passconfirm)
                res.status(403).send('Password Confirmation Mismatch');

            User.findOne({ 'credentials.email': req.body.email }, function (err, user) {
                // if there are any errors, throw the error
                if (err)
                    throw err;
                //No user, send forbidden
                if (!user)
                    res.status(403).send('No Such User');
                var newUser = new User();
                user.credentials.password = newUser.generateHash(req.body.pass);
                user.save(function (err) {
                    if (err)
                        throw err;
                    sendgrid.send({
                        to: user.credentials.email,
                        from: 'it@medicatechusa.com',
                        subject: 'New Timelog Password Saved',
                        text: 'Your Timelog password has been changed as requested. Your new password is \'' + req.body.pass + '\'.'
                    }, function (err, json) {
                        if (err) {
                            return console.error(err);
                        }
                        console.log("Password changed for " + user.credentials.email + ", mail sending status: " + JSON.stringify(json));
                    });
                    //all worked, send OK
                    res.status(200).send('OK');
                });
            });
        }
        else
            res.status(401).send('Unauthorized');
    });

    // =====================================
    // SECURE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/in', isLoggedIn, function(req, res) {
        res.render('index.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
    // =====================================
    // PROFILE =============================
    // =====================================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

// =====================================
    // CLOCK-IN ============================
    // =====================================
    app.post('/clock-in', isLoggedIn, function(req, res){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth();
        var yyyy = today.getFullYear();
        var hh = today.getHours();
        var todayStart = new Date(yyyy, mm, dd, hh-7);
        Log.findOne({'eid': req.user._id, 'dayDate': {$gte: todayStart}}, function(err, dayLog){
            if (dayLog) {
                var clockLog = {};
                clockLog.action = "clock in";
                clockLog.loc = req.body;
                dayLog.logEntries.push(clockLog);
                dayLog.save(function(err) {
                    if (err) throw err;
                    User.findOne({ 'credentials.email': req.user.credentials.email }, function (err, user) {
                        user.state = "working";
                            user.save(function(err) {
                                if (err) throw err;
                                //all worked, send changed user
                                res.status(200).send(user);
                            });
                    });
                });
            }
            else {
                var clockLogNew = {};
                clockLogNew.action = "clock in";
                clockLogNew.loc = req.body;
                var clockDayLog = new Log();
                clockDayLog.eid = req.user._id;
                clockDayLog.name = req.user.fullname;
                clockDayLog.logEntries = [];
                clockDayLog.logEntries.push(clockLogNew);
                clockDayLog.save(function(err) {
                    if (err) throw err;
                    User.findOne({ 'credentials.email': req.user.credentials.email }, function (err, user) {
                        user.state = "working";
                        user.hadlunch = false;
                        user.save(function(err) {
                            if (err) throw err;
                            //all worked, send changed user
                            res.status(200).send(user);
                        });
                    });
                });
            }
        });

    });

    // =====================================
    // LUNCH-OUT ===========================
    // =====================================
    app.post('/lunch-out', isLoggedIn, function(req, res){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth();
        var yyyy = today.getFullYear();
        var hh = today.getHours();
        var todayStart = new Date(yyyy, mm, dd, hh-7);
        Log.findOne({'eid': req.user._id, 'dayDate': {$gte: todayStart}}, function(err, dayLog) {
            if (dayLog) {
                var clockLog = {};
                clockLog.action = "out to lunch";
                clockLog.loc = req.body;
                dayLog.logEntries.push(clockLog);
                dayLog.save(function(err) {
                    if (err) throw err;
                    User.findOne({ 'credentials.email': req.user.credentials.email }, function (err, user) {
                        user.state = "lunch";
                        user.save(function(err) {
                            if (err) throw err;
                            //all worked, send changed user
                            res.status(200).send(user);
                        });
                    });
                });
            }
            else res.status(403).send('No matching clock-in found today. Please contact support.');
        });
    });

    // =====================================
    // LUNCH-IN ============================
    // =====================================
    app.post('/lunch-in', isLoggedIn, function(req, res){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth();
        var yyyy = today.getFullYear();
        var hh = today.getHours();
        var todayStart = new Date(yyyy, mm, dd, hh-7);
        Log.findOne({'eid': req.user._id, 'dayDate': {$gte: todayStart}}, function(err, dayLog) {
            if (dayLog) {
                var lunchIndex = -1;
                for (var i = dayLog.logEntries.length-1; i>=0 ; i--) {
                    if (dayLog.logEntries[i].action === "out to lunch") {
                        lunchIndex = i;
                        break;
                    }
                }
                if (lunchIndex===-1) res.status(403).send('No matching lunch start found today. Please contact support.');
                var clockLog = {};
                clockLog.action = "back from lunch";
                clockLog.loc = req.body;
                dayLog.logEntries.push(clockLog);
                dayLog.lunch_minutes += (Date.now() - dayLog.logEntries[lunchIndex].datetime)/60000;
                dayLog.save(function(err) {
                    if (err) throw err;
                    User.findOne({ 'credentials.email': req.user.credentials.email }, function (err, user) {
                        user.state = "working";
                        user.hadlunch = true;
                        user.save(function(err) {
                            if (err) throw err;
                            //all worked, send changed user
                            res.status(200).send(user);
                        });
                    });
                });
            }
            else res.status(403).send('No matching clock-in found today. Please contact support.');
        });
    });

    // =====================================
    // CLOCK-OUT ===========================
    // =====================================
    app.post('/clock-out', isLoggedIn, function(req, res){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth();
        var yyyy = today.getFullYear();
        var hh = today.getHours();
        var todayStart = new Date(yyyy, mm, dd, hh-7);
        Log.findOne({'eid': req.user._id, 'dayDate': {$gte: todayStart}}, function(err, dayLog) {
            if (dayLog) {
                var clockInIndex = -1;
                for (var i = dayLog.logEntries.length-1; i>=0 ; i--) {
                    if (dayLog.logEntries[i].action === "clock in") {
                        clockInIndex = i;
                        break;
                    }
                }
                var clockLog = {};
                clockLog.action = "clock out";
                clockLog.loc = req.body;
                dayLog.logEntries.push(clockLog);
                dayLog.worked_minutes += ((Date.now() - dayLog.logEntries[clockInIndex].datetime)/60000 - dayLog.lunch_minutes);
                User.findOne({ 'credentials.email': req.user.credentials.email }, function (err, user) {
                    if (err) throw err;
                    if (dayLog.worked_minutes > user.hours*60) dayLog.overtime_minutes = dayLog.worked_minutes - user.hours*60;
                    dayLog.save(function(err) {
                        if (err) throw err;
                        user.state = "off";
                        user.save(function(err) {
                            if (err) throw err;
                            //all worked, send changed user
                            res.status(200).send(user);
                        });
                    });
                });
            }
            else res.status(403).send('No matching clock-in found today. Please contact support.');
        });
    });

    // =====================================
    // FETCH-OWN-LOG =======================
    // =====================================
    app.get('/user-log', isLoggedIn, function(req,res){
        Log.find({'eid':req.user._id, 'dayDate':{$gte:req.query.start,$lte:req.query.end}}, function (err, docs) {
            res.status(200).send(docs);
        });
    });
    // =====================================
    // FETCH-USER-LIST =====================
    // =====================================
    app.get('/user-list', isLoggedInAdmin, function(req,res){
        User.find({}, function (err, docs) {
            var users = [];
            for (var i = 0; i < docs.length; i++) {
                var temp = {};
                temp._id = docs[i]._id;
                temp.fullname = docs[i].fullname;
                users.push(temp);
            }
            res.status(200).send(users);
        });
    });

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    'use strict';
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

// route middleware to make sure a user is logged in AND is admin
function isLoggedInAdmin(req, res, next) {
    'use strict';
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated() && req.user.credentials.admin)
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
