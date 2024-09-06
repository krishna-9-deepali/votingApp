const mongoose = require("mongoose");
require("dotenv").config();
//Define the mongodbconnetion url
// const mongodbURL = process.env.MONGODB_LOCALURL;
const mongodbURL = process.env.MONGODB_URL;
//setup mongoo db connection
mongoose.connect(
  mongodbURL
  // useNewUrlParser: true,
  // UseUnifiedTopology: true,
);
//get the default connection
//mongoose maintains a default connection object representing the mongodb coonetion.
const db = mongoose.connection;
//define event listners for database connection
// console.log(
//   db.on("connected", () => {
//     console.log("conectec................");
//   })
// );
db.on("connected", () => {
  console.log("connected to mongodb server");
});
db.on("disconnected", () => {
  console.log("disconnected to mongodb server");
});
db.on("error ", (err) => {
  console.log("error  to mongodb server", err);
});
//export db connection
module.exports = db;
