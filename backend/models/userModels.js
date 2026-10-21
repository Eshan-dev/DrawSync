const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const zod = require('zod');
const { userSignupSchema } = require('../zod/user');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxLength: 50,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    }

}, {
    timestamps: true,
    collection: "users",
});

userSchema.statics.register = async function (name, email, password) {
    try {
        const result = userSignupSchema.safeParse({ name, email, password });
        if (!result.success) {
            // console.log(result.error.issues[0].message);
            throw new Error("Invalid input: " + result.error.issues[0].message);
        }
        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = new this({
            name, email, password: hashedPassword
        });
        const newUser = await user.save();
        return newUser;
    }
    catch (error) {
        throw new Error("Error registering user " + error.message);
    }
}
userSchema.statics.getUser = async function (email) {
    try {
        const user = await this.findOne({ email });
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }
    catch (error) {
        throw new Error("Error fetching user" + error.message);
    }
}
userSchema.statics.login = async function (email, password) {
    try {
        const user = await this.findOne({ email });
        if (!user) {
            throw new Error("Invalid Credentials");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid Credentials");
        }
        return user;
    }
    catch (error) {
        throw new Error("Error logging in" + error.message);
    }
}

// userSchema.statics.getProfile = async function (req, res) {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader || !authHeader.startsWith("Bearer ")) {
//             return res.status(401).json({ message: "Authorization Header Missing" })
//         }
//         const token = authHeader.split(" ")[1];
//         const decoded = jwt.verify(token, JWT_PASS);
//         if (!decoded || !decoded.email) {
//             return res.status(401).json({
//                 message: "Invalid Token"
//             })
//         }
//         const user = await userSchema.getUser(decoded.email);
//         if (!user) {
//             return res.status(401).json({
//                 message: "User not found"
//             });
//         }
//         return res.status(200).json({
//             message: "User profile retrieved successfully",
//             user: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 createdAt: user.createdAt,
//                 updatedAt: user.updatedAt
//             },
//         });
//     }
//     catch (error) {
//         return res.status(401).json({ message: error.message });
//     }
// }
module.exports = mongoose.model("Users", userSchema);