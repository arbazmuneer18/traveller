const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Expected header format: "Bearer <token>"
    const bearerHeader = req.headers['authorization'];

    if (!bearerHeader) {
        return res.status(401).json({ message: 'Access Denied. No authorization token provided.' });
    }

    try {
        const token = bearerHeader.split(' ')[1];
        
        // Throw an error if token is invalid or expired
        const verifiedUser = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user payload to request for downstream route usage
        req.user = verifiedUser;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or Expired Token.' });
    }
};

module.exports = verifyToken;
