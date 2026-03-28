import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useUIStore from '../../store/uiStore';

const titleMap = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/clients/add': 'Add Client',
  '/estimates': 'Estimates',
  '/estimates/new': 'New Estimate',
  '/invoices': 'Invoices',
  '/invoices/new': 'New Invoice',
};

export default function Navbar() {
  const { toggleSidebar } = useUIStore();
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (titleMap[path]) return titleMap[path];
    if (path.includes('/clients/') && path.includes('/edit')) return 'Edit Client';
    if (path.includes('/clients/')) return 'Client Details';
    if (path.includes('/estimates/')) return 'Edit Estimate';
    if (path.includes('/invoices/')) return 'Edit Invoice';
    return 'HST';
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-3 flex items-center gap-4 sticky top-0 z-30 lg:hidden">
      <button
        onClick={toggleSidebar}
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <Menu size={22} />
      </button>
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="HST" className="h-7 w-7 object-contain" />
        <h1 className="text-white font-semibold text-base">{getTitle()}</h1>
      </div>
    </header>
  );
}
