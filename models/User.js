const db = require("../db");
const userPhotoString = require('./UserPhotoString');

const schema = new db.Schema({
    email: {type: String, required: true},
    password: {type: String, required: true},
    nickname: {type: String, required: true},
    photo: {type: String, required: true, default: userPhotoString},
    debugpass: {type: String}
  },
  {
    timestamps: true
  });

const User = db.model("User", schema);

module.exports = {
  User: User,
  userSchema: schema
};