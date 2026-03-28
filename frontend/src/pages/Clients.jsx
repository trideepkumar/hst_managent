import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, User, Phone, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useClientStore from '../store/clientStore';
import useUIStore from '../store/uiStore';
import { formatCurrency } from '../utils/formatCurrency';

export default function Clients() {
  const { clients, fetchClients, deleteClient, loading } = useClientStore();
  const { openModal } = useUIStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const delay = setTimeout(() => fetchClients(search), 300);
    return () => clearTimeout(delay);
  }, [search, fetchClients]);

  const handleDelete = (client) => {
    openModal(
      'Delete Client',
      `Are you sure you want to delete "${client.name}"? This will remove all their payment and labour records.`,
      async () => {
        try {
          await deleteClient(client._id);
          toast.success('Client deleted');
        } catch {
          toast.error('Failed to delete client');
        }
      }
    );
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Clients</h2>
          <p className="text-slate-400 text-sm mt-0.5">{clients.length} total clients</p>
        </div>
        <Link
          to="/clients/add"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Client</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-800/40 rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 bg-slate-800/50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No clients found</p>
          <p className="text-slate-600 text-sm mt-1">
            {search ? 'Try a different search' : 'Add your first client to get started'}
          </p>
          {!search && (
            <Link to="/clients/add" className="inline-block mt-4 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              Add Client
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <div key={client._id} className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 rounded-xl px-4 py-3 transition-colors">
              <Link to={`/clients/${client._id}`} className="flex-1 flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-bold text-sm">{client.name[0]?.toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{client.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Phone size={10} className="text-slate-500" />
                    <span className="text-slate-500 text-xs">{client.contact || 'No contact'}</span>
                  </div>
                </div>
                <div className="ml-auto text-right flex-shrink-0 pl-2">
                  <p className="text-white font-semibold text-sm">{formatCurrency(client.totalPayment)}</p>
                  <p className={`text-xs mt-0.5 ${(client.remainingPayment || 0) > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                    {(client.remainingPayment || 0) > 0 ? `Due: ${formatCurrency(client.remainingPayment)}` : 'Paid'}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
              </Link>
              <button
                onClick={() => handleDelete(client)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
