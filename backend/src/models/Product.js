const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name:{
        type: String,
        required:[true,"Product name is required"],
    },
    description:{
        type: String
    },
    price:{
        type: Number,
        required:[true,"Product price is required"],
    },
    category:{
        type: String,
    },
    stock:{
        type: Number,
        default: 0
    },
    image:{
        type: String,
    },
});

module.exports = mongoose.model('Product', productSchema);