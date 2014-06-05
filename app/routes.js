/**
 * Created by petersamaan on 5/14/14.
 */


// load up the user model
var User = require('../app/models/user');
var Log = require('../app/models/log');

// app/routes.js
module.exports = function(app, passport, sendgrid, configs) {

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

    // process the add user form
    app.post('/add-user', isLoggedInAdmin, passport.authenticate('local-signup', {
        successRedirect : '/in', // redirect to the secure section
        failureRedirect : '/add-user', // redirect back to the add user page if there is an error
        failureFlash : true // allow flash messages
    }));
    // =====================================
    // CHANGE PASSWORD =====================
    // =====================================
    // handle the change password form for the logged in user
    app.post('/change-password', isLoggedIn, function(req, res) {
        console.log(JSON.stringify(req.body));
            if (req.body.pass !== req.body.passconfirm)
                res.status(403).send('Password Confirmation Mismatch');

             User.findOne({ 'credentials.email' :  req.user.credentials.email }, function(err, user) {
                // if there are any errors, throw the error
                if (err)
                    throw err;
                 //No user, send forbidden
                if (!user)
                    res.status(403).send('No Such User');
                var newUser = new User();
                user.credentials.password = newUser.generateHash(req.body.pass);
                user.save(function(err) {
                    if (err)
                        throw err;
                    sendgrid.send({
                        to: user.credentials.email,
                        from: 'it@medicatechusa.com',
                        subject: 'New Timelog Password Saved',
                        text: 'Your Timelog password has been changed as requested. Your new password is \'' + req.body.pass + '\'.'
                    }, function(err, json) {
                        if (err) { return console.error(err); }
                        console.log("Password changed for " + user.credentials.email + ", mail sending status: " + JSON.stringify(json));
                    });
                    //all worked, send OK
                    res.status(200).send('OK');
                });
             });
    });

    // =====================================
    // CLOCK-IN ============================
    // =====================================
    app.post('/clock-in', isLoggedIn, function(req, res){
        var clockInLog = new Log();
        clockInLog.eid = req.user._id;
        clockInLog.name = req.user.fullname;
        clockInLog.action = "in";
        clockInLog.loc = req.body;
        clockInLog.save(function(err) {
            if (err) throw err;
            //all worked, send OK
            res.status(200).send('OK');
        });
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
