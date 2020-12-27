const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const monk = require('monk');
const bcrypt = require('bcrypt');


const app = express();

dotenv.config();

const db = monk(process.env.MONGO_URI);
db.then(() => {
    console.log('Connected to mongodb server...')
})

const usersdb = db.get('users');
usersdb.createIndex('username');

const saltRounds = 10;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// TOKEN FORMAT
// Authorization: Bearer <access_token>
function authenticateToken(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];

    // Check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1]; // Get token from array
        req.token = bearerToken; // Set the token
    }
    else {
        res.sendStatus(401); // Unauthorized
    }

    // Verify user
    jwt.verify(req.token, process.env.TOKEN_SECRET, (err, user) => {
        if (err) {
            res.sendStatus(403); // Forbidden
        }
        else { // User verified
            req.user = user;
            next();
        }
    });
}

// Routes
// GET
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to the API!'
    });
});

app.get('/api/users', authenticateToken, (req, res) => {
    const filter = req.body.filter;

    if (filter === 'all') {
        usersdb.find({}).then((docs) => {
            res.json({
                users: docs
            });
        })
    }
});

app.get('/api/logout', (req, res) => {
    res.json({
        message: 'Logged out'
    });
});

// POST
app.post('/api/login', async (req, res) => {
    // Get user data
    const username = req.body.username;
    const password = req.body.password;

    // Find if username exists in database. if not, show error
    const user = await usersdb.findOne({username});
    // Compare pass with hashed pass stored in db
    bcrypt.compare(password, user.password, (err, result) => {
        if (err) return res.json({message: err});
        if (!result) return res.json({message: 'Username or Password incorrect.'});

        jwt.sign({user}, process.env.TOKEN_SECRET, {expiresIn: '1h'}, (err, token) => {
            if (err) return res.json({message: err});
            res.json({
                token
            });
        });
    });


});

app.post('/api/register', (req, res) => {
    const {username, password} = req.body;

    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) return res.json({message: err});
        // Store hash in your password DB.
        usersdb.insert({
            username: username,
            password: hash
        }).then((docs) => {
            res.json({
                message: 'Register',
                docs
            });
        }).catch((err) => {
            res.sendStatus(500).json({message: err});
        })
    });
});

app.post('/api/posts', authenticateToken, (req, res) => {
    res.json({
        message: 'Post',
        user: req.user
    });
});


const port = process.env.PORT | 3000;
app.listen(port, () => console.log(`Server running on PORT ${port}...`));