// models/User.js
const mongoose = require('mongoose');

// Schema for each URL "slot"
const urlSchema = new mongoose.Schema({
    url: { type: String, default: '' },
    approved: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema({
    name:      { type: String, required: true },
    username:  { type: String, required: true, unique: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true },
    // Create an array of 15 URL objects by default
    urls: {
        type: [urlSchema],
        default: Array.from({ length: 15 }, () => ({ url: '', approved: false }))
    },
    information: { type: String, default: '' },
    isOnline:    { type: Boolean, default: false },
    lastLogin:   { type: Date }
});

module.exports = mongoose.model('User', UserSchema);
