const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../../middleware/auth");

require("dotenv").config();

// User Model
const User = require("../../models/User");

// @route  POST api/users
// @desc   Register new user
// @access Public
router.post("/", (req, res) => {
  const { name, email, password } = req.body;

  // Simple validation
  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Please enter all fields." });
  }

  // Check for existing user
  User.findOne({ email }).then(user => {
    if (user) {
      return res.status(400).json({ msg: "User already exists." });
    }
    const newUser = new User({
      name,
      password,
      email
    });

    // Create salt & hash
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser.save().then(user => {
          // jwt.sign =>
          // 1st params - a json object that is included in generating jwt
          // 2nd params - jwt secret key
          // 3rd params - expires. 3600 is 1 hour
          // 4th params - callback
          jwt.sign(
            { id: user.id },
            process.env.jwtSecret,
            { expiresIn: 3600 },
            (err, token) => {
              if (err) throw err;
              res.json({
                token,
                user: {
                  id: user.id,
                  name: user.name,
                  email: user.email
                }
              });
            }
          );
        });
      });
    });
  });
});
module.exports = router;

// @route  PUT api/users/updateInfo
// @desc   Update user info
// @access Private
router.put("/updateInfo", auth, (req, res) => {
  const { name, email, birthdate, gender } = req.body;

  const userId = req.user.id;

  User.findById(req.user.id, (err, user) => {
    if (!user) res.status(404).json({ success: false, msg: "Update failed. User not found." });
    else {
      user.name = name;
      user.email = email;
      user.birthdate = birthdate;
      user.gender = gender;
      user.save().then(user => res.json(user)).catch(err => res.status(400).json({ success: false, msg: `Update failed. ${err}` }))
    }
  });
});