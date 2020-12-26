const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware


// Routes
// GET
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to the API!'
    });
});

// POST
app.post('/api/login', (req, res) => {
    // Mock user
    const user = {
        id: 1,
        username: 'smems',
        email: 'smems@smems.smems'
    }

    jwt.sign({user}, 'secretKey', (err, token) => {
        res.json({
            token
        });
    });
});

app.post('/api/posts', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretKey', (err, authData) => {
        if (err) {
            res.sendStatus(403);
        }
        else {
            res.json({
                message: 'Post',
                authData
            });
        }
    });
});

// TOKEN FORMAT
// Authorization: Bearer <access_token>

function verifyToken(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];

    // Check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {

        const bearer = bearerHeader.split(' ');

        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;
        next();
    }
    else {
        // Forbidden
        res.sendStatus(403);
    }
}

const port = process.env.PORT | 3000;
app.listen(port, () => console.log(`Server started on PORT ${port}`));