// server.js
require('dotenv').config(); // Load environment variables

const express    = require('express');
const mongoose   = require('mongoose');
const session    = require('express-session');
const flash      = require('connect-flash');
const bodyParser = require('body-parser');
const path       = require('path');

const app = express();

// Connect to MongoDB using the URI from .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure sessions using secret from .env
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: true,
  saveUninitialized: true
}));

// Connect Flash for flash messages
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg   = req.flash('error_msg');
  res.locals.error       = req.flash('error');
  next();
});

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Default route to redirect "/" to login page
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Routes
const authRoutes      = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes     = require('./routes/admin');

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);

// Use port 3001 unless overridden by environment variable
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
