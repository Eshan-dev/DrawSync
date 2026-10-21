require('dotenv').config();
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModels");
const validator = require("validator");
const JWT_ACCESS_PASS = process.env.JWT_ACCESS_PASS;
const JWT_REFRESH_PASS = process.env.JWT_REFRESH_PASS;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';


async function registerUser(req, res) {
    try {
        const { name, email, password } = req.body;
        if (!validator.isEmail(email)) {
            throw new Error("Invalid Email");
        }
        if (!validator.isStrongPassword(password)) {
            throw new Error("Password is too weak");
        }
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" })
        }
        const newUser = await userModel.register(name, email, password);
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                createdAt: newUser.createdAt,
            }
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}
async function loginUser(req, res) {
    // console.log("HERE");
    try {
        const { email, password } = req.body;

        const user = await userModel.login(email, password);
        const access_token = jwt.sign({
            email: user.email

        }, JWT_ACCESS_PASS, {
            expiresIn: JWT_ACCESS_EXPIRES_IN
        });
        const refresh_token = jwt.sign({
            email: user.email,
        }, JWT_REFRESH_PASS, {
            expiresIn: JWT_REFRESH_EXPIRES_IN
        })

        return res.status(200).json({
            message: "Login successful",
            access_token,
            refresh_token,
        })
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
}
async function getProfile(req, res) {
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
        const user = await userModel.getUser(decoded.email);
        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }
        return res.status(200).json({
            message: "User profile retrieved successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
        });
    }
    catch (error) {
        if (error.message == "jwt expired") {
            return res.status(403).json({ message: error.message });
        }
        return res.status(401).json({ message: error.message });
    }
}
async function refreshToken(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization Header Missing" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_REFRESH_PASS);
        if (!decoded || !decoded.email) {
            return res.status(401).json({
                message: "Invalid Token"
            });
        }
        const newAccessToken = jwt.sign({
            email: decoded.email
        }, JWT_ACCESS_PASS, { expiresIn: JWT_ACCESS_EXPIRES_IN });

        res.status(200).json({
            message: "Access Token Refreshed Successfully",
            access_token: newAccessToken
        });
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
}
module.exports = { registerUser, loginUser, getProfile, refreshToken };