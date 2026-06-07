const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocumentById);
router.post('/', documentController.saveDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
