const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  note: { type: String, default: '' },
}, { timestamps: true });

const labourCostSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
}, { timestamps: true });

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true, default: '' },
  contact: { type: String, trim: true, default: '' },
  gstNumber: { type: String, trim: true, default: '' },
  totalPayment: { type: Number, default: 0, min: 0 },
  payments: [paymentSchema],
  labourCosts: [labourCostSchema],
}, { timestamps: true });

// Virtual: total paid
clientSchema.virtual('totalPaid').get(function () {
  return this.payments.reduce((sum, p) => sum + p.amount, 0);
});

// Virtual: remaining
clientSchema.virtual('remainingPayment').get(function () {
  return this.totalPayment - this.totalPaid;
});

// Virtual: total labour
clientSchema.virtual('totalLabourCost').get(function () {
  return this.labourCosts.reduce((sum, l) => sum + l.amount, 0);
});

// Virtual: profit/loss
clientSchema.virtual('profitLoss').get(function () {
  return this.totalPaid - this.totalLabourCost;
});

clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Client', clientSchema);
