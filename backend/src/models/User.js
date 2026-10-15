const mongoose = require('mongoose');

const userSchema = mongoose.Schema({

    name:{
        type: String,
        required:[true,"Full Name is Required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
    },
    password:{
        type: String,
        required:[true, "Password is required"],
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer',
    },
});

module.exports = mongoose.model('User', userSchema);