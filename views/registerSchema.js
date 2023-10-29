const db = require("./db");

const Registration_Schema = new db.Schema({
  username: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const collections = new db.model("users", Registration_Schema);
module.exports = collections;
