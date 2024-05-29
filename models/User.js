const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true},
    lastName: { type: String, required:true },
    username: { type: String, required: true },
    password: {type: String, require: true },
    membershipStatus: {type: Boolean, default: false},
    admin: {type: Boolean, default: false }
});

module.exports = mongoose.model("User",UserSchema);