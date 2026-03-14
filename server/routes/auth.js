const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Verify credentials against the secure environment variables
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        
        // Credentials matched! Mint a secure JWT token.
        // It expires in 2 hours to limit the windows of attack if compromised.
        const token = jwt.sign(
            { user: username, role: 'admin' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '2h' }
        );

        res.json({ token, message: 'Authentication successful' });
    } else {
        // Invalid credentials, reject immediately
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

module.exports = router;
