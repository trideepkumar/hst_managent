const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantitySold: {
    type: Number,
    required: true,
    min: 1,
  },
  priceAtSale: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    default: '',
  },
  customerAddress: {
    type: String,
    default: '',
  }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
