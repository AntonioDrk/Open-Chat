require('dotenv').config();
const express = require('express');
const { body, validationResult, check } = require('express-validator');
const session = require('express-session');
const fs = require('fs');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const default_avatar_path = 'public/images/defaultAvatars/'
const loginView = 'login_new'
const registerView = 'register_new'

// - - - - - - - - Models Imports - - - - - - - 
const User = require('../models/user');
const Token = require('../models/token');
// - - - - - - - - - - - - - - - - - - - - - -

// - - - - - - - - MAILING LOGIC - - - - - - - 
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 2525,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // generated ethereal user
    pass: process.env.SMTP_PASS, // generated ethereal password
  },
});

router.get('/token/:tokenVal', (req,res) =>{
  Token.findOne({token: req.params.tokenVal}).then(
    tokenEntry => {
      if(tokenEntry){
        User.findByIdAndUpdate(tokenEntry._userId, {isVerified: true} ).then(
          userEntry =>{
            if(userEntry){
              res.status(200).send('Email verified with success');
            }else{
              res.status(400).send('No account to verify the token for');
            }
          }).catch(
            err =>{
              res.status(500).send(err.message);
            });
        tokenEntry.remove();
      }else{
        res.sendStatus(404);
      }
      
    }).catch(
      err =>{
        res.status(500).send(err.message);
      }
    );
});

// - - - - - - - - MAILING LOGIC END - - - - -

router.get('/register', (req, res) => {
  if (req.session.user) {
    res.redirect('../');
    return;
  }
  res.render(registerView);
});

router.post('/register', [
  body('email').isEmail(),
  body('username').not().isEmpty(),
  body('password').not().isEmpty(),
  body('displayName').not().isEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //res.status(400).send({ errors: errors.array(), body: req.body });
    res.status(400).render(registerView, { err: 'Some fucking error at validation' });
    return;
  }

  User.findOne({ email: req.body.email })
    .then(usr => {
      if (usr) {
        res.status(400).render(registerView, { err: 'There\'s a user registered already with that email' });
      } else {
        // Check if username is already used
        User.findOne({username: req.body.username}).then(usr=>{
          if(usr){
            res.status(400).render(registerView, { err: 'There\'s a user registered already with that username' });
          } else {
            let hashPass = crypto.createHash('sha512').update(req.body.password).digest('hex');
            const newUser = new User({ 
              username: req.body.username, 
              password: hashPass, 
              email: req.body.email, 
              displayName: req.body.displayName,
              avatarImagePath: getRandomDefaultAvatar()
            });
            newUser.save()
              .then(val => {
                // Once an user has been successfully saved, create a token for him
                const newToken = new Token({ _userId: val._id, token: crypto.randomBytes(16).toString('hex') });
                newToken.save()
                  .then(genToken => {
                    // Send email for confirmation 
                    transporter.sendMail({
                      from: '"Chat-App 🦥" <chatapp.test.noreply@gmail.com>',
                      to: val.email,
                      subject: 'Email confirmation for Chat-App',
                      text: 'Click here to confirm your email adress and login to the app http://' + process.env.IP + ':'
                        + process.env.PORT + '/auth/token/' + genToken.token
                    }).then(
                      _ => {
                        res.status(200).render(registerView, {err: 'Check email for verification'});
                      }
                    ).catch(
                      err =>{
                        res.status(200).render(registerView, {err: err.message});
                      }
                    );
                  })
                  .catch(err => {
                    res.status(500).render(registerView, { err: err.message });
                  });
              })
              .catch(err => {
                res.status(500).render(registerView, { err: err.message });
              });
          }
        });
      }

    });
});

router.get('/login', (req, res) => {
  res.render(loginView);
});

router.post('/login', (req, res, next) => {
  // Is logging in with an email
  let hashPass = crypto.createHash('sha512').update(req.body.password).digest('hex');
  User.findOne({ email: req.body.username, password: hashPass })
    .then(usrEntry => {
      if (usrEntry) {
        console.log('Found a user with matching email and password! ' + usrEntry);
        if(usrEntry.isVerified === true){
          req.session.user = usrEntry.toObject({getters: true});
          req.session.save();
          res.status(202).redirect('/');
        }else{
          res.status(400).render(loginView, { err: 'Email for account not verified yet' });
        }
      } else {
        User.findOne({ username: req.body.username, password: hashPass }).then(usrEntry => {
          if (usrEntry) {
            console.log('Found a user with matching username and password! ' + usrEntry);
            if(usrEntry.isVerified === true){
              req.session.user = usrEntry.toObject({getters: true});
              req.session.save();
              res.status(202).redirect('/');
            }else{
              res.status(400).render(loginView, { err: 'Email for account not verified yet' });
            }
          } else {
            res.status(400).render(loginView, { err: 'Email/Username or password incorrect.' });
          }
        })
      }
    });
});

router.get('/logout', (req, res) => {
  req.session.user = '';
  res.redirect('../');
});

function getRandomDefaultAvatar() {
  const defaultAvatars = fs.readdirSync(default_avatar_path);
  const relPath = default_avatar_path.substring(default_avatar_path.indexOf('/')+1, default_avatar_path.length);
  return  relPath + defaultAvatars[getRandomInt(defaultAvatars.length)];
}

function getRandomInt(max) {
  return Math.floor(Math.random() * (max - 1));
}

module.exports = router;