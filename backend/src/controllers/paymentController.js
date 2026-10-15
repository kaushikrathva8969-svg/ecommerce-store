const razorpayInstance = require('../config/razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

const createPaymentOrder = async (req, res) => {
    const { orderId } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id });

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status !== 'pending') {
        return res.status(400).json({ message: 'This order cannot be paid online' });
    }

    const razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(order.totalAmount * 100),
        currency: 'INR',
        receipt: `receipt_${order._id}`,
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(200).json(razorpayOrder);
};

const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ message: 'Invalid order id' });
    }

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

    if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Only a pending order, owned by this user, created for THIS Razorpay order, can be marked paid.
    // Doing it in one update also stops the same payment being counted twice.
    const order = await Order.findOneAndUpdate(
        { _id: orderId, user: req.user._id, razorpayOrderId: razorpay_order_id, status: 'pending' },
        { status: 'paid' },
        { new: true }
    );

    if (!order) {
        return res.status(400).json({ message: 'Order not found or already paid' });
    }

    // Payment is confirmed, so now reduce the stock
    await Promise.all(
        order.items.map((item) =>
            Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } })
        )
    );

    res.status(200).json({ message: 'Payment verified successfully' });
};

module.exports = { createPaymentOrder, verifyPayment };