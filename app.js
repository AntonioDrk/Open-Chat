require('dotenv').config();
const Joi = require('joi'); // For doing validation SCHEMAS on received data

const path = require('path');
const express = require('express');
const session = require('express-session')({
  // TODO for production, use of secure cookies is necessary
  secret: process.env.SESSION_TOKEN,
  resave: false,
  saveUninitialized: false
});
const sharedsession = require("express-socket.io-session");
const { body, validationResult, check } = require('express-validator');
const { data } = require('autoprefixer');
const nodemailer = require('nodemailer');


const app = express(); // By convention the var is called app

// - - - - - - - MongoDB definitions - - - - - - -
const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
const dbURI = "mongodb://localhost:27017/chat-app?retryWrites=true&w=majority";
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false})
  .then((result) => {
    httpServer.listen(port, ip, () => {
      console.log(`Listening on port ${port} . . . `);
    })
  })
  .catch((err) => console.log(err));

// - - - - - - - - - - - - - - - - - - - - - -

// - - - - - - - - Models Imports - - - - - - - 
const User = require('./models/user');
const Token = require('./models/token');
// - - - - - - - - - - - - - - - - - - - - - -

const httpServer = require('http').createServer(app); // Need to do it this way because of socket.io
const options = { serveClient: true };
const io = require('socket.io')(httpServer, options);
// check existance of enviorement variable PORT
const port = process.env.PORT || 3000;
const ip = process.env.IP || '192.168.1.238';
app.use(express.json());
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(session);

// - - - - - - - Routes definitions - - - - - - -
app.get('/', (req, res) => {
  if (req.session.user) {
    User.findOne({ _id: req.session.user._id }).then(
      usr => {
        if (usr) {
          res.render('index', {
            user: {
              username: req.session.user.username, 
              displayName: req.session.user.displayName,
              avatarImagePath: req.session.user.avatarImagePath
            }
          });
        } else {
          res.status(400).send('Something went wrong');
        }

      });
  } else {
    res.redirect('/auth/login');
  }
});

app.use('/auth', require('./routes/auth'));
app.use('/profile', require('./routes/profile'))

app.get('*', (req, res) => {
  res.sendStatus(404);
});
//  - - - - - - - - - - - - - - - - - - - - - -

function validateCourse(course) {
  const schema = Joi.object({
    name: Joi.string()
      .min(3)
      .required()
  });
  return schema.validate(course);
}

// - - - - - - - - - WEBSOCKET LOGIC - - - - - - - - -
io.use(sharedsession(session, {autoSave: true}))
// io.use((socket, next) => {
//   session(socket.request, {}, next);
// });

io.on('connection', socket => {
  //console.log(io.sockets.clients());
  socket.join('general');
  userRooms = Array.from(socket.rooms);
  socket.emit('message', { message: `Welcome fren, to the room ${userRooms[userRooms.length - 1]}`, displayName: '' });
  // Read set name from cookie or persistent data from the client
  // if there's none set the default name to "John"

  //io.emit('room-update', {room: })

  socket.on('message', (data) => {
    if(socket.handshake.session && socket.handshake.session.user ){ // if user is logged in
      console.log('Received ... \'' + data['message'] + '\' from \n' + JSON.stringify(socket.handshake.session.user));

      // Embed relevant data about the sender
      // DO NOT SEND THE _ID 
      data.user = {
        username: socket.handshake.session.user.username, 
        displayName: socket.handshake.session.user.displayName,
        avatarImagePath: socket.handshake.session.user.avatarImagePath
      };
      io.emit('message', data);
    }
  });
});
// - - - - - - - - - WEBSOCKET LOGIC END - - - - - - - - -