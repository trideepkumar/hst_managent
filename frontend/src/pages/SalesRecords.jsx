import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Calendar, Phone, MapPin, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSales, deleteSale } from '../utils/localStorage';
import useUIStore from '../store/uiStore';
import { formatCurrency, formatDate } from '../utils/formatCurrency';

export default function SalesRecords() {
  const [sales, setSales] = useState([]);
  const { openModal } = useUIStore();

  useEffect(() => { setSales(getSales()); }, []);

  const handleDelete = (s) => {
    openModal('Delete Sale Record', `Delete sale record for ${s.productName}? This will NOT return stock to inventory.`, () => {
      deleteSale(s.id);
      setSales(getSales());
      toast.success('Sale record deleted');
    });
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Sales Records</h2>
          <p className="text-slate-400 text-sm mt-0.5">{sales.length} total records</p>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/40">
          <div className="p-4 bg-slate-800/50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No sales recorded yet</p>
          <p className="text-slate-500 text-sm mt-1">Go to the Store to sell products.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sales.map((s) => (
            <div key={s.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col transition-colors hover:bg-slate-800">
              <div className="flex justify-between items-start mb-3 border-b border-slate-700/50 pb-3">
                <div>
                  <h4 className="text-white font-medium">{s.productName}</h4>
                  <p className="text-slate-400 text-sm mt-0.5"><span className="text-blue-400 font-medium">{s.quantitySold} units</span> @ {formatCurrency(s.priceAtSale)}</p>
                </div>
                <div className="text-right flex space-x-3 items-start">
                  <div>
                    <h4 className="text-green-400 font-bold">{formatCurrency(s.totalAmount)}</h4>
                    <p className="text-slate-500 text-xs font-mono mt-0.5">{s.id}</p>
                  </div>
                  <button onClick={() => handleDelete(s)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <User size={14} className="text-slate-500 shrink-0" />
                  <span className="font-medium truncate">{s.customerName || 'N/A'}</span>
                </div>
                
                {(s.customerPhone || s.date) && (
                  <div className="flex items-center gap-4 text-slate-400 text-xs">
                    {s.customerPhone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-500" />
                        <span>{s.customerPhone}</span>
                      </div>
                    )}
                    {s.date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-500" />
                        <span>{formatDate(s.date)}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {s.customerAddress && (
                  <div className="flex items-start gap-1.5 text-slate-400 text-xs mt-1">
                    <MapPin size={12} className="text-slate-500 shrink-0 mt-0.5" />
                    <span className="leading-tight">{s.customerAddress}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
