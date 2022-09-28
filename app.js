//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local"); //for autheticating the email and password
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"});
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);


//configure passport and passport-local strategy
passport.use(User.createStrategy());

// config google strategy for oauth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

// config facebook strategy for oauth
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

//serialize 
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      email: user.email,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

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
    email: req.body.email,
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
    email: req.body.email,
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

//authenticate with google sign in
app.get("/auth/google", passport.authenticate("google", {scope: ["profile"]}));


app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


//authenticate with facebook sign in

app.get("/auth/facebook", passport.authenticate("facebook"));


app.get("/auth/facebook/secrets", passport.authenticate("facebook", {failureRedirect: "/login"}), (req, res) => {
  res.redirect("/secrets");
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
