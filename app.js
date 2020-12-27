const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const monk = require('monk');


const app = express();

dotenv.config();

const db = monk(process.env.MONGO_URI);
db.then(() => {
    console.log('Connected to mongodb server...')
})

const usersdb = db.get('users');
usersdb.createIndex('username');



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
    // Hash password
    // Compare hashed pass with hashed pass stored in db
    // if user exists and hashed passwords match; use user object to sign token
    if (username === 'smems' && password === '123456') { // TODO: Change later. Integrate with mongoDB, use hashed passwords

        // Sign and send token
        jwt.sign({user}, process.env.TOKEN_SECRET, {expiresIn: '1h'}, (err, token) => {
            res.json({
                token
            });
        });
    } else {
        res.json({
            error: 'Username or Password incorrect.'
        });
    }


});

app.post('/api/register', (req, res) => {
    const {username, password} = req.body;

    usersdb.insert({
        username: username,
        password: password
    }).then((docs) => {
        res.json({
            message: 'Register',
            docs
        });
    }).catch((err) => {
        res.sendStatus(500).json({message: err});
      })
});

app.post('/api/posts', authenticateToken, (req, res) => {
    res.json({
        message: 'Post',
        user: req.user
    });
});


const port = process.env.PORT | 3000;
app.listen(port, () => console.log(`Server running on PORT ${port}...`));