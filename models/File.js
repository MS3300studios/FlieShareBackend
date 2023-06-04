const db = require("../db");
const UserSchema = require("./User").userSchema;

const schema = new db.Schema({
    userId: { type: String },
    participants: [UserSchema],
    name: { type: String },
    type: { type: String },
    path: { type: String },
    systemName: { type: String }
}, {
    timestamps: true
});

const File = db.model("File", schema);

module.exports = File;