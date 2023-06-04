const mongoose = require("mongoose");
const connectUri = "mongodb://127.0.0.1:27017/fileShare";

mongoose.connect( connectUri, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true
});

console.log("DB CONNECTED")

module.exports = mongoose;