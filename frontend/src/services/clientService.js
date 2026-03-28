import api from './api';

export const getClients = async (search = '') => {
  const res = await api.get(`/clients${search ? `?search=${search}` : ''}`);
  return res.data;
};

export const getClientById = async (id) => {
  const res = await api.get(`/clients/${id}`);
  return res.data;
};

export const createClient = async (data) => {
  const res = await api.post('/clients', data);
  return res.data;
};

export const updateClient = async (id, data) => {
  const res = await api.put(`/clients/${id}`, data);
  return res.data;
};

export const deleteClient = async (id) => {
  await api.delete(`/clients/${id}`);
};

export const addPayment = async (clientId, data) => {
  const res = await api.post(`/clients/${clientId}/payments`, data);
  return res.data;
};

export const deletePayment = async (clientId, paymentId) => {
  const res = await api.delete(`/clients/${clientId}/payments/${paymentId}`);
  return res.data;
};

export const addLabourCost = async (clientId, data) => {
  const res = await api.post(`/clients/${clientId}/labour`, data);
  return res.data;
};

export const deleteLabourCost = async (clientId, labourId) => {
  const res = await api.delete(`/clients/${clientId}/labour/${labourId}`);
  return res.data;
};

export const getDashboard = async () => {
  const res = await api.get('/clients/dashboard');
  return res.data;
};
