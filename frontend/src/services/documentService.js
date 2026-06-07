import api from './api';

export const getDocuments = async (type) => {
  const data = await api.get('/documents', { params: { type } });
  return data;
};

export const getDocumentById = async (id) => {
  const data = await api.get(`/documents/${id}`);
  return data;
};

export const saveDocument = async (documentData) => {
  const data = await api.post('/documents', documentData);
  return data;
};

export const deleteDocument = async (id) => {
  const data = await api.delete(`/documents/${id}`);
  return data;
};
