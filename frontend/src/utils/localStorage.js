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

// Store: Products
const PRODUCTS_KEY = 'hst_products';
export const getProducts = () => getAll(PRODUCTS_KEY);
export const saveProduct = (product) => {
  const all = getAll(PRODUCTS_KEY);
  const idx = all.findIndex((p) => p.id === product.id);
  if (idx >= 0) all[idx] = product;
  else all.unshift(product);
  saveAll(PRODUCTS_KEY, all);
};
export const deleteProduct = (id) => {
  saveAll(PRODUCTS_KEY, getAll(PRODUCTS_KEY).filter((p) => p.id !== id));
};

// Store: Sales
const SALES_KEY = 'hst_sales';
export const getSales = () => getAll(SALES_KEY);
export const saveSale = (sale) => {
  const all = getAll(SALES_KEY);
  all.unshift(sale); // Sales are mostly append-only, but we can edit them too.
  saveAll(SALES_KEY, all);
};
export const deleteSale = (id) => {
  saveAll(SALES_KEY, getAll(SALES_KEY).filter((s) => s.id !== id));
};
