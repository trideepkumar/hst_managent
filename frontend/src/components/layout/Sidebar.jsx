import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Receipt, X } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import { useTheme } from '../../theme.jsx';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/estimates', icon: FileText, label: 'Estimates' },
  { to: '/invoices', icon: Receipt, label: 'Invoices' },
];

export default function Sidebar() {
  const { sidebarOpen, closeSidebar } = useUIStore();
  const { currentTheme, setCurrentTheme, themes } = useTheme();

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-700/50 z-50 transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="HST Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">HST GROUP</h1>
              <p className="text-slate-400 text-xs">Business Manager</p>
            </div>
          </div>
          <button onClick={closeSidebar} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 cursor-pointer">UI Theme</label>
            <select 
              value={currentTheme} 
              onChange={(e) => setCurrentTheme(e.target.value)}
              className="w-full bg-slate-800 text-xs text-slate-300 rounded-lg border border-slate-700 px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {Object.entries(themes).map(([key, theme]) => (
                <option key={key} value={key}>{theme.name}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] text-center">HST GROUP © 2025</p>
            <p className="text-slate-600 text-[10px] text-center">Panmana P O, Kollam</p>
          </div>
        </div>
      </aside>
    </>
  );
}
