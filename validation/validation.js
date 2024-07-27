const zod = require('zod');

const signupSchema = zod.object({
    name: zod.string().min(3).max(50),
    email: zod.string().email(),
    password: zod.string().min(6).max(50)
});

const veryfyOTPSchema = zod.object({
    email: zod.string().email(),
    otp: zod.string().length(6)
});

const loginSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(6).max(50)
}); 
module.exports = {signupSchema, veryfyOTPSchema,loginSchema};