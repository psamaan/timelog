/**
 * Created by petersamaan on 5/14/14.
 */

// web.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var sendgrid  = require('sendgrid')(
        process.env.SENDGRID_USERNAME || 'app25228932@heroku.com', // TODO remove sendgrid username and password
        process.env.SENDGRID_PASSWORD || 'rwgdkc4i'
);

var configs = require('./config/configs.js');
var configDB = configs.DB;

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

app.configure(function() {

    'use strict';

    // set up our express application
    app.use(express.logger('dev')); // log every request to the console TODO disable dev logging mode
    app.use(express.cookieParser()); // read cookies (needed for auth)
    app.use(express.bodyParser()); // get information from html forms
    app.set('view engine', 'ejs'); // set up ejs for templates

    // required for passport
    app.use(express.session({ secret: 'welogourtimeheresodealwithit' })); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // use connect-flash for flash messages stored in session

});

// routes ======================================================================
require('./app/routes.js')(app, passport, sendgrid, configs); // load our routes and pass in our app, passport, and configurations

// pub serving ==============================================================
app.use(express.static(__dirname + '/pub'));

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
