const db = require("./db");

const blogSchema = new db.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  authorProfilePic: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  image: String,
});

const BlogPost = db.model("BlogPost", blogSchema);

module.exports = BlogPost;
