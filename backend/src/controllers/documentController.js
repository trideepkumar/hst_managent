const Document = require('../models/Document');

exports.getDocuments = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};
    const documents = await Document.find(filter).sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    next(error);
  }
};

exports.getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findOne({ id: req.params.id });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    res.status(200).json(document);
  } catch (error) {
    next(error);
  }
};

exports.saveDocument = async (req, res, next) => {
  try {
    const docData = req.body;
    if (!docData.id || !docData.type) {
      return res.status(400).json({ success: false, message: 'Document ID and type are required' });
    }

    const document = await Document.findOneAndUpdate(
      { id: docData.id },
      docData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(document);
  } catch (error) {
    next(error);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOneAndDelete({ id: req.params.id });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};
