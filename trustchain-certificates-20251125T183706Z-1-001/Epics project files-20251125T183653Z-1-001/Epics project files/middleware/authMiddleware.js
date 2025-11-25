// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Get token from header (Client sends it as: x-auth-token: <token>)
    const token = req.header('x-auth-token'); 

    // Check if token is missing (401 Unauthorized)
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // 2. Verify token using the JWT_SECRET from your .env file
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Attach user data (id, role) to the request object. 
        // The controller uses this to know *who* is issuing the certificate.
        req.user = decoded.user;

        // 4. Move on to the controller function
        next(); 

    } catch (err) {
        // Token is invalid, expired, or corrupted
        res.status(401).json({ msg: 'Token is not valid or has expired' });
    }
};