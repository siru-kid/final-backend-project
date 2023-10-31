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
const methodOverride = require("method-override");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash"); //handle flash messages when displaying authentication-related
require("dotenv").config();

require("dotenv").config();

app.set("views", path.join(__dirname, "views", "registration"));
app.set("view engine", "ejs");

app.use(flash());
app.use(
  "/bootstrap",
  express.static(__dirname + "/node_modules/bootstrap/dist")
);
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));

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

//use password to find out if the login is authenticated or not or if he/she is Admin or user
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await collections.findOne({ username });

      if (!user) {
        return done(null, false, { message: "User not found" });
      }

      const passwordMatch = await bycrypt.compare(password, user.password);

      if (!passwordMatch) {
        return done(null, false, { message: "Wrong password" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

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

//middleware to check if user is Admin
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).render("404.ejs");
}

//signup Post method
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
      isAdmin: false,
    };

    await collections.insertMany([data]);
    res.render("login");
  } catch (error) {
    res.status(500).send("An error occurred during signup");
  }
});

//login post
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("error", info.message); // Set an error flash message
      return res.redirect("/login"); // Redirect back to the login page with the error message
    }

    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }

      const articles = await BlogPost.find().sort({ createdAt: -1 });
      res.render("index", { articles });
    });
  })(req, res, next);
});

app.post("/createBlogPost", async (req, res) => {
  try {
    const { title, description, authorProfilePic, image } = req.body;

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

//delete article by it's Id
app.delete("/deleteArticle/:articleId", isAdmin, async (req, res) => {
  const articleId = req.params.articleId;
  try {
    const result = await BlogPost.findByIdAndDelete(articleId);
    if (result) {
      res.redirect("/article");
    } else {
      console.log("Article not found");
      res.status(404).send("Article not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while deleting the article.");
  }
});

app.post("/edit/:id", isAdmin, async (req, res) => {
  try {
    const articleId = req.params.id;

    const { title, description, authorProfilePic, image } = req.body;

    const updatedArticle = await BlogPost.findByIdAndUpdate(articleId, {
      title,
      description,
      authorProfilePic,
      image,
    });

    if (updatedArticle) {
      res.redirect("/Article");
    } else {
      console.log("Article not found");
      res.status(404).send("Article not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while updating the article.");
  }
});

//edit article
app.get("/edit/:id", async (req, res) => {
  const article = await BlogPost.findById(req.params.id);
  res.render("edit", { article: article });
});

app.listen(3000, () => {
  console.log("server connected on port 3000");
});
