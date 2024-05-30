const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Schema = mongoose.Schema;

const MessageSchema = Schema({
    title: { type: String, required: true },
    text: { type: String, required:true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    chat: { type: Schema.Types.ObjectId, ref: "Chat" },
    timestamp: { type:Date, default: Date.now },
});

MessageSchema.virtual("timestamp_formatted").get(function () {
    return this.timestamp ? DateTime.fromJSDate(this.timestamp).toLocaleString(DateTime.DATETIME_MED) : '';
});

module.exports = mongoose.model("Message",MessageSchema);