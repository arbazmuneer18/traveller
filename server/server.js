const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for Base64 images

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/properties', require('./routes/properties'));

// Root Route
app.get('/', (req, res) => {
    res.send('Apple Travel Agency API is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Keep-alive: ping self every 14 minutes to prevent Render free tier from sleeping (15 min idle timeout)
    setInterval(() => {
        const http = require('http');
        const https = require('https');
        const url = new URL(SERVER_URL);
        const client = url.protocol === 'https:' ? https : http;
        client.get(`${SERVER_URL}/`, (res) => {
            console.log(`[Keep-Alive] Ping sent. Status: ${res.statusCode}`);
        }).on('error', (err) => {
            console.warn(`[Keep-Alive] Ping failed: ${err.message}`);
        });
    }, 14 * 60 * 1000);
});
