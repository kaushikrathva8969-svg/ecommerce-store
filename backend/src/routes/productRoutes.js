const express = require('express');

const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const productRouter = express.Router();

productRouter.post('/', protect, adminOnly, createProduct);

productRouter.get('/', getProducts);

productRouter.get('/:id', getProductById);

productRouter.put('/:id', protect, adminOnly, updateProduct);

productRouter.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = productRouter;