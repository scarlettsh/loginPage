//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

mongoose.connect(
  "mongodb+srv://admin-scarlett:" +
    process.env.mongodbPass +
    "@cluster0.y3z9a.mongodb.net/userDB"
);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const encKey = process.env.ENC;
const sigKey = process.env.SIG;

const User = mongoose.model("User", userSchema);



const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const email = req.body.username;

  //salting and hashing
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    const user = new User({
      email: email,
      password: hash,
    });

    user.save((err) => {
      if (!err) {
        res.send("Sueccesfully registered");
      } else {
        console.log(err);
      }
    });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const email = req.body.username;

  User.findOne({ email: email }, (err, foundResult) => {
    if (err) {
      console.log(err);
    } else {
      bcrypt.compare(req.body.password, foundResult.password, (err, result) => {
        if (result) {
          res.render("secrets");
        } else {
          res.send("password is not correct. login again.");
        }
      });
    }
  });
});

app.get("/logout", (req, res) => {});

app.get("/submit", (req, res) => {});

app.listen(3000, (req, res) => {
  console.log("Server started");
});
