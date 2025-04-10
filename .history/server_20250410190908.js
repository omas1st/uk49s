// server.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const path = require('path');
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 3000;

// ----- Configuration ----- //
const MONGO_URI = "mongodb+srv://omas1st:00oS5gHmnSiEAnaa@omas.wa2cr.mongodb.net/uk49sauth?retryWrites=true&w=majority&appName=Omas";
const secretKey = "691dab64803c6cb854099ba5a7f4cc382970746eb9e4cc6aaaec3bff15c7554b6cd4d6e0ed000a0bf56ac0d9eb4e9acc9db935f312df5fb2a8e10932d6fa9dc7";

// ----- Middleware ----- //
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// ----- Session ----- //
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI })
}));

// ----- Mongoose Connection ----- //
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// ----- Nodemailer Transporter ----- //
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'yourgmail@gmail.com',
    pass: process.env.GMAIL_PASS || 'yourGmailPassword'
  }
});

// Helper function to send email notification to admin
function notifyAdmin(subject, text) {
  const mailOptions = {
    from: process.env.GMAIL_USER || 'yourgmail@gmail.com',
    to: 'uk49wins@gmail.com',
    subject,
    text
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Error sending email:", error);
    else console.log("Email sent:", info.response);
  });
}

// ----- Authentication Middleware ----- //
function ensureAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

function ensureAdmin(req, res, next) {
  // In this demo, we treat a user with email 'admin@uk49wins.com' as admin.
  if (req.session.userId && req.session.userEmail === 'admin@uk49wins.com') return next();
  res.redirect('/dashboard');
}

// ----- Routes ----- //

// Home route redirects to login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Registration
app.get('/register', (req, res) => {
  res.render('register');
});
app.post('/register', async (req, res) => {
  const { username, name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    username,
    name,
    email,
    password: hashedPassword,
    approvedUrls: Array(15).fill({ url: '', approved: false })
  });
  try {
    await newUser.save();
    // Notify admin on new registration
    notifyAdmin("New Registration", `A new user has registered: ${name} (${email})`);
    res.redirect('/login');
  } catch(err) {
    console.error(err);
    res.send("Error during registration.");
  }
});

// Login
app.get('/login', (req, res) => {
  res.render('login');
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.send("User not found.");
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Invalid password.");
    
    // Set session
    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    // update lastLogin field
    user.lastLogin = new Date();
    await user.save();

    // Notify admin on login
    notifyAdmin("User Login", `User ${user.name} (${user.email}) has logged in.`);
    
    // Redirect admin to admin panel if email matches admin email
    if(user.email === 'admin@uk49wins.com') {
      res.redirect('/admin');
    } else {
      res.redirect('/dashboard');
    }
  } catch(err) {
    console.error(err);
    res.send("Error during login.");
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Dashboard for normal users
app.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    // Determine continue button URL: if any approved URL exists (take first approved) then use that, otherwise default.
    let continueUrl = "bit.ly/uk49wins";
    for (let record of user.approvedUrls) {
      if (record.url && record.approved) {
        continueUrl = record.url;
        break;
      }
    }
    res.render('dashboard', { name: req.session.userName, continueUrl, infoMsg: user.infoMsg || "" });
  } catch(err) {
    console.error(err);
    res.send("Error loading dashboard.");
  }
});

// User message form submission from dashboard
app.post('/send-message', ensureAuthenticated, async (req, res) => {
  const { username, message } = req.body;
  if (!username || !message) return res.send("Username and message required.");
  
  // Save message in database (if you need to record it) or simply send email.
  const newMessage = new Message({
    sender: username,
    message,
    createdAt: new Date()
  });
  try {
    await newMessage.save();
    // Send email to admin
    notifyAdmin("New Message from User", `User ${username} sent the message:\n\n${message}`);
    res.redirect('/dashboard');
  } catch(err) {
    console.error(err);
    res.send("Error sending message.");
  }
});

// ----- ADMIN PANEL ----- //
// Display list of users with search functionality
app.get('/admin', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const searchQuery = req.query.search || "";
  // search by email, name, or username (case-insensitive)
  const regex = new RegExp(searchQuery, 'i');
  let users = await User.find({
    $or: [
      { email: regex },
      { name: regex },
      { username: regex }
    ]
  });
  res.render('admin', { users, searchQuery });
});

// Delete user (admin action)
app.post('/admin/delete/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
  } catch(err) {
    console.error(err);
    res.send("Error deleting user.");
  }
});

// Edit user URLs (admin action)
app.get('/admin/edit/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.render('editUser', { user });
  } catch(err) {
    console.error(err);
    res.send("Error loading edit page.");
  }
});
app.post('/admin/edit/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    // Expect 15 url inputs named url0 to url14 and corresponding approve/disapprove buttons
    let newUrlArr = [];
    for (let i = 0; i < 15; i++) {
      const url = req.body[`url${i}`] || "";
      // button value: "approve" or "disapprove" for each url input (if not provided, default to disapproved)
      const action = req.body[`action${i}`] || "disapprove";
      newUrlArr.push({
        url,
        approved: (action === "approve")
      });
    }
    user.approvedUrls = newUrlArr;
    await user.save();
    res.redirect('/admin');
  } catch(err) {
    console.error(err);
    res.send("Error updating user URLs.");
  }
});

// Admin setting an information message for a user
app.get('/admin/info/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.render('infoPage', { user });
  } catch(err) {
    console.error(err);
    res.send("Error loading info page.");
  }
});
app.post('/admin/info/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { infoMsg } = req.body;
    let user = await User.findById(req.params.id);
    user.infoMsg = infoMsg;
    await user.save();
    res.redirect('/admin');
  } catch(err) {
    console.error(err);
    res.send("Error updating user information.");
  }
});

// Page to list online users and last login history
app.get('/admin/online', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    // For demo, “online” users are those with a session active.
    // Here, we simply list all users along with their lastLogin date.
    const users = await User.find({});
    res.render('onlineUsers', { users });
  } catch(err) {
    console.error(err);
    res.send("Error loading online users.");
  }
});

// ----- Start Server ----- //
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
