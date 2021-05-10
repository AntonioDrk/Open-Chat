const { string } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({

    username: {
        type: String,
        index: true,
        unique: true,
        trim: true,
        minLength: 6,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    avatarImagePath: {
        type: String,
        default: 'public/images/avatars/defaultAvatar.png'
    }
}, { timestamps: true });

const User = mongoose.model('account', userSchema);
module.exports = User;