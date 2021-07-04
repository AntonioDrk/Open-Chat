const express = require('express');
const session = require('express-session');
const { body, validationResult, check } = require('express-validator');
const multer  = require('multer');
const move = require('../move')
const router = express.Router();
const path = require('path');
const fs = require('fs');
const User = require('../models/user');
const limits = {fileSize: 1024 * 1024}
const pathForUpload = '.tmp/images/avatars/';
const pathForMoving = 'public/images/avatars/';
const fileExt = '.png';

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, pathForUpload);
	},
	filename: function (req, file, cb) {
		cb(null, req.session.user.username + fileExt);
	}
});
function fileFilter (req, file, cb){
	console.log('Client trying to upload ' + file.originalname);
	console.log('Extension: ' + path.extname(file.originalname));
	if(path.extname(file.originalname) === fileExt){
		cb(null, true);
	}else{
		cb(new Error('File isn\'t of type ' + fileExt), false);
	}

}
const upload = multer({ 
	storage: storage, 
	fileFilter: fileFilter, 
	limits: limits
}).single('avatar-input');

// - - - - - - - - - MIDDLEWARE - - - - - - - - - -

function isLoggedIn(req, res, next) {
	if(req.session.user){
		return next();
	}
	res.redirect('../auth/login');
}

// Executed after successfull upload
function afterUpload(req, res, next){
	const filename = req.session.user.username + fileExt;
	const pathFrom = pathForUpload + filename;
	const pathTo = pathForMoving + filename;
	fs.access(pathFrom, fs.constants.F_OK, (err)=>{
		console.log('Doing the movement of the file...');
		if(!err){
			move(pathFrom, pathTo, (err)=>{
				if(err){
					res.status(505).send(err.message);
				}else{
					console.log('Move was successfull');
				}
			})
		}else{
			res.status(505).send(err.message);
		}
	});
	// Removes 'public/' from the pathTo var
	newAvatarPath = pathTo.substring(pathTo.indexOf('/') + 1, pathTo.length);
	User.findByIdAndUpdate(req.session.user._id,{avatarImagePath: newAvatarPath} ).then(user =>{
		if(user){
			req.session.user.avatarImagePath = newAvatarPath;
			res.status(200).redirect('../');
		}else{
			res.sendStatus(505);
		}
	}).catch(err => {
		res.status(505).send(err.message);
	});
}
// - - - - - - - - - - - - - - - - - - - - - - - - -

router.post('/avatar', isLoggedIn, function (req, res, next) {
	
	upload(req, res, function(err){
		if(err instanceof multer.MulterError){
			console.log(err.message);
			return res.status(404).send(err.message);
		}else if (err){
			console.log('Error: ' + err.message);
			return res.status(404).send(err.message);
		}
		console.log('Successful upload');
		next();
		//res.status(200).redirect('../');
	});
	
}, afterUpload);

router.post('/displayName', isLoggedIn, [
  body('displayName').notEmpty()
], function (req, res){
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    res.status(400).redirect('../');
  }else{
    User.findByIdAndUpdate(req.session.user._id, {displayName: req.body.displayName}).then(usr => {
      err = '';
      if(usr){
        console.log('Updated displayName from ' + req.session.user.displayName + ' to ' + req.body.displayName);
        req.session.user.displayName = req.body.displayName;
        err = 'Successfully updated display name';
      }else{
        err = 'Error: Couldn\'t update the display name';
      }
      res.status(200).redirect('../');
    });
  }
});

module.exports = router;