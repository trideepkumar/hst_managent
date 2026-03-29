import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Wrench, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import useClientStore from '../store/clientStore';
import useUIStore from '../store/uiStore';
import { formatCurrency, formatDate } from '../utils/formatCurrency';

const SectionTitle = ({ icon: I, label }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="p-1.5 bg-slate-700 rounded-lg print:bg-gray-100"><I size={14} className="text-slate-300 print:text-gray-500" /></div>
    <h3 className="text-white font-semibold text-sm print:text-gray-800">{label}</h3>
  </div>
);

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors";

function AddModal({ title, fields, onSave, onClose }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    for (const f of fields) {
      if (f.required && !form[f.key]) { toast.error(`${f.label} is required`); return; }
      if (f.type === 'number' && form[f.key] && isNaN(Number(form[f.key]))) {
        toast.error(`${f.label} must be a valid number`); return;
      }
    }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5 space-y-3">
        <h3 className="text-white font-semibold">{title}</h3>
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-slate-400 text-xs mb-1 block">{f.label}</label>
            {f.type === 'textarea'
              ? <textarea className={`${inputCls} resize-none h-16`} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} placeholder={f.placeholder} />
              : <input className={inputCls} type={f.type || 'text'} step={f.step} min={f.min} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} placeholder={f.placeholder} />
            }
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentClient: client, fetchClient, deletePayment, deleteLabourCost, addPayment, addLabourCost, loading } = useClientStore();
  const { openModal } = useUIStore();
  const [paymentModal, setPaymentModal] = useState(false);
  const [labourModal, setLabourModal] = useState(false);

  useEffect(() => { fetchClient(id); }, [id, fetchClient]);

  if (loading && !client) return (
    <div className="p-4 space-y-3 max-w-2xl mx-auto">
      {[...Array(5)].map((_, i) => <div key={i} className="bg-slate-800/40 rounded-2xl h-16 animate-pulse" />)}
    </div>
  );
  if (!client) return <div className="p-8 text-center text-slate-400">Client not found</div>;

  const isProfit = client.profitLoss >= 0;

  const handleDelPayment = (p) => openModal('Delete Payment', `Remove payment of ${formatCurrency(p.amount)} on ${formatDate(p.date)}?`,
    async () => { try { await deletePayment(id, p._id); toast.success('Payment removed'); } catch { toast.error('Failed'); } });

  const handleDelLabour = (l) => openModal('Delete Labour Cost', `Remove labour cost of ${formatCurrency(l.amount)}?`,
    async () => { try { await deleteLabourCost(id, l._id); toast.success('Labour cost removed'); } catch { toast.error('Failed'); } });

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 20mm; }
        }
      `}</style>

      <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4 print:p-0 print:space-y-4">

        {/* Print Header */}
        <div className="hidden print:block print:mb-4 print:border-b print:border-gray-200 print:pb-4">
          <h1 className="text-xl font-bold text-gray-900">HST GROUP — Client Report</h1>
          <p className="text-gray-400 text-xs mt-1">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Header */}
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors mt-0.5 no-print">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white font-bold text-xl truncate print:text-gray-900 print:text-2xl">{client.name}</h2>
              <Link to={`/clients/${id}/edit`} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors no-print">
                <Edit size={15} />
              </Link>
              <button
                onClick={() => window.print()}
                className="no-print ml-auto flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Printer size={13} /> Print PDF
              </button>
            </div>
            {client.address && <p className="text-slate-400 text-sm mt-0.5 print:text-gray-500">{client.address}</p>}
            {client.contact && <p className="text-slate-500 text-xs print:text-gray-400">{client.contact}</p>}
            {client.gstNumber && <p className="text-slate-600 text-xs print:text-gray-400">GST: {client.gstNumber}</p>}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-3 print:gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 print:bg-white print:border-gray-200 print:rounded-lg print:shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-blue-400" />
              <span className="text-slate-400 text-xs print:text-gray-500">Project Value</span>
            </div>
            <p className="text-white font-bold text-lg print:text-gray-900">{formatCurrency(client.totalPayment)}</p>
            <div className="mt-2 space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 print:text-gray-400">Collected</span>
                <span className="text-green-400 font-medium print:text-green-600">{formatCurrency(client.totalPaid)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 print:text-gray-400">Remaining</span>
                <span className={`font-medium ${client.remainingPayment > 0 ? 'text-amber-400 print:text-amber-600' : 'text-green-400 print:text-green-600'}`}>
                  {formatCurrency(client.remainingPayment)}
                </span>
              </div>
            </div>
          </div>

          <div className={`border rounded-2xl p-4 print:bg-white print:border-gray-200 print:rounded-lg print:shadow-sm ${isProfit ? 'bg-green-900/20 border-green-700/30' : 'bg-red-900/20 border-red-700/30'}`}>
            <div className="flex items-center gap-2 mb-1">
              {isProfit ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
              <span className="text-slate-400 text-xs print:text-gray-500">{isProfit ? 'Profit' : 'Loss'}</span>
            </div>
            <p className={`font-bold text-lg ${isProfit ? 'text-green-400 print:text-green-600' : 'text-red-400 print:text-red-600'}`}>
              {formatCurrency(Math.abs(client.profitLoss))}
            </p>
            <div className="mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 print:text-gray-400">Labour Cost</span>
                <span className="text-slate-300 font-medium print:text-gray-700">{formatCurrency(client.totalLabourCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 print:bg-white print:border-gray-200 print:rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <SectionTitle icon={DollarSign} label="Payments" />
            <button
              onClick={() => setPaymentModal(true)}
              className="no-print flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-400/10 hover:bg-blue-400/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={13} /> Add Payment
            </button>
          </div>
          {client.payments?.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-3 print:text-gray-400">No payments recorded yet</p>
          ) : (
            <div className="space-y-2">
              {client.payments?.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0 print:border-gray-100">
                  <div>
                    <p className="text-white text-sm font-medium print:text-gray-900">{formatCurrency(p.amount)}</p>
                    <p className="text-slate-500 text-xs print:text-gray-400">{formatDate(p.date)}{p.note ? ` · ${p.note}` : ''}</p>
                  </div>
                  <button onClick={() => handleDelPayment(p)} className="no-print p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {/* Payment Total Row */}
              <div className="flex justify-between pt-2 border-t border-slate-600/40 print:border-gray-200">
                <span className="text-slate-400 text-xs font-semibold print:text-gray-500">Total Collected</span>
                <span className="text-green-400 text-xs font-bold print:text-green-600">{formatCurrency(client.totalPaid)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Labour Costs */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 print:bg-white print:border-gray-200 print:rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <SectionTitle icon={Wrench} label="Labour Costs" />
            <button
              onClick={() => setLabourModal(true)}
              className="no-print flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-400/10 hover:bg-purple-400/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={13} /> Add Labour
            </button>
          </div>
          {client.labourCosts?.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-3 print:text-gray-400">No labour costs recorded yet</p>
          ) : (
            <div className="space-y-2">
              {client.labourCosts?.map((l) => (
                <div key={l._id} className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0 print:border-gray-100">
                  <div>
                    <p className="text-white text-sm font-medium print:text-gray-900">{formatCurrency(l.amount)}</p>
                    <p className="text-slate-500 text-xs print:text-gray-400">{formatDate(l.date)}{l.description ? ` · ${l.description}` : ''}</p>
                  </div>
                  <button onClick={() => handleDelLabour(l)} className="no-print p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {/* Labour Total Row */}
              <div className="flex justify-between pt-2 border-t border-slate-600/40 print:border-gray-200">
                <span className="text-slate-400 text-xs font-semibold print:text-gray-500">Total Labour Cost</span>
                <span className="text-purple-400 text-xs font-bold print:text-purple-600">{formatCurrency(client.totalLabourCost)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Print Footer */}
        <div className="hidden print:flex print:justify-between print:mt-6 print:pt-4 print:border-t print:border-gray-200">
          <p className="text-gray-400 text-xs">HST Managent · {new Date().toLocaleString('en-IN')}</p>
          <p className="text-gray-400 text-xs">Confidential</p>
        </div>

        {/* Add Payment Modal */}
        {paymentModal && (
          <AddModal
            title="Add Payment"
            fields={[
              { key: 'amount', label: 'Amount (₹)', type: 'number', min: '0', step: '0.01', placeholder: '0', required: true },
              { key: 'date', label: 'Date', type: 'date', placeholder: '', required: false },
              { key: 'note', label: 'Note (optional)', type: 'text', placeholder: 'Payment note', required: false },
            ]}
            onSave={async (f) => {
              await addPayment(id, { amount: Number(f.amount), date: f.date || new Date(), note: f.note });
              toast.success('Payment added!');
            }}
            onClose={() => setPaymentModal(false)}
          />
        )}

        {/* Add Labour Modal */}
        {labourModal && (
          <AddModal
            title="Add Labour Cost"
            fields={[
              { key: 'amount', label: 'Amount (₹)', type: 'number', min: '0', step: '0.01', placeholder: '0', required: true },
              { key: 'date', label: 'Date', type: 'date', placeholder: '', required: false },
              { key: 'description', label: 'Description (optional)', type: 'textarea', placeholder: 'Labour details', required: false },
            ]}
            onSave={async (f) => {
              await addLabourCost(id, { amount: Number(f.amount), date: f.date || new Date(), description: f.description });
              toast.success('Labour cost added!');
            }}
            onClose={() => setLabourModal(false)}
          />
        )}
      </div>
    </>
  );
}

// import { useEffect, useState } from 'react';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import { ArrowLeft, Edit, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Wrench } from 'lucide-react';
// import toast from 'react-hot-toast';
// import useClientStore from '../store/clientStore';
// import useUIStore from '../store/uiStore';
// import { formatCurrency, formatDate } from '../utils/formatCurrency';

// const SectionTitle = ({ icon:  label }) => (
//   <div className="flex items-center gap-2 mb-3">
//     <div className="p-1.5 bg-slate-700 rounded-lg"><I size={14} className="text-slate-300" /></div>
//     <h3 className="text-white font-semibold text-sm">{label}</h3>
//   </div>
// );

// const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors";

// function AddModal({ title, fields, onSave, onClose }) {
//   const [form, setForm] = useState({});
//   const [saving, setSaving] = useState(false);

//   const handleSave = async () => {
//     for (const f of fields) {
//       if (f.required && !form[f.key]) { toast.error(`${f.label} is required`); return; }
//       if (f.type === 'number' && form[f.key] && isNaN(Number(form[f.key]))) {
//         toast.error(`${f.label} must be a valid number`); return;
//       }
//     }
//     setSaving(true);
//     try { await onSave(form); onClose(); }
//     catch (e) { toast.error(e.message); }
//     finally { setSaving(false); }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
//       <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5 space-y-3">
//         <h3 className="text-white font-semibold">{title}</h3>
//         {fields.map(f => (
//           <div key={f.key}>
//             <label className="text-slate-400 text-xs mb-1 block">{f.label}</label>
//             {f.type === 'textarea'
//               ? <textarea className={`${inputCls} resize-none h-16`} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} placeholder={f.placeholder} />
//               : <input className={inputCls} type={f.type || 'text'} step={f.step} min={f.min} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} placeholder={f.placeholder} />
//             }
//           </div>
//         ))}
//         <div className="flex gap-2 pt-1">
//           <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
//           <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
//             {saving ? 'Saving...' : 'Save'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function ClientDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { currentClient: client, fetchClient, deletePayment, deleteLabourCost, addPayment, addLabourCost, loading } = useClientStore();
//   const { openModal } = useUIStore();
//   const [paymentModal, setPaymentModal] = useState(false);
//   const [labourModal, setLabourModal] = useState(false);

//   useEffect(() => { fetchClient(id); }, [id, fetchClient]);

//   if (loading && !client) return (
//     <div className="p-4 space-y-3 max-w-2xl mx-auto">
//       {[...Array(5)].map((_, i) => <div key={i} className="bg-slate-800/40 rounded-2xl h-16 animate-pulse" />)}
//     </div>
//   );
//   if (!client) return <div className="p-8 text-center text-slate-400">Client not found</div>;

//   const isProfit = client.profitLoss >= 0;

//   const handleDelPayment = (p) => openModal('Delete Payment', `Remove payment of ${formatCurrency(p.amount)} on ${formatDate(p.date)}?`,
//     async () => { try { await deletePayment(id, p._id); toast.success('Payment removed'); } catch { toast.error('Failed'); } });

//   const handleDelLabour = (l) => openModal('Delete Labour Cost', `Remove labour cost of ${formatCurrency(l.amount)}?`,
//     async () => { try { await deleteLabourCost(id, l._id); toast.success('Labour cost removed'); } catch { toast.error('Failed'); } });

//   return (
//     <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
//       {/* Header */}
//       <div className="flex items-start gap-3">
//         <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors mt-0.5">
//           <ArrowLeft size={20} />
//         </button>
//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-2 flex-wrap">
//             <h2 className="text-white font-bold text-xl truncate">{client.name}</h2>
//             <Link to={`/clients/${id}/edit`} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
//               <Edit size={15} />
//             </Link>
//           </div>
//           {client.address && <p className="text-slate-400 text-sm mt-0.5">{client.address}</p>}
//           {client.contact && <p className="text-slate-500 text-xs">{client.contact}</p>}
//           {client.gstNumber && <p className="text-slate-600 text-xs">GST: {client.gstNumber}</p>}
//         </div>
//       </div>

//       {/* Financial Summary */}
//       <div className="grid grid-cols-2 gap-3">
//         <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
//           <div className="flex items-center gap-2 mb-1">
//             <DollarSign size={14} className="text-blue-400" />
//             <span className="text-slate-400 text-xs">Project Value</span>
//           </div>
//           <p className="text-white font-bold text-lg">{formatCurrency(client.totalPayment)}</p>
//           <div className="mt-2 space-y-0.5">
//             <div className="flex justify-between text-xs">
//               <span className="text-slate-500">Collected</span>
//               <span className="text-green-400 font-medium">{formatCurrency(client.totalPaid)}</span>
//             </div>
//             <div className="flex justify-between text-xs">
//               <span className="text-slate-500">Remaining</span>
//               <span className={`font-medium ${client.remainingPayment > 0 ? 'text-amber-400' : 'text-green-400'}`}>{formatCurrency(client.remainingPayment)}</span>
//             </div>
//           </div>
//         </div>
//         <div className={`border rounded-2xl p-4 ${isProfit ? 'bg-green-900/20 border-green-700/30' : 'bg-red-900/20 border-red-700/30'}`}>
//           <div className="flex items-center gap-2 mb-1">
//             {isProfit ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
//             <span className="text-slate-400 text-xs">{isProfit ? 'Profit' : 'Loss'}</span>
//           </div>
//           <p className={`font-bold text-lg ${isProfit ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(Math.abs(client.profitLoss))}</p>
//           <div className="mt-2">
//             <div className="flex justify-between text-xs">
//               <span className="text-slate-500">Labour Cost</span>
//               <span className="text-slate-300 font-medium">{formatCurrency(client.totalLabourCost)}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Payments */}
//       <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4">
//         <div className="flex items-center justify-between mb-3">
//           <SectionTitle icon={DollarSign} label="Payments" />
//           <button onClick={() => setPaymentModal(true)} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-400/10 hover:bg-blue-400/20 px-3 py-1.5 rounded-lg transition-colors">
//             <Plus size={13} /> Add Payment
//           </button>
//         </div>
//         {client.payments?.length === 0 ? (
//           <p className="text-slate-600 text-sm text-center py-3">No payments recorded yet</p>
//         ) : (
//           <div className="space-y-2">
//             {client.payments?.map((p) => (
//               <div key={p._id} className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0">
//                 <div>
//                   <p className="text-white text-sm font-medium">{formatCurrency(p.amount)}</p>
//                   <p className="text-slate-500 text-xs">{formatDate(p.date)}{p.note ? ` · ${p.note}` : ''}</p>
//                 </div>
//                 <button onClick={() => handleDelPayment(p)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
//                   <Trash2 size={14} />
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Labour Costs */}
//       <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4">
//         <div className="flex items-center justify-between mb-3">
//           <SectionTitle icon={Wrench} label="Labour Costs" />
//           <button onClick={() => setLabourModal(true)} className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-400/10 hover:bg-purple-400/20 px-3 py-1.5 rounded-lg transition-colors">
//             <Plus size={13} /> Add Labour
//           </button>
//         </div>
//         {client.labourCosts?.length === 0 ? (
//           <p className="text-slate-600 text-sm text-center py-3">No labour costs recorded yet</p>
//         ) : (
//           <div className="space-y-2">
//             {client.labourCosts?.map((l) => (
//               <div key={l._id} className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0">
//                 <div>
//                   <p className="text-white text-sm font-medium">{formatCurrency(l.amount)}</p>
//                   <p className="text-slate-500 text-xs">{formatDate(l.date)}{l.description ? ` · ${l.description}` : ''}</p>
//                 </div>
//                 <button onClick={() => handleDelLabour(l)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
//                   <Trash2 size={14} />
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Add Payment Modal */}
//       {paymentModal && (
//         <AddModal
//           title="Add Payment"
//           fields={[
//             { key: 'amount', label: 'Amount (₹)', type: 'number', min: '0', step: '0.01', placeholder: '0', required: true },
//             { key: 'date', label: 'Date', type: 'date', placeholder: '', required: false },
//             { key: 'note', label: 'Note (optional)', type: 'text', placeholder: 'Payment note', required: false },
//           ]}
//           onSave={async (f) => {
//             await addPayment(id, { amount: Number(f.amount), date: f.date || new Date(), note: f.note });
//             toast.success('Payment added!');
//           }}
//           onClose={() => setPaymentModal(false)}
//         />
//       )}

//       {/* Add Labour Modal */}
//       {labourModal && (
//         <AddModal
//           title="Add Labour Cost"
//           fields={[
//             { key: 'amount', label: 'Amount (₹)', type: 'number', min: '0', step: '0.01', placeholder: '0', required: true },
//             { key: 'date', label: 'Date', type: 'date', placeholder: '', required: false },
//             { key: 'description', label: 'Description (optional)', type: 'textarea', placeholder: 'Labour details', required: false },
//           ]}
//           onSave={async (f) => {
//             await addLabourCost(id, { amount: Number(f.amount), date: f.date || new Date(), description: f.description });
//             toast.success('Labour cost added!');
//           }}
//           onClose={() => setLabourModal(false)}
//         />
//       )}
//     </div>
//   );
// }
