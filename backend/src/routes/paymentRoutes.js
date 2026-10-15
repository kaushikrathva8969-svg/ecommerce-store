const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createPaymentOrder , verifyPayment } = require('../controllers/paymentController');

const paymentRouter = express.Router();

paymentRouter.post('/create-order', protect, createPaymentOrder);
paymentRouter.post('/verify', protect, verifyPayment);

module.exports = paymentRouter;