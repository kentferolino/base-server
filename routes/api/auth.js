const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');
require('dotenv').config();

// User Model
const User = require('../../models/User');

// @route  POST api/auth
// @desc   Authenticate user
// @access Public
router.post('/', (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields.' });
  }

  // Check for existing user
  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(400).json({ msg: 'Invalid username or password.' });
      }

      // Validating password
      bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (!isMatch) return res.status(400).json({ msg: 'Invalid username or password.' })

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
                  email: user.email,
                  birthdate: user.birthdate,
                  gender: user.gender,
                }
              })
            }
          )
        })
    })

});

// @route  PUT api/auth/changePW
// @desc   Change user password
// @access Private
router.put('/changePW', auth, (req, res) => {
  const { currentPW, newPW, rNewPW } = req.body;
  const userId = req.user.id;

  // Simple validation
  if (!currentPW || !newPW || !rNewPW) {
    return res.status(400).json({ msg: 'Please enter all fields.' });
  }

  // Check for existing user
  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(400).json({ msg: 'Invalid username or password1.' });
      }

      if (newPW !== rNewPW) {
        return res.status(400).json({ msg: 'Passwords are not the same.' });
      }

      // Validating password
      bcrypt.compare(currentPW, user.password)
        .then(isMatch => {
          if (!isMatch) return res.status(400).json({ msg: 'Invalid username or password2.' })

          // Create salt & hash
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newPW, salt, (err, hash) => {
              if (err) throw err;
              user.password = hash;
              user.save().then(user => {
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
              }).catch(err => res.status(400).json({ success: false, msg: `Change password failed. ${err}` }));
            });
          });
        })
    })
});

// @route  GET api/auth/user
// @desc   Get user data 
// @access Private
router.get('/user', auth, (req, res) => {
  User.findById(req.user.id)
    .select('-password')
    .then(user => res.json(user))
})


module.exports = router;
