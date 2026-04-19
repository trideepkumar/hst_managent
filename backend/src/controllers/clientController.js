const Client = require('../models/Client');

// GET /api/clients
const getClients = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = { $or: [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
      ]};
    }
    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: clients });
  } catch (err) {
    next(err);
  }
};

// GET /api/clients/:id
const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

// POST /api/clients
const createClient = async (req, res, next) => {
  try {
    const { name, address, contact, gstNumber, totalPayment } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Client name is required' });
    const client = await Client.create({ name, address, contact, gstNumber, totalPayment: totalPayment || 0 });
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

// PUT /api/clients/:id
const updateClient = async (req, res, next) => {
  try {
    const { name, address, contact, gstNumber, totalPayment } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { name, address, contact, gstNumber, totalPayment },
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/clients/:id
const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/clients/:id/payments
const addPayment = async (req, res, next) => {
  try {
    const { amount, date, note } = req.body;
    if (!amount || isNaN(amount)) return res.status(400).json({ success: false, message: 'Valid amount is required' });
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    client.payments.push({ amount: Number(amount), date: date || new Date(), note: note || '' });
    await client.save();
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/clients/:id/payments/:paymentId
const deletePayment = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    client.payments = client.payments.filter(p => p._id.toString() !== req.params.paymentId);
    await client.save();
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

// PUT /api/clients/:id/payments/:paymentId
const updatePayment = async (req, res, next) => {
  try {
    const { amount, date, note } = req.body;
    if (!amount || isNaN(amount)) return res.status(400).json({ success: false, message: 'Valid amount is required' });
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    const payment = client.payments.id(req.params.paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    payment.amount = Number(amount);
    if (date) payment.date = date;
    if (note !== undefined) payment.note = note;
    await client.save();
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

// POST /api/clients/:id/labour
const addLabourCost = async (req, res, next) => {
  try {
    const { amount, date, description } = req.body;
    if (!amount || isNaN(amount)) return res.status(400).json({ success: false, message: 'Valid amount is required' });
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    client.labourCosts.push({ amount: Number(amount), date: date || new Date(), description: description || '' });
    await client.save();
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/clients/:id/labour/:labourId
const deleteLabourCost = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    client.labourCosts = client.labourCosts.filter(l => l._id.toString() !== req.params.labourId);
    await client.save();
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

// PUT /api/clients/:id/labour/:labourId
const updateLabourCost = async (req, res, next) => {
  try {
    const { amount, date, description } = req.body;
    if (!amount || isNaN(amount)) return res.status(400).json({ success: false, message: 'Valid amount is required' });
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    const labour = client.labourCosts.id(req.params.labourId);
    if (!labour) return res.status(404).json({ success: false, message: 'Labour cost not found' });
    labour.amount = Number(amount);
    if (date) labour.date = date;
    if (description !== undefined) labour.description = description;
    await client.save();
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};

// GET /api/clients/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const clients = await Client.find();
    const totalClients = clients.length;
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalPaid, 0);
    const totalLabour = clients.reduce((sum, c) => sum + c.totalLabourCost, 0);
    const totalProfit = totalRevenue - totalLabour;
    const totalPending = clients.reduce((sum, c) => sum + Math.max(0, c.remainingPayment), 0);
    const recentClients = clients.slice(0, 5).map(c => ({
      _id: c._id,
      name: c.name,
      contact: c.contact,
      totalPayment: c.totalPayment,
      totalPaid: c.totalPaid,
      remainingPayment: c.remainingPayment,
      profitLoss: c.profitLoss,
    }));
    res.json({ success: true, data: { totalClients, totalRevenue, totalLabour, totalProfit, totalPending, recentClients } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient, addPayment, updatePayment, deletePayment, addLabourCost, updateLabourCost, deleteLabourCost, getDashboard };
