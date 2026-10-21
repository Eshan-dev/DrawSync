const express = require('express');
const { registerUser, loginUser, getProfile, refreshToken } = require("../controllers/userController.js");
const router = express.Router();
router.post("/register", registerUser);
router.post('/login', loginUser);
router.post('/profile', getProfile);
router.post('/refresh', refreshToken);
const { protectRoute } = require('../middlewares/protectRoute');
router.post('/protect', protectRoute, (req, res) => {
    res.status(200).json({ message: "Protected route successfully" });
});
module.exports = router;
