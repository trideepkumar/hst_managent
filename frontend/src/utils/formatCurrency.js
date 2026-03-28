export const formatCurrency = (amount) => {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

export const formatDateInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export const generateDocNumber = (prefix) => {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${yr}${mo}-${rand}`;
};
