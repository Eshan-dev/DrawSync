require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_ACCESS_PASS = process.env.JWT_ACCESS_PASS;
const JWT_REFRESH_PASS = process.env.JWT_REFRESH_PASS;

const authenticationMiddleware = async function (req, res, next) {
    let authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    // Strip accidental quotes or extra whitespace (common when testing with Postman/curl)
    authHeader = authHeader.trim().replace(/^["']|["']$/g, '');

    if (!authHeader.toLowerCase().startsWith('bearer ')) {
        return res.status(401).json({ message: 'Invalid token format. Expected: Bearer <token>' });
    }

    const token = authHeader.split(' ')[1]?.trim().replace(/^["']|["']$/g, '');
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_ACCESS_PASS);
        req.email = decoded.email;
        next();
    }
    catch (error) {
        if (error.message === 'jwt expired') {
            return res.status(403).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: "Invalid Token" });
    }
};

module.exports = authenticationMiddleware;