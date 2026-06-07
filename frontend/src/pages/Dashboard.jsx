import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, ArrowRight, Plus, FileText, Receipt, DollarSign, Activity } from 'lucide-react';
import useClientStore from '../store/clientStore';
import { formatCurrency } from '../utils/formatCurrency';

const StatCard = ({ icon: Icon, label, value, sub, colorClass, gradientClass }) => (
  <div className={`glass-panel rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${colorClass}`} />
    
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[var(--theme-text-muted)] text-[13px] font-semibold tracking-wide uppercase">{label}</p>
        <p className="text-[var(--theme-text-main)] font-extrabold text-2xl mt-2 tracking-tight">{value}</p>
        {sub && <p className="text-[var(--theme-text-muted)] text-[11px] font-medium mt-2 bg-[var(--theme-bg-app)]/50 inline-block px-2 py-0.5 rounded-md">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg text-white`}>
        {Icon && <Icon size={22} strokeWidth={2.5} />}
      </div>
    </div>
  </div>
);

const StatCardSkeleton = () => (
  <div className="glass-panel rounded-2xl p-6 animate-pulse">
    <div className="flex justify-between">
      <div className="space-y-4 w-1/2">
        <div className="h-4 bg-[var(--theme-border)] rounded w-3/4" />
        <div className="h-8 bg-[var(--theme-border)] rounded w-full" />
      </div>
      <div className="w-12 h-12 bg-[var(--theme-border)] rounded-xl" />
    </div>
  </div>
);

export default function Dashboard() {
  const dashboard = useClientStore((s) => s.dashboard);
  const loading = useClientStore((s) => s.loading);
  const fetchDashboard = useClientStore((s) => s.fetchDashboard);
  
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    fetchDashboard();
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, [fetchDashboard]);

  const d = dashboard || {};
  const isProfit = (d.totalProfit || 0) >= 0;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[var(--theme-text-main)] font-extrabold text-3xl tracking-tight">{greeting}, Admin</h2>
          <p className="text-[var(--theme-text-muted)] text-sm mt-1 font-medium flex items-center gap-2">
            <Activity size={14} className="text-[var(--theme-primary)]" />
            Here's what's happening at HST INFRASTRUCTURES today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/estimates/new"
            className="flex items-center gap-2 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-app)] text-[var(--theme-text-main)] text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <FileText size={16} className="text-[var(--theme-primary)]" />
            <span className="hidden sm:inline">Estimate</span>
          </Link>
          <Link
            to="/invoices/new"
            className="flex items-center gap-2 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)] hover:from-[var(--theme-primary-hover)] hover:to-[var(--theme-primary)] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-[var(--shadow-glow)]"
          >
            <Plus size={18} strokeWidth={3} />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={DollarSign}
              label="Revenue Collected"
              value={formatCurrency(d.totalRevenue)}
              colorClass="bg-emerald-500"
              gradientClass="from-emerald-400 to-emerald-600"
            />
            <StatCard
              icon={isProfit ? TrendingUp : TrendingDown}
              label={isProfit ? 'Net Profit' : 'Net Loss'}
              value={formatCurrency(Math.abs(d.totalProfit || 0))}
              sub={`Labour Cost: ${formatCurrency(d.totalLabour)}`}
              colorClass={isProfit ? 'bg-[var(--theme-primary)]' : 'bg-rose-500'}
              gradientClass={isProfit ? 'from-[var(--theme-primary)] to-[var(--theme-accent)]' : 'from-rose-400 to-rose-600'}
            />
            <StatCard
              icon={Clock}
              label="Pending Receivables"
              value={formatCurrency(d.totalPending)}
              colorClass="bg-amber-500"
              gradientClass="from-amber-400 to-amber-600"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Table (Takes 2/3 width on large screens) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[var(--theme-text-main)] font-bold text-lg">Recent Sales Transactions</h3>
              <p className="text-[var(--theme-text-muted)] text-[12px] mt-0.5">Latest inventory movement</p>
            </div>
            <Link
              to="/sales"
              className="text-[var(--theme-primary)] text-sm font-semibold flex items-center gap-1.5 hover:text-[var(--theme-primary-hover)] transition-colors bg-[var(--theme-primary)]/10 px-3 py-1.5 rounded-lg"
            >
              View Ledger <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--theme-border)]">
                  <th className="pb-3 text-[11px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Product Description</th>
                  <th className="pb-3 text-[11px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider text-right">Quantity</th>
                  <th className="pb-3 text-[11px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border)]">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4"><div className="h-4 bg-[var(--theme-border)] rounded w-32"></div></td>
                      <td className="py-4"><div className="h-4 bg-[var(--theme-border)] rounded w-8 ml-auto"></div></td>
                      <td className="py-4"><div className="h-4 bg-[var(--theme-border)] rounded w-20 ml-auto"></div></td>
                    </tr>
                  ))
                ) : (d.recentSales || []).length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-12 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--theme-bg-app)] mb-3">
                        <TrendingUp size={24} className="text-[var(--theme-text-muted)]" />
                      </div>
                      <p className="text-[var(--theme-text-main)] font-medium text-sm">No sales data available</p>
                    </td>
                  </tr>
                ) : (
                  (d.recentSales || []).map((sale) => (
                    <tr key={sale._id} className="group hover:bg-[var(--theme-bg-app)]/50 transition-colors">
                      <td className="py-3.5 pr-4">
                        <p className="text-[var(--theme-text-main)] font-semibold text-sm">{sale.productName || 'General Sale'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-block bg-[var(--theme-bg-app)] text-[var(--theme-text-muted)] text-[12px] font-medium px-2 py-1 rounded-md border border-[var(--theme-border)]">
                          {sale.quantity} Units
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <p className="text-emerald-500 font-bold text-sm">
                          {formatCurrency(sale.totalAmount)}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-full">
          <div className="mb-6">
            <h3 className="text-[var(--theme-text-main)] font-bold text-lg">System Actions</h3>
            <p className="text-[var(--theme-text-muted)] text-[12px] mt-0.5">Quick access tools</p>
          </div>
          
          <div className="space-y-4 flex-1">
            <Link
              to="/estimates/new"
              className="flex items-center p-4 rounded-xl bg-[var(--theme-bg-app)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)] group transition-all"
            >
              <div className="p-3 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] rounded-lg group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <div className="ml-4">
                <p className="text-[var(--theme-text-main)] font-bold text-sm">Generate Estimate</p>
                <p className="text-[var(--theme-text-muted)] text-xs mt-0.5">Draft new quotation</p>
              </div>
            </Link>

            <Link
              to="/invoices/new"
              className="flex items-center p-4 rounded-xl bg-[var(--theme-bg-app)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] group transition-all"
            >
              <div className="p-3 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-lg group-hover:scale-110 transition-transform">
                <Receipt size={20} />
              </div>
              <div className="ml-4">
                <p className="text-[var(--theme-text-main)] font-bold text-sm">Create Tax Invoice</p>
                <p className="text-[var(--theme-text-muted)] text-xs mt-0.5">Bill client securely</p>
              </div>
            </Link>
            
            <Link
              to="/store"
              className="flex items-center p-4 rounded-xl bg-[var(--theme-bg-app)] border border-[var(--theme-border)] hover:border-emerald-500 group transition-all"
            >
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:scale-110 transition-transform">
                <Activity size={20} />
              </div>
              <div className="ml-4">
                <p className="text-[var(--theme-text-main)] font-bold text-sm">Inventory Check</p>
                <p className="text-[var(--theme-text-muted)] text-xs mt-0.5">Manage store items</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
