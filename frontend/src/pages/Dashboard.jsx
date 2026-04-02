import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown, Clock, ArrowRight, Plus } from 'lucide-react';
import useClientStore from '../store/clientStore';
import { formatCurrency } from '../utils/formatCurrency';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex items-start gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      {Icon && <Icon size={20} className="text-white" />}
    </div>
    <div>
      <p className="text-slate-400 text-xs font-medium">{label}</p>
      <p className="text-white font-bold text-xl mt-0.5">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
);

const StatCardSkeleton = () => (
  <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-5 flex items-start gap-4 animate-pulse">
    <div className="p-3 rounded-xl bg-slate-700/60 w-11 h-11" />
    <div className="flex-1 space-y-2 pt-1">
      <div className="h-3 bg-slate-700/60 rounded w-24" />
      <div className="h-6 bg-slate-700/60 rounded w-32" />
    </div>
  </div>
);

const ClientRowSkeleton = () => (
  <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3 animate-pulse">
    <div className="space-y-2">
      <div className="h-3.5 bg-slate-700/60 rounded w-32" />
      <div className="h-3 bg-slate-700/60 rounded w-24" />
    </div>
    <div className="space-y-2 items-end flex flex-col">
      <div className="h-3.5 bg-slate-700/60 rounded w-16" />
      <div className="h-3 bg-slate-700/60 rounded w-8" />
    </div>
  </div>
);

export default function Dashboard() {
  const dashboard = useClientStore((s) => s.dashboard);
  const loading = useClientStore((s) => s.loading);
  const fetchDashboard = useClientStore((s) => s.fetchDashboard);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const d = dashboard || {};
  const isProfit = (d.totalProfit || 0) >= 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Dashboard</h2>
          <p className="text-slate-400 text-sm mt-0.5">HST GROUP overview</p>
        </div>
        <Link
          to="/clients/add"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Client</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Clients"
              value={d.totalClients || 0}
              color="bg-blue-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Revenue Collected"
              value={formatCurrency(d.totalRevenue)}
              color="bg-green-600"
            />
            <StatCard
              icon={isProfit ? TrendingUp : TrendingDown}
              label={isProfit ? 'Total Profit' : 'Total Loss'}
              value={formatCurrency(Math.abs(d.totalProfit || 0))}
              sub={`Labour: ${formatCurrency(d.totalLabour)}`}
              color={isProfit ? 'bg-emerald-600' : 'bg-red-600'}
            />
            <StatCard
              icon={Clock}
              label="Pending Payments"
              value={formatCurrency(d.totalPending)}
              color="bg-amber-600"
            />
          </>
        )}
      </div>

      {/* Recent Clients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-base">Recent Clients</h3>
          <Link
            to="/clients"
            className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300 transition-colors"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="space-y-2">
          {loading ? (
            <>
              <ClientRowSkeleton />
              <ClientRowSkeleton />
              <ClientRowSkeleton />
            </>
          ) : (d.recentClients || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="bg-slate-800/60 border border-slate-700/40 rounded-full p-4">
                <Users size={28} className="text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm font-medium">No clients yet</p>
              <p className="text-slate-600 text-xs">Get started by adding your first client</p>
              <Link
                to="/clients/add"
                className="mt-1 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <Plus size={14} /> Add First Client
              </Link>
            </div>
          ) : (
            (d.recentClients || []).map((c) => (
              <Link
                key={c._id}
                to={`/clients/${c._id}`}
                className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 rounded-xl px-4 py-3 transition-colors group"
              >
                <div>
                  <p className="text-white font-medium text-sm">{c.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Remaining: {formatCurrency(c.remainingPayment)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${c.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {c.profitLoss >= 0 ? '+' : ''}{formatCurrency(c.profitLoss)}
                  </p>
                  <p className="text-slate-500 text-xs">P/L</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/estimates/new"
          className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-600/30 rounded-2xl p-4 hover:border-blue-500/50 transition-all"
        >
          <p className="text-blue-300 font-semibold text-sm">New Estimate</p>
          <p className="text-slate-500 text-xs mt-1">Create quotation</p>
        </Link>
        <Link
          to="/invoices/new"
          className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-600/30 rounded-2xl p-4 hover:border-purple-500/50 transition-all"
        >
          <p className="text-purple-300 font-semibold text-sm">New Invoice</p>
          <p className="text-slate-500 text-xs mt-1">Create invoice</p>
        </Link>
      </div>

    </div>
  );
}

// import { useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { Users, TrendingUp, TrendingDown, Clock, ArrowRight, Plus } from 'lucide-react';
// import useClientStore from '../store/clientStore';
// import { formatCurrency } from '../utils/formatCurrency';

// const StatCard = ({ icon: Icon, label, value, sub, color }) => (
//   <div className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex items-start gap-4`}>
//     <div className={`p-3 rounded-xl ${color}`}>
//       {Icon && <Icon size={20} className="text-white" />}
//     </div>
//     <div>
//       <p className="text-slate-400 text-xs font-medium">{label}</p>
//       <p className="text-white font-bold text-xl mt-0.5">{value}</p>
//       {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
//     </div>
//   </div>
// );

// export default function Dashboard() {
//   const { dashboard, fetchDashboard, loading } = useClientStore();

//   useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

//   const d = dashboard || {};
//   const isProfit = (d.totalProfit || 0) >= 0;

//   return (
//     <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-white font-bold text-2xl">Dashboard</h2>
//           <p className="text-slate-400 text-sm mt-0.5">HST GROUP overview</p>
//         </div>
//         <Link
//           to="/clients/add"
//           className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
//         >
//           <Plus size={16} />
//           <span className="hidden sm:inline">New Client</span>
//         </Link>
//       </div>

//       {/* Stats */}
//       {loading ? (
//         <div className="grid grid-cols-2 gap-3">
//           {[...Array(4)].map((_, i) => (
//             <div key={i} className="bg-slate-800/40 rounded-2xl h-24 animate-pulse" />
//           ))}
//         </div>
//       ) : (
//         <div className="grid grid-cols-2 gap-3">
//           <StatCard icon={Users} label="Total Clients" value={d.totalClients || 0} color="bg-blue-600" />
//           <StatCard icon={TrendingUp} label="Revenue Collected" value={formatCurrency(d.totalRevenue)} color="bg-green-600" />
//           <StatCard
//             icon={isProfit ? TrendingUp : TrendingDown}
//             label={isProfit ? 'Total Profit' : 'Total Loss'}
//             value={formatCurrency(Math.abs(d.totalProfit || 0))}
//             sub={`Labour: ${formatCurrency(d.totalLabour)}`}
//             color={isProfit ? 'bg-emerald-600' : 'bg-red-600'}
//           />
//           <StatCard icon={Clock} label="Pending Payments" value={formatCurrency(d.totalPending)} color="bg-amber-600" />
//         </div>
//       )}

//       {/* Recent Clients */}
//       <div>
//         <div className="flex items-center justify-between mb-3">
//           <h3 className="text-white font-semibold text-base">Recent Clients</h3>
//           <Link to="/clients" className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300">
//             View all <ArrowRight size={14} />
//           </Link>
//         </div>
//         <div className="space-y-2">
//           {(d.recentClients || []).length === 0 && !loading && (
//             <p className="text-slate-500 text-sm text-center py-8">No clients yet. Add your first client!</p>
//           )}
//           {(d.recentClients || []).map((c) => (
//             <Link
//               key={c._id}
//               to={`/clients/${c._id}`}
//               className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 rounded-xl px-4 py-3 transition-colors group"
//             >
//               <div>
//                 <p className="text-white font-medium text-sm">{c.name}</p>
//                 <p className="text-slate-500 text-xs mt-0.5">
//                   Remaining: {formatCurrency(c.remainingPayment)}
//                 </p>
//               </div>
//               <div className="text-right">
//                 <p className={`font-semibold text-sm ${c.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
//                   {c.profitLoss >= 0 ? '+' : ''}{formatCurrency(c.profitLoss)}
//                 </p>
//                 <p className="text-slate-500 text-xs">P/L</p>
//               </div>
//             </Link>
//           ))}
//         </div>
//       </div>

//       {/* Quick Links */}
//       <div className="grid grid-cols-2 gap-3">
//         <Link to="/estimates/new"
//           className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-600/30 rounded-2xl p-4 hover:border-blue-500/50 transition-all group">
//           <p className="text-blue-300 font-semibold text-sm">New Estimate</p>
//           <p className="text-slate-500 text-xs mt-1">Create quotation</p>
//         </Link>
//         <Link to="/invoices/new"
//           className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-600/30 rounded-2xl p-4 hover:border-purple-500/50 transition-all group">
//           <p className="text-purple-300 font-semibold text-sm">New Invoice</p>
//           <p className="text-slate-500 text-xs mt-1">Create invoice</p>
//         </Link>
//       </div>
//     </div>
//   );
// }
