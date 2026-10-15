const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { createOrder, getOrders, getAllOrders, updateOrderStatus, buyNow , cancelOrder} = require('../controllers/orderController');

const orderRouter = express.Router();

orderRouter.post('/', protect, createOrder);
orderRouter.get('/', protect, getOrders);
orderRouter.get('/all', protect, adminOnly, getAllOrders);
orderRouter.put('/:id/status', protect, adminOnly, updateOrderStatus);
orderRouter.post('/buy-now', protect, buyNow);
orderRouter.put('/:id/cancel', protect, cancelOrder);

module.exports = orderRouter;