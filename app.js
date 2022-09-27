//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local"); //for autheticating the username and password
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");


mongoose.connect(
  "mongodb+srv://admin-scarlett:" +
    process.env.mongodbPass +
    "@cluster0.y3z9a.mongodb.net/userDB"
);

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));


//to use Passport and session in express

//configure session and add plugin session in express app 
app.use(session({
  secret: "i am a secret", // gererally, use .env to access secret here
  resave: false,
  saveUninitialized: false,
}))

// config passport 
app.use(passport.initialize());  //
app.use(passport.session()); 

app.use(express.static("public"));

//confi passport-local mongoose and plugin it
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

//configure passport and passport-local strategy
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register");
});


app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/register", (req, res) => {
  User.register({
    username: req.body.username,
  },
  req.body.password,
  (err, user)=>{
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      })
    }

      
    });
  }
);
app.get("/secrets", (req, res)=> {
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
})
app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, (err) => {
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, ()=>{
        res.redirect("/secrets");
      })
    }
  })
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if(err){
      console.log(err);
    }
  });
  res.redirect("/");
});

app.get("/submit", (req, res) => {});

app.listen(process.env.PORT || 3000, (req, res) => {
  console.log("Server started");
});
