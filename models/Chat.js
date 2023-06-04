const db = require("../db");
const UserSchema = require("./User").userSchema;

const messageSchema = new db.Schema({
    text: { type: String },
    authorNickname: { type: String },
}, {
    timestamps: true
});

const schema = new db.Schema({
    participants: [UserSchema],
    messages: [messageSchema]
});

const Conversation = db.model("Conversation", schema);

module.exports = {Conversation: Conversation, messageSchema: messageSchema};