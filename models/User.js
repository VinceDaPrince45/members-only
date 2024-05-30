const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: { type: String, required: true},
    lastName: { type: String, required:true },
    username: { type: String, required: true },
    password: {type: String, require: true },
    admin: {type: Boolean, default: false }
});

module.exports = mongoose.model("User",UserSchema);