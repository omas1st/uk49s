// models/User.js
const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
  url: { type: String, default: '' },
  approved: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  approvedUrls: { type: [UrlSchema], default: [] },
  infoMsg: { type: String, default: '' },
  lastLogin: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
