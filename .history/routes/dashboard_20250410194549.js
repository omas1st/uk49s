// routes/dashboard.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

// Middleware to ensure a user is authenticated (non-admin)
function ensureAuthenticated(req, res, next) {
  if (req.session.user) return next();
  req.flash('error_msg', 'Please log in to view that resource');
  res.redirect('/login');
}

// Dashboard route for normal users
router.get('/', ensureAuthenticated, (req, res) => {
  const user = req.session.user;
  // Retrieve up-to-date user info from DB
  User.findById(user._id).then(userData => {
    // Default continue URL
    let continueUrl = 'http://bit.ly/uk49wins';
    if (userData.urls && userData.urls.length > 0) {
      // Find the first approved URL that is not empty
      const approvedEntry = userData.urls.find(u => u.approved === true && u.url.trim() !== '');
      if (approvedEntry) {
        continueUrl = approvedEntry.url;
      }
    }
    res.render('dashboard', { user: userData, continueUrl });
  });
});

// Message section: user sends a message to admin's Gmail
router.post('/message', ensureAuthenticated, (req, res) => {
  const { username, message } = req.body;
  if (!username || !message) {
    req.flash('error_msg', 'Please include your username and message.');
    return res.redirect('/dashboard');
  }
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: 'New Message from User',
    text: `User: ${username}\nMessage: ${message}`
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      req.flash('error_msg', 'There was an error sending your message.');
      res.redirect('/dashboard');
    } else {
      req.flash('success_msg', 'Your message has been sent.');
      res.redirect('/dashboard');
    }
  });
});

module.exports = router;
