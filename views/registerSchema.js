const db = require("./db");

const Registration_Schema = new db.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const collections = new db.model("users", Registration_Schema);
module.exports = collections;
