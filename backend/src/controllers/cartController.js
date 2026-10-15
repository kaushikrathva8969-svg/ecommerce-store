const mongoose = require('mongoose');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const addToCart = async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.body;
    const quantity = Number(req.body.quantity);

    if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Invalid product or quantity' });
    }

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: userId });

    let quantityInCart = 0;
    
    if (cart) {
        const existing = cart.items.find(item => item.product.toString() === productId);
        if (existing) quantityInCart = existing.quantity;
    }

    if (quantityInCart + quantity > product.stock) {
        return res.status(400).json({
            message: `Only ${product.stock} in stock (you already have ${quantityInCart} in your cart)`,
        });
    }

    if (!cart) {
        // new cart: just create it with the item
        cart = new Cart({
            user: userId,
            items: [{ product: productId, quantity }]
        });
    } else {
        // cart already exists: increase quantity or add a new item
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }
    }

    await cart.save();
    res.status(200).json(cart);
}

const getCart = async (req, res) => {
    const userId = req.user._id;

    const cart = await Cart.findOne({user: userId }).populate('items.product');

    res.status(200).json(cart);
}

const removeFromCart = async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
    );

    await cart.save();

    res.status(200).json(cart);
};


const updateCartQuantity = async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.body;
    const quantity = Number(req.body.quantity);

    if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Invalid product or quantity' });
    }

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    if (quantity > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} in stock` });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
        return res.status(404).json({ message: 'Item not in cart' });
    }

    item.quantity = quantity;
    await cart.save();

    res.status(200).json(cart);
};

module.exports = { addToCart , getCart, removeFromCart, updateCartQuantity};