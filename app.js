const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const app = express();

dotenv.config();

// Mock Users for testing
const users = [
    {
        id: 1,
        username: 'smems',
        password: '123456'
    },
    {
        id: 2,
        username: 'admin',
        password: 'admin'
    },
]

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/api/users', authenticateToken);

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
        next();
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
    res.json({
        users: users
    });
});

// POST
app.post('/api/login', (req, res) => {
    // Get user data
    const username = req.body.username;

    const user = users[0]; // Use mock user object for now

    if (user) {
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

app.post('/api/posts', authenticateToken, (req, res) => {
    console.log(req.user.username);
    res.json({
        message: 'Post',
        user: req.user
    });
});


const port = process.env.PORT | 3000;
app.listen(port, () => console.log(`Server running on PORT ${port}...`));