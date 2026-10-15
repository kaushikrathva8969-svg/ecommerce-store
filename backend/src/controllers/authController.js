const User = require('../models/User');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req,res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password,10);

    await User.create({
        name,
        email,
        password: hashedPassword
    });

    res.status(201).json({ message: "User registered successfully" });
}

const loginUser = async (req,res) => {
    const email = req.body.email;
    const password = req.body.password;

    const existingUser = await User.findOne({ email: email });
    
    if(!existingUser) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcryptjs.compare(password, existingUser.password);

    if(!isMatch) {
        return res.status(400).json({ message: "Invalid email or password"})
    }

    const token = jwt.sign(
        {id: existingUser._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }   
    );

    res.status(200).json({
        message: "Login successful",
        token: token,
        role: existingUser.role,
    });
}

module.exports = { registerUser, loginUser};