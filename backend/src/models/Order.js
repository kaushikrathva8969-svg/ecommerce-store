const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    items:[
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            quantity: {
                type: Number,
            },
            price: {
                type: Number,
            },
        },
    ],
    totalAmount: {
        type: Number,
    },
    shippingAddress: {
        fullName: { type: String },
        phone: { type: String },
        street: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
    },
    razorpayOrderId: { type: String },
    paymentMethod: {
        type: String,
        enum: ['online', 'cod'],
        default: 'online',
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

//What's new: { timestamps: true }

// This is a shortcut option. Instead of manually adding createdAt, passing { timestamps: true } as a second argument to mongoose.Schema(...) makes Mongoose automatically add and manage createdAt and updatedAt for every document.