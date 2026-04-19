import api from './api';

export const getProducts = async () => {
  const res = await api.get('/products');
  return res.data;
};

export const createProduct = async (data) => {
  const res = await api.post('/products', data);
  return res.data;
};

export const updateProduct = async (id, data) => {
  const res = await api.put(`/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};

export const getSales = async () => {
  const res = await api.get('/sales');
  return res.data;
};

export const createSale = async (data) => {
  const res = await api.post('/sales', data);
  return res.data;
};

export const deleteSale = async (id) => {
  const res = await api.delete(`/sales/${id}`);
  return res.data;
};
