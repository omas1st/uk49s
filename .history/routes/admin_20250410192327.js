// routes/admin.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

// Middleware: ensure that only an admin can access these routes.
// For this sample, we define the admin by email (admin@uk49wins.com)
function ensureAdmin(req, res, next) {
    if (req.session.user && req.session.user.email === 'admin@uk49wins.com') return next();
    req.flash('error_msg', 'Admin access only.');
    res.redirect('/login');
}

// Admin panel: search and list users
router.get('/', ensureAdmin, (req, res) => {
    const searchQuery = req.query.search || '';
    let query = {};
    if (searchQuery) {
        query = { $or: [
            { email:    { $regex: searchQuery, $options: 'i' } },
            { name:     { $regex: searchQuery, $options: 'i' } },
            { username: { $regex: searchQuery, $options: 'i' } }
        ]};
    }
    User.find(query).then(users => {
        res.render('admin', { users, searchQuery });
    });
});

// Delete a user profile
router.post('/delete/:id', ensureAdmin, (req, res) => {
    User.findByIdAndDelete(req.params.id)
    .then(() => {
        req.flash('success_msg', 'User deleted successfully.');
        res.redirect('/admin');
    })
    .catch(err => {
        req.flash('error_msg', 'Error deleting user.');
        res.redirect('/admin');
    });
});

// Profile page: allows editing of a user's 15 URL fields with approve/disapprove
router.get('/profile/:id', ensureAdmin, (req, res) => {
    User.findById(req.params.id).then(user => {
        res.render('profileEdit', { user });
    });
});

// Update the user's 15 URLs
router.post('/profile/:id', ensureAdmin, (req, res) => {
    User.findById(req.params.id)
    .then(user => {
        let urlsInput = [];
        // Process 15 URL textboxes and corresponding action (approve/disapprove)
        for (let i = 0; i < 15; i++) {
            let url = req.body[`url${i}`] || '';
            let action = req.body[`action${i}`] || 'disapprove';
            urlsInput.push({
                url: url,
                approved: action === 'approve'
            });
        }
        user.urls = urlsInput;
        user.save().then(() => {
            req.flash('success_msg', 'User URLs updated successfully.');
            res.redirect('/admin');
        });
    })
    .catch(err => {
        req.flash('error_msg', 'Error updating user URLs.');
        res.redirect('/admin');
    });
});

// Information page: admin can type an informational message for a user
router.get('/information/:id', ensureAdmin, (req, res) => {
    User.findById(req.params.id).then(user => {
        res.render('info', { user });
    });
});

router.post('/information/:id', ensureAdmin, (req, res) => {
    const { information } = req.body;
    User.findById(req.params.id).then(user => {
        user.information = information;
        user.save().then(() => {
            req.flash('success_msg', 'Information message updated.');
            res.redirect('/admin');
        });
    });
});

// Online users page: shows users currently online and their last login time
router.get('/online', ensureAdmin, (req, res) => {
    User.find({ isOnline: true }).then(users => {
        res.render('online', { users });
    });
});

module.exports = router;
