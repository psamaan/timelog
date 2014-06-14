/**
 * Created by petersamaan on 5/14/14.
 */


// load up the user and log models
var User = require('../app/models/user');
var Log = require('../app/models/log');

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
    app.get('/add-user', isLoggedInAdmin, function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('add-user.ejs', { message: req.flash('signupMessage') });
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
        var clockLog = new Log();
        clockLog.eid = req.user._id;
        clockLog.name = req.user.fullname;
        clockLog.action = "clock in";
        clockLog.loc = req.body;
        clockLog.save(function(err) {
            if (err) throw err;
            User.findOne({ 'credentials.email': req.user.credentials.email }, function (err, user) {
                user.state = "working";
                user.hadlunch = false;
                user.save(function(err) {
                    if (err) throw err;
                    //all worked, send OK
                    res.status(200).send('OK');
                });
            });
        });
    });
    // =====================================
    // LUNCH-OUT ===========================
    // =====================================
    app.post('/lunch-out', isLoggedIn, function(req, res){
        var clockLog = new Log();
        clockLog.eid = req.user._id;
        clockLog.name = req.user.fullname;
        clockLog.action = "out to lunch";
        clockLog.loc = req.body;
        clockLog.save(function(err) {
            if (err) throw err;
            User.findOne({ 'credentials.email': req.user.credentials.email }, function (err, user) {
                user.state = "lunch";
                user.save(function(err) {
                    if (err) throw err;
                    //all worked, send OK
                    res.status(200).send('OK');
                });
            });
        });
    });
    // =====================================
    // LUNCH-IN ============================
    // =====================================
    app.post('/lunch-in', isLoggedIn, function(req, res){
        var clockLog = new Log();
        clockLog.eid = req.user._id;
        clockLog.name = req.user.fullname;
        clockLog.action = "back from lunch";
        clockLog.loc = req.body;
        clockLog.save(function(err) {
            if (err) throw err;
            User.findOne({ 'credentials.email': req.user.credentials.email }, function (err, user) {
                user.state = "working";
                user.hadlunch = true;
                user.save(function(err) {
                    if (err) throw err;
                    //all worked, send OK
                    res.status(200).send('OK');
                });
            });
        });
    });
    // =====================================
    // CLOCK-OUT ===========================
    // =====================================
    app.post('/clock-out', isLoggedIn, function(req, res){
        var clockLog = new Log();
        clockLog.eid = req.user._id;
        clockLog.name = req.user.fullname;
        clockLog.action = "clock out";
        clockLog.loc = req.body;
        clockLog.save(function(err) {
            if (err) throw err;
            User.findOne({ 'credentials.email': req.user.credentials.email }, function (err, user) {
                user.state = "off";
                user.save(function(err) {
                    if (err) throw err;
                    //all worked, send OK
                    res.status(200).send('OK');
                });
            });
        });
    });
    // =====================================
    // FETCH-OWN-LOG =======================
    // =====================================
    app.get('/user-log', isLoggedIn, function(req,res){
        Log.find({'eid':req.user._id, 'datetime':{$gte:req.query.start,$lte:req.query.end}}, function (err, docs) {
            res.status(200).send(docs);
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
