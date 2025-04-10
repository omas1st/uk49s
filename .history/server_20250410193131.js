// server.js
require('dotenv').config(); // Load .env file first

const express    = require('express');
const mongoose   = require('mongoose');
const session    = require('express-session');
const flash      = require('connect-flash');
const bodyParser = require('body-parser');
const path       = require('path');

const app = express();

// Connect to MongoDB using the URI from .env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
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

// Connect Flash
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

// Set public folder for static files (CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes      = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes     = require('./routes/admin');

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
