/**
 * Created by petersamaan on 5/14/14.
 */
// app/models/user.js

    'use strict';
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    credentials      : {
        email        : String,
        password     : String,
        admin: Boolean
    },
    fullname             : String,
    hours            : Number,
    days             : { type: [String], enum: ["mon","tue","wed","thu","fri","sat","sun"] },
    vacations        : Number,
    sick             : Number,
    state            : { type: [String], enum: ["working", "assignment", "lunch", "sick", "off"] , default: "off"}
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.credentials.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
