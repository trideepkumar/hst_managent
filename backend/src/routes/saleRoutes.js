const express = require('express');
const router = express.Router();
const { getSales, createSale, deleteSale } = require('../controllers/saleController');

router.route('/')
  .get(getSales)
  .post(createSale);

router.route('/:id')
  .delete(deleteSale);

module.exports = router;
