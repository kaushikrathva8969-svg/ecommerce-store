const express = require('express');

const { protect } = require('../middleware/authMiddleware');

const { addToCart , getCart, removeFromCart, updateCartQuantity } = require('../controllers/cartController');

const cartRouter = express.Router();

cartRouter.post('/', protect, addToCart);
cartRouter.get('/', protect, getCart);
cartRouter.delete('/', protect, removeFromCart);
cartRouter.put('/', protect, updateCartQuantity);

module.exports = cartRouter;

