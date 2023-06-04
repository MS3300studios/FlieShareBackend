const db = require("../db");
const UserSchema = require("./User").userSchema;

const schema = new db.Schema({
    userId: { type: String },
    contacts: [UserSchema]
});

const Contacts = db.model("Contacts", schema);

module.exports = Contacts;