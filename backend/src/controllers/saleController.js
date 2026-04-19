const Sale = require('../models/Sale');
const Product = require('../models/Product');
const mongoose = require('mongoose');

exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { productId, quantitySold, date, customerName, customerPhone, customerAddress } = req.body;

    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.quantity < quantitySold) {
      throw new Error('Insufficient stock available');
    }

    // Deduct stock
    product.quantity -= quantitySold;
    await product.save({ session });

    const totalAmount = quantitySold * product.price;

    const sale = new Sale({
      product: product._id,
      productName: product.name,
      quantitySold,
      priceAtSale: product.price,
      totalAmount,
      date: date || new Date(),
      customerName,
      customerPhone,
      customerAddress
    });

    await sale.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    // Per previous UI logic, deleting a sale record does NOT restock inventory. 
    // It merely removes the log entry.
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
