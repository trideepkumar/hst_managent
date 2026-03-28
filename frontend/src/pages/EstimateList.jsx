import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEstimates, deleteEstimate } from '../utils/localStorage';
import useUIStore from '../store/uiStore';
import { formatDate } from '../utils/formatCurrency';

export default function EstimateList() {
  const [estimates, setEstimates] = useState([]);
  const { openModal } = useUIStore();

  useEffect(() => { setEstimates(getEstimates()); }, []);

  const handleDelete = (est) => {
    openModal('Delete Estimate', `Delete estimate "${est.id}"?`, () => {
      deleteEstimate(est.id);
      setEstimates(getEstimates());
      toast.success('Estimate deleted');
    });
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Estimates</h2>
          <p className="text-slate-400 text-sm mt-0.5">{estimates.length} saved estimates</p>
        </div>
        <Link to="/estimates/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> New
        </Link>
      </div>

      {estimates.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 bg-slate-800/50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No estimates yet</p>
          <Link to="/estimates/new" className="inline-block mt-4 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Create Estimate
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {estimates.map((est) => (
            <div key={est.id} className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 rounded-xl px-4 py-3 transition-colors">
              <div className="p-2 bg-blue-600/10 rounded-lg">
                <FileText size={18} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm font-mono">{est.id}</p>
                <p className="text-slate-500 text-xs truncate">
                  {est.clientName || 'No client'} · {formatDate(est.date)} · ₹{est.netAmount || '—'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Link to={`/estimates/${est.id}`} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                  <Edit size={15} />
                </Link>
                <button onClick={() => handleDelete(est)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
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
