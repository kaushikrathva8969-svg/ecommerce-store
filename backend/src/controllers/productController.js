const mongoose = require('mongoose');
const Product = require('../models/Product');

const createProduct = async (req, res) => {
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const category = req.body.category;
    const stock = req.body.stock;
    const image = req.body.image

    const product = await Product.create(
        { 
            name, 
            description, 
            price, 
            category, 
            stock, 
            image });

    res.status(201).json(product);
}

const getProducts = async (req, res) => {
    const products = await Product.find();
    res.status(200).json(products);
}

const getProductById = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
}

const updateProduct = async (req, res) => {
    const  updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedProduct);
}

const deleteProduct = async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product deleted successfully" });
}

module.exports = { createProduct , getProducts, getProductById , updateProduct , deleteProduct};