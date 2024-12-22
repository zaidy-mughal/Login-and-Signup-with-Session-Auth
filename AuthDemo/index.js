const express = require('express');
const app = express();
const User = require('./models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/AuthDemo')
    .then(() => {
        console.log('Mongo Connection Open!');
    })
    .catch(err => {
        console.log('Mongo Connection Error!');
        console.log(err);
    });


app.set('view engine', 'ejs');
app.set('views', 'views');

// parse the request body
app.use(express.urlencoded({extended: true}));

// Session configuration
app.use(session({
    secret: 'agi', // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// main page
app.get('/', (req, res) => {
    res.render('home');
});


// Register routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 12);
        const user = new User({ username, password: hash });
        await user.save();
        req.session.user_id = user._id;
        res.redirect('/secret');
    } catch (err) {
        console.log(err);
        res.send(`Error! Please try again! {err}`);
    }
});


app.get('/register', async (req, res) => {
    res.render('register');
});



// Login routes
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.render('login', { error: 'Invalid username or password' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.render('login', { error: 'Invalid username or password' });
        }
        
        req.session.user_id = user._id;
        return res.redirect('/secret');
    } catch (err) {
        console.error(err);
        return res.render('login', { error: 'An error occurred' });
    }
});


app.get('/login', async (req, res) => {
    res.render('login');
});


// Logout route
app.post('/logout', (req, res) => { 
    req.session.user_id = null;
    req.session.destroy(err => {
        if (err) {
            console.log('Error destroying session');
            return;
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});


// Secret route
app.get('/secret', (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/login');  // Return here to stop execution
    }
    res.render('secret');
});


// listen on port 3000
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});