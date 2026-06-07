import { Menu, Search, Bell, Settings, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useUIStore from '../../store/uiStore';

const titleMap = {
  '/': 'Dashboard Overview',
  '/clients': 'Client Management',
  '/clients/add': 'Add New Client',
  '/estimates': 'Estimate Records',
  '/estimates/new': 'Create Estimate',
  '/invoices': 'Invoice Ledger',
  '/invoices/new': 'Create Invoice',
  '/sales': 'Sales Intelligence',
  '/store': 'Inventory Management',
};

export default function Navbar() {
  const { toggleSidebar } = useUIStore();
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (titleMap[path]) return titleMap[path];
    if (path.includes('/clients/') && path.includes('/edit')) return 'Edit Client Profile';
    if (path.includes('/clients/')) return 'Client Dossier';
    if (path.includes('/estimates/')) return 'Estimate Editor';
    if (path.includes('/invoices/')) return 'Invoice Editor';
    return 'HST INFRASTRUCTURES ERP';
  };

  return (
    <header className="bg-[var(--theme-bg-nav)]/80 backdrop-blur-xl border-b border-[var(--theme-border)] px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-300">
      
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-main)] p-2 rounded-xl hover:bg-[var(--theme-bg-panel)] transition-colors lg:hidden focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3 hidden md:flex">
          <div className="h-8 w-1 bg-[var(--theme-primary)] rounded-full"></div>
          <h1 className="text-[var(--theme-text-main)] font-bold text-lg tracking-tight">{getTitle()}</h1>
        </div>
      </div>

      {/* Mobile Title (Center) */}
      <div className="md:hidden flex items-center justify-center flex-1">
        <h1 className="text-[var(--theme-text-main)] font-semibold text-base truncate">{getTitle()}</h1>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-[var(--theme-text-muted)] group-focus-within:text-[var(--theme-primary)] transition-colors" />
          </div>
          <input
            type="text"
            className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-main)] text-sm rounded-full pl-10 pr-4 py-2 border border-[var(--theme-border)] focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] w-64 transition-all placeholder:text-[var(--theme-text-muted)]"
            placeholder="Search documents..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-[10px] font-medium text-[var(--theme-text-muted)] bg-[var(--theme-bg-app)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded shadow-sm">⌘K</span>
          </div>
        </div>

        {/* Action Buttons */}
        <button className="text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] p-2 rounded-full hover:bg-[var(--theme-bg-panel)] transition-all relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-[var(--theme-bg-nav)]"></span>
        </button>
        <button className="text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] p-2 rounded-full hover:bg-[var(--theme-bg-panel)] transition-all hidden sm:block">
          <Settings size={20} />
        </button>

        {/* User Profile */}
        <div className="ml-2 pl-4 border-l border-[var(--theme-border)] flex items-center gap-3 cursor-pointer group">
          <div className="hidden sm:block text-right">
            <p className="text-[var(--theme-text-main)] text-sm font-semibold group-hover:text-[var(--theme-primary)] transition-colors">Admin User</p>
            <p className="text-[var(--theme-text-muted)] text-[10px] uppercase tracking-wider font-bold">System Manager</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-accent)] p-[2px] shadow-sm group-hover:shadow-[var(--shadow-glow)] transition-all">
            <div className="h-full w-full rounded-full bg-[var(--theme-bg-panel)] flex items-center justify-center border-2 border-[var(--theme-bg-nav)]">
              <User size={16} className="text-[var(--theme-text-main)]" />
            </div>
          </div>
        </div>
      </div>

    </header>
  );
}
