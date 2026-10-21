require('dotenv').config();
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModels');
const JWT_ACCESS_PASS = process.env.JWT_ACCESS_PASS;

async function protectRoute(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization Header Missing" })
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_ACCESS_PASS);
        if (!decoded || !decoded.email) {
            return res.status(401).json({
                message: "Invalid Token"
            })
        }
        //console.log(decoded.email);
        const user = await userModel.getUser(decoded.email);
        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }
        try {
            req.user = user;
            next();
        }
        catch (error) {
            return res.status(401).json({
                message: "User not found"
            })
        }
    }
    catch (error) {
        if (error.message == "jwt expired") {
            return res.status(403).json({ message: error.message });
        }
        return res.status(401).json({ message: error.message });
    }
}
module.exports = { protectRoute };