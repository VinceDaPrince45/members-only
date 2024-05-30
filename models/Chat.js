const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Chat",ChatSchema);