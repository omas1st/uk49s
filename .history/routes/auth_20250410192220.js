// routes/auth.js
const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const User       = require('../models/User');
const nodemailer = require('nodemailer');

// Configure nodemailer for Gmail – use your app password!
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'uk49wins@gmail.com',
        pass: 'YOUR_GMAIL_PASSWORD'
    }
});

// Registration page
router.get('/register', (req, res) => {
    res.render('register');
});

// Registration handler
router.post('/register', (req, res) => {
    const { name, username, email, password, password2 } = req.body;
    let errors = [];

    if (!name || !username || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }
    if (errors.length > 0) {
        return res.render('register', { errors, name, username, email, password, password2 });
    }

    // Check if user exists
    User.findOne({ email: email }).then(user => {
        if (user) {
            errors.push({ msg: 'Email is already registered' });
            return res.render('register', { errors, name, username, email, password, password2 });
        } else {
            const newUser = new User({
                name,
                username,
                email,
                password
            });
            // Hash password before saving
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser.save()
                    .then(user => {
                        // Notify admin about new registration
                        const mailOptions = {
                            from: 'uk49wins@gmail.com',
                            to: 'uk49wins@gmail.com',
                            subject: 'New User Registered',
                            text: `A new user has registered: ${user.name} (${user.email}).`
                        };
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) console.log(error);
                            else console.log('Email sent: ' + info.response);
                        });

                        req.flash('success_msg', 'You are now registered and can log in');
                        res.redirect('/login');
                    })
                    .catch(err => console.log(err));
                });
            });
        }
    });
});

// Login page
router.get('/login', (req, res) => {
    res.render('login');
});

// Login handler
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    let errors = [];
    if (!email || !password) {
        errors.push({ msg: 'Please fill in all fields' });
        return res.render('login', { errors, email, password });
    }
    User.findOne({ email: email }).then(user => {
        if (!user) {
            errors.push({ msg: 'No user found with that email' });
            return res.render('login', { errors, email, password });
        }
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                req.session.user = user;
                user.isOnline  = true;
                user.lastLogin = new Date();
                user.save();

                // Notify admin about user login
                const mailOptions = {
                    from: 'uk49wins@gmail.com',
                    to: 'uk49wins@gmail.com',
                    subject: 'User Logged In',
                    text: `User ${user.name} (${user.email}) has logged in.`
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) console.log(error);
                    else console.log('Email sent: ' + info.response);
                });
                res.redirect('/dashboard');
            } else {
                errors.push({ msg: 'Incorrect password' });
                return res.render('login', { errors, email, password });
            }
        });
    });
});

// Logout handler
router.get('/logout', (req, res) => {
    if (req.session.user) {
        User.findByIdAndUpdate(req.session.user._id, { isOnline: false }).exec();
    }
    req.session.destroy(err => {
        res.redirect('/login');
    });
});

module.exports = router;
