const ESTIMATES_KEY = 'hst_estimates';
const INVOICES_KEY = 'hst_invoices';

const getAll = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
};

const saveAll = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Estimates
export const getEstimates = () => getAll(ESTIMATES_KEY);
export const saveEstimate = (estimate) => {
  const all = getAll(ESTIMATES_KEY);
  const idx = all.findIndex((e) => e.id === estimate.id);
  if (idx >= 0) all[idx] = estimate;
  else all.unshift(estimate);
  saveAll(ESTIMATES_KEY, all);
};
export const deleteEstimate = (id) => {
  saveAll(ESTIMATES_KEY, getAll(ESTIMATES_KEY).filter((e) => e.id !== id));
};

// Invoices
export const getInvoices = () => getAll(INVOICES_KEY);
export const saveInvoice = (invoice) => {
  const all = getAll(INVOICES_KEY);
  const idx = all.findIndex((e) => e.id === invoice.id);
  if (idx >= 0) all[idx] = invoice;
  else all.unshift(invoice);
  saveAll(INVOICES_KEY, all.slice(0, 50)); // keep latest 50
};
export const deleteInvoice = (id) => {
  saveAll(INVOICES_KEY, getAll(INVOICES_KEY).filter((e) => e.id !== id));
};
