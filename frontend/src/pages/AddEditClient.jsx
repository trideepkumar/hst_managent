import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import useClientStore from '../store/clientStore';

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-slate-300 text-sm font-medium mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors";

export default function AddEditClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchClient, createClient, updateClient, loading } = useClientStore();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', address: '', contact: '', gstNumber: '', totalPayment: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchClient(id).then((client) => {
        if (client) {
          setForm({
            name: client.name || '',
            address: client.address || '',
            contact: client.contact || '',
            gstNumber: client.gstNumber || '',
            totalPayment: client.totalPayment || '',
          });
        }
      });
    }
  }, [id, isEdit, fetchClient]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Client name is required';
    if (form.totalPayment && isNaN(Number(form.totalPayment))) e.totalPayment = 'Must be a number';
    if (form.totalPayment && Number(form.totalPayment) < 0) e.totalPayment = 'Must be positive';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, totalPayment: Number(form.totalPayment) || 0 };
      if (isEdit) {
        await updateClient(id, payload);
        toast.success('Client updated!');
        navigate(`/clients/${id}`);
      } else {
        const c = await createClient(payload);
        toast.success('Client created!');
        navigate(`/clients/${c._id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-white font-bold text-xl">{isEdit ? 'Edit Client' : 'Add New Client'}</h2>
          <p className="text-slate-400 text-sm">Fill in the client details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-4">
          <Field label="Client Name" required>
            <input className={inputClass} value={form.name} onChange={set('name')} placeholder="e.g. Sivadas Unnithan R" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </Field>

          <Field label="Address">
            <textarea className={`${inputClass} resize-none h-20`} value={form.address} onChange={set('address')} placeholder="Full address..." />
          </Field>

          <Field label="Contact Number">
            <input className={inputClass} value={form.contact} onChange={set('contact')} placeholder="+91 9000000000" type="tel" />
          </Field>

          <Field label="GST Number">
            <input className={inputClass} value={form.gstNumber} onChange={set('gstNumber')} placeholder="e.g. 32BVHPH8489P1ZQ" />
          </Field>

          <Field label="Total Project Value (₹)">
            <input className={inputClass} value={form.totalPayment} onChange={set('totalPayment')} placeholder="e.g. 503160" type="number" min="0" step="0.01" />
            {errors.totalPayment && <p className="text-red-400 text-xs mt-1">{errors.totalPayment}</p>}
            <p className="text-slate-500 text-xs mt-1">This is the total agreed payment for this client's project</p>
          </Field>
        </div>

        <button
          type="submit"
          disabled={saving || loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <Save size={18} />
          {saving ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
        </button>
      </form>
    </div>
  );
}
