// server.js
const express    = require('express');
const mongoose   = require('mongoose');
const session    = require('express-session');
const flash      = require('connect-flash');
const bodyParser = require('body-parser');
const path       = require('path');

const app = express();

// Connect to MongoDB using your provided URI
mongoose.connect('mongodb+srv://omas1st:00oS5gHmnSiEAnaa@omas.wa2cr.mongodb.net/uk49sauth?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure express sessions using your secret key
app.use(session({
    secret: '691dab64803c6cb854099ba5a7f4cc382970746eb9e4cc6aaaec3bff15c7554b6cd4d6e0ed000a0bf56ac0d9eb4e9acc9db935f312df5fb2a8e10932d6fa9dc7',
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

// Set public folder for CSS files etc.
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
