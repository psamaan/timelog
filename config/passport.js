/**
 * Created by petersamaan on 5/14/14.
 */
// config/passport.js

var generatePassword = require('password-generator');
var LocalStrategy = require('passport-local').Strategy;
var sendgrid  = require('sendgrid')(
        process.env.SENDGRID_USERNAME || 'app25228932@heroku.com', // TODO remove sendgrid username and password
        process.env.SENDGRID_PASSWORD || 'rwgdkc4i'
);

// load up the user model
var User = require('../app/models/user');

// expose this function to our app using module.exports
module.exports = function(passport) {

    'use strict';
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and de-serialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to de-serialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-add', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {
            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function() {

                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                User.findOne({ 'credentials.email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if there already is a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'A user with that email already exists.'));
                    } else {

                        // if there is no user with that email
                        // create the user
                        var newUser            = new User();
                        var newPassword = generatePassword();

                        // set the user's local credentials
                        newUser.credentials.email    = email;
                        newUser.credentials.password = newUser.generateHash(newPassword);
                        newUser.credentials.admin = req.body.admin;
                        newUser.fullname = req.body.fullname;
                        newUser.hours = req.body.hours;
                        newUser.days = req.body.days;
                        newUser.vacations = req.body.vacations;
                        newUser.sick = req.body.sick;

                        // save the user
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            sendgrid.send({
                                to: newUser.credentials.email,
                                from: 'it@medicatechusa.com',
                                subject: 'Your New Timelog Account',
                                text: 'A new Timelog account has been created for you. Your password is \'' + newPassword + '\'. You can change your password after you log in, which you can do at https://timelog.medicatechusa.com'
                            }, function(err, json) {
                                if (err) { return console.error(err); }
                                console.log("New account created, mail sending status: " + JSON.stringify(json));
                            });
                            return done(null, req.user);
                        });
                    }

                });

            });

        }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({ 'credentials.email' :  email }, function(err, user) {
                // if there are any errors, return the error before anything else
                if (err)
                    return done(err);
                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found with this email address.')); // req.flash is the way to set flash data using connect-flash

                // if the user is found but the password is wrong
                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flash data
                // all is well, return successful user
                return done(null, user);
            });

        }));
};

