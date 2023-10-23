const express = require("express");
const path = require("path");
const collections = require("./views/registerSchema");
const bycrypt = require("bcryptjs");
const session = require("express-session");
const mongoStore = require("connect-mongo");
require("./views/auth");
const app = express();
const BlogPost = require("./views/blogPostSchema");
const Joi = require("joi");
const passport = require("passport");
require("dotenv").config();

require("dotenv").config();

app.set("views", path.join(__dirname, "views", "registration"));
app.set("view engine", "ejs");

app.use(
  "/bootstrap",
  express.static(__dirname + "/node_modules/bootstrap/dist")
);
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: "112233aabbcc",
    resave: false,
    saveUninitialized: true,
    store: mongoStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/students",
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 50000,
      secure: false,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const signupSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
});

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

//google authentication
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

//google auth
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/failed" }),
  async function (req, res) {
    const articles = await BlogPost.find().sort({ createdAt: -1 });
    res.render("index", { articles });
  }
);
app.post("/signup", async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body);

    if (error) {
      return res.status(400).send("Invalid request data");
    }

    req.session.username = value.username;
    const data = {
      username: value.username,
      email: value.email,
      password: await bycrypt.hash(value.password, 10),
    };

    await collections.insertMany([data]);
    res.render("login");
  } catch (error) {
    res.status(500).send("An error occurred during signup");
  }
});

//login post

app.post("/login", async (req, res) => {
  try {
    const check = await collections.findOne({ username: req.body.username });
    if (check) {
      passwordcheck = await bycrypt.compare(req.body.password, check.password);
      if (passwordcheck) {
        req.session.user = check._id;

        const articles = await BlogPost.find().sort({ createdAt: -1 });
        console.log("our article", articles);
        res.render("index", { articles });
      } else {
        res.send("Wrong password");
      }
    } else {
      res.send("User not found");
    }
  } catch (error) {
    res.send("Error occurred during login");
  }
});

app.post("/createBlogPost", async (req, res) => {
  try {
    const { title, description, authorProfilePic, image } = req.body;
    const userId = req.session.user;

    const newBlogPost = new BlogPost({
      title,
      description,
      authorProfilePic,
      image,
    });

    await newBlogPost.save();

    res.redirect("/Article/");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while creating the blog post.");
  }
});

app.get("/article", async (req, res) => {
  try {
    const articles = await BlogPost.find().sort({ createdAt: -1 }); // Retrieve articles and sort by createdAt in descending order

    res.render("index", { articles });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching blog posts.");
  }
});
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }

    res.redirect("/login");
  });
});

app.listen(3000, () => {
  console.log("server connected on port 3000");
});
