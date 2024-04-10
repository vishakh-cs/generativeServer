const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
  emailToken: {
    type: String,
    
  },
  profileImageUrl:{
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBlocked:{
    type: Boolean,
    default: false
  },
  have_workspace:{
    type:Boolean,
    default:false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
