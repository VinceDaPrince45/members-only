const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = Schema({
    title: { type: String, required: true },
    timestamp: { type:Date, required: Date.now },
    text: { type: String, required:true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    chat: { type: Schema.Types.ObjectId, ref: "Chat" }
});

module.exports = mongoose.model("Message",MessageSchema);