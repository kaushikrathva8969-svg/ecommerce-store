const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const reduceStock = async (items) => {
  const updates = items.map(({ product, quantity }) =>
    Product.updateOne({ _id: product }, { $inc: { stock: -quantity } })
  );

  await Promise.all(updates);
};

const createOrder = async (req, res) => {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Your cart is empty' });
    }

    // Check every item before creating the order
    for (const item of cart.items) {
        if (!item.product) {
            return res.status(400).json({ message: 'Some products in your cart are no longer available' });
        }
        if (item.product.stock < item.quantity) {
            return res.status(400).json({
                message: `Not enough stock for "${item.product.name}" (only ${item.product.stock} left)`,
            });
        }
    }

    const orderItems = cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const paymentMethod = req.body.paymentMethod === 'cod' ? 'cod' : 'online';

    const order = await Order.create({
        user: userId,
        items: orderItems,
        totalAmount: totalAmount,
        shippingAddress: req.body.shippingAddress,
        paymentMethod: paymentMethod,
        status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
    });

    if (paymentMethod === 'cod') {
        await reduceStock(orderItems);
    }

    cart.items = [];
    await cart.save();

    res.status(201).json(order);
};

const getOrders = async (req, res) => {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId });

    res.status(200).json(orders);
};

const getAllOrders = async (req, res) => {
    const allOders = await Order.find().populate('user', 'name email').populate('items.product', 'name').sort({ createdAt: -1 });

    res.status(200).json(allOders);
};


const updateOrderStatus = async (req, res) => {
    const { status } = req.body;

    // Admins can update order fulfillment, not payment verification.
    const allowed = ['confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid order id' });
    }

    if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // Online orders must be paid before they can be shipped.
    if (
        ['shipped', 'delivered'].includes(status) &&
        order.paymentMethod === 'online' &&
        order.status !== 'paid' &&
        !['shipped', 'delivered'].includes(order.status)
    ) {
        return res.status(400).json({
            message: 'Cannot ship an online order before payment is verified'
        });
    }

    order.status = status;
    await order.save();

    res.status(200).json(order);
};


const buyNow = async (req, res) => {
    const { productId, shippingAddress } = req.body;
    const quantity = Number(req.body.quantity);

    if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Invalid product or quantity' });
    }

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
        return res.status(400).json({ message: `Only ${product.stock} in stock` });
    }

    const paymentMethod = req.body.paymentMethod === 'cod' ? 'cod' : 'online';
    const orderItems = [{ product: product._id, quantity: quantity, price: product.price }];

    const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        totalAmount: product.price * quantity,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod,
        status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
    });

    if (paymentMethod === 'cod') {
        await reduceStock(orderItems);
    }

    res.status(201).json(order);
};

const cancelOrder = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid order id' });
    }

    // Only the owner can cancel, and only before payment or shipping.
    // One update means a double click can't restore the stock twice.
    const order = await Order.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id, status: { $in: ['pending', 'confirmed'] } },
        { status: 'cancelled' }
    );

    if (!order) {
        return res.status(400).json({ message: 'This order cannot be cancelled' });
    }

    // COD orders ('confirmed') already reduced the stock, so put it back
    if (order.status === 'confirmed') {
        await Promise.all(
            order.items.map((item) =>
                Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
            )
        );
    }

    res.status(200).json({ message: 'Order cancelled' });
};

module.exports = { createOrder , getOrders , getAllOrders, updateOrderStatus , buyNow, cancelOrder };