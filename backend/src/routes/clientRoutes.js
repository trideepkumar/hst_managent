const express = require('express');
const router = express.Router();
const {
  getClients, getClientById, createClient, updateClient, deleteClient,
  addPayment, deletePayment, addLabourCost, deleteLabourCost, getDashboard
} = require('../controllers/clientController');

router.get('/dashboard', getDashboard);
router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
router.post('/:id/payments', addPayment);
router.delete('/:id/payments/:paymentId', deletePayment);
router.post('/:id/labour', addLabourCost);
router.delete('/:id/labour/:labourId', deleteLabourCost);

module.exports = router;
