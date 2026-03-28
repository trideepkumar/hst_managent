import { create } from 'zustand';
import * as clientService from '../services/clientService';

const useClientStore = create((set, get) => ({
  clients: [],
  currentClient: null,
  dashboard: null,
  loading: false,
  error: null,

  fetchClients: async (search = '') => {
    set({ loading: true, error: null });
    try {
      const data = await clientService.getClients(search);
      set({ clients: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchClient: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await clientService.getClientById(id);
      set({ currentClient: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createClient: async (clientData) => {
    const data = await clientService.createClient(clientData);
    set((state) => ({ clients: [data, ...state.clients] }));
    return data;
  },

  updateClient: async (id, clientData) => {
    const data = await clientService.updateClient(id, clientData);
    set((state) => ({
      clients: state.clients.map((c) => (c._id === id ? data : c)),
      currentClient: state.currentClient?._id === id ? data : state.currentClient,
    }));
    return data;
  },

  deleteClient: async (id) => {
    await clientService.deleteClient(id);
    set((state) => ({
      clients: state.clients.filter((c) => c._id !== id),
      currentClient: null,
    }));
  },

  addPayment: async (clientId, paymentData) => {
    const data = await clientService.addPayment(clientId, paymentData);
    set({ currentClient: data });
    return data;
  },

  deletePayment: async (clientId, paymentId) => {
    const data = await clientService.deletePayment(clientId, paymentId);
    set({ currentClient: data });
    return data;
  },

  addLabourCost: async (clientId, labourData) => {
    const data = await clientService.addLabourCost(clientId, labourData);
    set({ currentClient: data });
    return data;
  },

  deleteLabourCost: async (clientId, labourId) => {
    const data = await clientService.deleteLabourCost(clientId, labourId);
    set({ currentClient: data });
    return data;
  },

  fetchDashboard: async () => {
    set({ loading: true });
    try {
      const data = await clientService.getDashboard();
      set({ dashboard: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
}));

export default useClientStore;
