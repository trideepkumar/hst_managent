const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. EST-1234 or INV-1234
  type: { type: String, enum: ['estimate', 'invoice'], required: true },
  gstMode: String,
  date: String,
  companyName: String,
  companyAddress: String,
  companyContact: String,
  companyGST: String,
  companyStateCode: String,
  companyEmail: String,
  clientName: String,
  clientAddress: String,
  clientContact: String,
  clientGST: String,
  clientStateCode: String,
  placeOfSupply: String,
  reverseCharge: String,
  items: [mongoose.Schema.Types.Mixed],
  subtotal: String,
  totalDiscount: String,
  totalTaxable: String,
  totalCgst: String,
  totalSgst: String,
  netAmount: String,
  amountInWords: String,
  bankName: String,
  bankBranch: String,
  accountNo: String,
  ifscCode: String,
  accountType: String,
  terms: String,
  logo: String
}, { 
  timestamps: true,
  strict: false // allows flexibility for future additions
});

module.exports = mongoose.model('Document', DocumentSchema);
