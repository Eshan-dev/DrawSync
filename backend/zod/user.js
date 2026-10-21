const zod = require('zod');
const userSignupSchema = zod.object({
    name: zod.string().min(3, "Name must be at least 3 characters long"),
    email: zod.string().email("Invalid email address"),
    password: zod.string().min(6, "Password must be at least 6 characters long"),
});
module.exports = { userSignupSchema };