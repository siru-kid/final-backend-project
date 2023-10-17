const db = require("mongoose");

db.connect("mongodb://127.0.0.1:27017/mediumclone", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("connected to database");
  })
  .catch((error) => {
    console.log("Couldnt connect to database;", error);
  });

module.exports = db;
