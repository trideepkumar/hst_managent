import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Receipt, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInvoices, deleteInvoice } from '../utils/localStorage';
import useUIStore from '../store/uiStore';
import { formatDate } from '../utils/formatCurrency';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const { openModal } = useUIStore();

  useEffect(() => { setInvoices(getInvoices()); }, []);

  const handleDelete = (inv) => {
    openModal('Delete Invoice', `Delete invoice "${inv.id}"?`, () => {
      deleteInvoice(inv.id);
      setInvoices(getInvoices());
      toast.success('Invoice deleted');
    });
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Invoices</h2>
          <p className="text-slate-400 text-sm mt-0.5">{invoices.length} saved invoices</p>
        </div>
        <Link to="/invoices/new" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> New
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 bg-slate-800/50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Receipt size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No invoices yet</p>
          <Link to="/invoices/new" className="inline-block mt-4 bg-purple-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors">
            Create Invoice
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 rounded-xl px-4 py-3 transition-colors">
              <div className="p-2 bg-purple-600/10 rounded-lg">
                <Receipt size={18} className="text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm font-mono">{inv.id}</p>
                <p className="text-slate-500 text-xs truncate">
                  {inv.clientName || 'No client'} · {formatDate(inv.date)} · ₹{inv.netAmount || '—'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Link to={`/invoices/${inv.id}`} className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors">
                  <Edit size={15} />
                </Link>
                <button onClick={() => handleDelete(inv)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
