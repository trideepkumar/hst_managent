import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Receipt, X, Store, ShoppingBag } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import { useTheme } from '../../theme.jsx';
import logo from '../../../public/assests/logo.png'

const navGroups = [
  {
    group: 'CORE',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    group: 'INVENTORY & SALES',
    items: [
      { to: '/store', icon: Store, label: 'Store Management' },
      { to: '/sales', icon: ShoppingBag, label: 'Sales Intelligence' },
    ]
  },
  {
    group: 'FINANCE',
    items: [
      // { to: '/clients', icon: Users, label: 'Clients' },
      { to: '/estimates', icon: FileText, label: 'Estimates' },
      { to: '/invoices', icon: Receipt, label: 'Invoices' },
    ]
  }
];

export default function Sidebar() {
  const { sidebarOpen, closeSidebar } = useUIStore();
  const { currentTheme, setCurrentTheme, themes } = useTheme();

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-[280px] bg-[var(--theme-bg-panel)] border-r border-[var(--theme-border)] z-50 transform transition-transform duration-300 flex flex-col shadow-2xl lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg-nav)]">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg shadow-sm">
              <img src={logo} alt="HST Logo" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h1 className="text-[var(--theme-text-main)] font-extrabold text-[15px] tracking-tight leading-tight">HST INFRA</h1>
              <p className="text-[var(--theme-primary)] text-[11px] font-bold tracking-widest uppercase mt-0.5">ERP System</p>
            </div>
          </div>
          <button onClick={closeSidebar} className="lg:hidden text-[var(--theme-text-muted)] hover:text-[var(--theme-text-main)] p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h2 className="px-3 text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider mb-2">
                {group.group}
              </h2>
              <div className="space-y-1">
                {group.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden
                      ${isActive
                        ? 'text-white shadow-md'
                        : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-main)] hover:bg-[var(--theme-bg-nav)]'}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)] opacity-100 z-0"></div>
                        )}
                        <Icon size={18} className={`z-10 ${isActive ? 'text-white' : 'text-[var(--theme-text-muted)] group-hover:text-[var(--theme-primary)] transition-colors'}`} />
                        <span className="z-10 relative">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Configuration */}
        <div className="p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-nav)] flex flex-col gap-4">
          <div className="bg-[var(--theme-bg-panel)] rounded-xl p-3 border border-[var(--theme-border)]">
            <label className="text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wide mb-1.5 block">Theme Preferences</label>
            <select 
              value={currentTheme} 
              onChange={(e) => setCurrentTheme(e.target.value)}
              className="w-full bg-[var(--theme-bg-nav)] text-[13px] font-medium text-[var(--theme-text-main)] rounded-lg border border-[var(--theme-border)] px-2 py-2 focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] cursor-pointer transition-all"
            >
              {Object.entries(themes).map(([key, theme]) => (
                <option key={key} value={key}>{theme.name}</option>
              ))}
            </select>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[var(--theme-text-muted)] text-[11px] font-medium">HST INFRASTRUCTURES © 2026</p>
            <div className="flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[var(--theme-text-muted)] text-[10px]">System Online v2.4.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
