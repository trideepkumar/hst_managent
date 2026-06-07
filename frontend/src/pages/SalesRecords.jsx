import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Calendar, Phone, MapPin, User, TrendingUp, DollarSign, Package, LayoutGrid, Table, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSales, deleteSale, getProducts, createSale } from '../services/storeService';
import useUIStore from '../store/uiStore';
import { formatCurrency, formatDate } from '../utils/formatCurrency';

export default function SalesRecords() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const { openModal } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('cards');
  const [sellModal, setSellModal] = useState(false);
  const [form, setForm] = useState({});

  const fetchData = async () => {
    try {
      const [salesData, productsData] = await Promise.all([getSales(), getProducts()]);
      setSales(salesData);
      setProducts(productsData);
    } catch (error) {
      toast.error('Failed to load sales records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedProduct = products.find(
    (p) => (p._id || p.id) === form.productId
  );

  const handleSell = async (e) => {
    e.preventDefault();
    if (!form.productId) { toast.error('Please select a product'); return; }
    const qtySold = Number(form.quantitySold);
    if (!qtySold || qtySold <= 0) { toast.error('Invalid quantity'); return; }
    if (selectedProduct && qtySold > selectedProduct.quantity) {
      toast.error('Cannot sell more than available stock!'); return;
    }
    if (!form.customerName) { toast.error('Customer name is required'); return; }
    try {
      await createSale({
        productId: form.productId,
        quantitySold: qtySold,
        date: form.saleDate || new Date().toISOString(),
        customerName: form.customerName,
        customerPhone: form.customerPhone || '',
        customerAddress: form.customerAddress || '',
      });
      toast.success('Sale recorded successfully!');
      setSellModal(false);
      setForm({});
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record sale');
    }
  };

  const handleDelete = (s) => {
    openModal(
      'Delete Sale Record',
      `Delete sale record for ${s.productName}? This will NOT return stock to inventory.`,
      async () => {
        try {
          await deleteSale(s._id || s.id);
          fetchData();
          toast.success('Sale record deleted');
        } catch (error) {
          toast.error('Failed to delete sale');
        }
      }
    );
  };

  // ── Analytics ────────────────────────────────────────────────────────────────
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalUnitsSold = sales.reduce((acc, s) => acc + s.quantitySold, 0);
  const avgOrderValue = sales.length ? totalRevenue / sales.length : 0;

  const productTotals = sales.reduce((acc, s) => {
    const key = s.productName;
    if (!acc[key]) acc[key] = { revenue: 0, units: 0 };
    acc[key].revenue += s.totalAmount;
    acc[key].units += s.quantitySold;
    return acc;
  }, {});
  const topProduct = Object.entries(productTotals).sort((a, b) => b[1].revenue - a[1].revenue)[0];

  // ── Shared ───────────────────────────────────────────────────────────────────
  const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';

  const ViewToggle = () => (
    <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => setView('cards')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          view === 'cards' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutGrid size={13} /> Cards
      </button>
      <button
        onClick={() => setView('table')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          view === 'table' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Table size={13} /> Table
      </button>
    </div>
  );

  // ── Cards View ───────────────────────────────────────────────────────────────
  const CardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sales.map((s) => (
        <div
          key={s._id || s.id}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col transition-colors hover:bg-slate-800"
        >
          <div className="flex justify-between items-start mb-3 border-b border-slate-700/50 pb-3">
            <div>
              <h4 className="text-white font-medium">{s.productName}</h4>
              <p className="text-slate-400 text-sm mt-0.5">
                <span className="text-blue-400 font-medium">{s.quantitySold} units</span>{' '}
                @ {formatCurrency(s.priceAtSale)}
              </p>
            </div>
            <div className="text-right flex space-x-3 items-start">
              <div>
                <h4 className="text-green-400 font-bold">{formatCurrency(s.totalAmount)}</h4>
                <p className="text-slate-500 text-[10px] font-mono mt-0.5 uppercase">
                  #{(s._id || s.id).slice(-6)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(s)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <div className="space-y-2 mt-auto">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <User size={14} className="text-slate-500 shrink-0" />
              <span className="font-medium truncate">{s.customerName || 'N/A'}</span>
            </div>
            {(s.customerPhone || s.date) && (
              <div className="flex items-center gap-4 text-slate-400 text-xs">
                {s.customerPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-slate-500" />
                    <span>{s.customerPhone}</span>
                  </div>
                )}
                {s.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-500" />
                    <span>{formatDate(s.date)}</span>
                  </div>
                )}
              </div>
            )}
            {s.customerAddress && (
              <div className="flex items-start gap-1.5 text-slate-400 text-xs mt-1">
                <MapPin size={12} className="text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-tight">{s.customerAddress}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Table View ───────────────────────────────────────────────────────────────
  const TableView = () => (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-3 font-semibold">#</th>
            <th className="text-left px-4 py-3 font-semibold">Product</th>
            <th className="text-left px-4 py-3 font-semibold">Customer</th>
            <th className="text-left px-4 py-3 font-semibold">Phone</th>
            <th className="text-left px-4 py-3 font-semibold">Address</th>
            <th className="text-right px-4 py-3 font-semibold">Qty</th>
            <th className="text-right px-4 py-3 font-semibold">Rate</th>
            <th className="text-right px-4 py-3 font-semibold">Amount</th>
            <th className="text-right px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/40">
          {sales.map((s, idx) => (
            <tr key={s._id || s.id} className="bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
              <td className="px-4 py-3 text-white font-medium">{s.productName}</td>
              <td className="px-4 py-3 text-slate-300">{s.customerName || '—'}</td>
              <td className="px-4 py-3 text-slate-400">{s.customerPhone || '—'}</td>
              <td className="px-4 py-3 text-slate-400 max-w-[120px] truncate">{s.customerAddress || '—'}</td>
              <td className="px-4 py-3 text-blue-400 font-semibold text-right">{s.quantitySold}</td>
              <td className="px-4 py-3 text-slate-300 text-right">{formatCurrency(s.priceAtSale)}</td>
              <td className="px-4 py-3 text-green-400 font-bold text-right">{formatCurrency(s.totalAmount)}</td>
              <td className="px-4 py-3 text-slate-400 text-right whitespace-nowrap">{formatDate(s.date)}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => handleDelete(s)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-800/80 border-t border-slate-600">
            <td colSpan={5} className="px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Total ({sales.length} records)
            </td>
            <td className="px-4 py-3 text-blue-400 font-bold text-right">{totalUnitsSold}</td>
            <td />
            <td className="px-4 py-3 text-green-400 font-bold text-right">{formatCurrency(totalRevenue)}</td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Sales Records</h2>
          <p className="text-slate-400 text-sm mt-0.5">{sales.length} total records</p>
        </div>
        <button
          onClick={() => { setForm({}); setSellModal(true); }}
          disabled={isLoading}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} /> Add Sale
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/40">
          <div className="p-4 bg-slate-800/50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No sales recorded yet</p>
          <p className="text-slate-500 text-sm mt-1">Click "Add Sale" to record your first sale.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={15} className="text-green-400" />
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
              </div>
              <p className="text-white font-bold text-xl">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={15} className="text-blue-400" />
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Units Sold</span>
              </div>
              <p className="text-white font-bold text-xl">{totalUnitsSold}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={15} className="text-purple-400" />
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg. Order</span>
              </div>
              <p className="text-white font-bold text-xl">{formatCurrency(avgOrderValue)}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart size={15} className="text-amber-400" />
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Top Product</span>
              </div>
              {topProduct ? (
                <>
                  <p className="text-white font-bold text-base leading-tight truncate">{topProduct[0]}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{formatCurrency(topProduct[1].revenue)}</p>
                </>
              ) : (
                <p className="text-slate-500 text-sm">—</p>
              )}
            </div>
          </div>

          {/* Revenue by Product Breakdown */}
          {Object.keys(productTotals).length > 1 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Revenue by Product</p>
              <div className="space-y-2.5">
                {Object.entries(productTotals)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([name, data]) => {
                    const pct = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
                    return (
                      <div key={name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-300 text-xs font-medium truncate max-w-[60%]">{name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 text-xs">{data.units} units</span>
                            <span className="text-white text-xs font-semibold">{formatCurrency(data.revenue)}</span>
                            <span className="text-slate-500 text-xs w-8 text-right">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Records Header with Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">All Records</h3>
            <ViewToggle />
          </div>

          {view === 'cards' ? <CardsView /> : <TableView />}
        </>
      )}

      {/* Add Sale Modal */}
      {sellModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-bold text-lg mb-4">Record New Sale</h3>
            <form onSubmit={handleSell} className="space-y-3">

              {/* Product selector */}
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Product</label>
                <select
                  className={inputCls}
                  value={form.productId || ''}
                  onChange={(e) => setForm({ ...form, productId: e.target.value, quantitySold: '' })}
                  required
                >
                  <option value="" disabled>Select a product...</option>
                  {products.filter((p) => p.quantity > 0).map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} — {formatCurrency(p.price)} ({p.quantity} in stock)
                    </option>
                  ))}
                </select>
                {products.filter((p) => p.quantity > 0).length === 0 && (
                  <p className="text-amber-400 text-xs mt-1">No products with stock available.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Quantity to Sell</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="1"
                    max={selectedProduct?.quantity || undefined}
                    value={form.quantitySold || ''}
                    onChange={(e) => setForm({ ...form, quantitySold: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Date of Sale</label>
                  <input
                    className={inputCls}
                    type="date"
                    value={form.saleDate || ''}
                    onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Customer Name</label>
                <input
                  className={inputCls}
                  type="text"
                  value={form.customerName || ''}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Name"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Phone Number</label>
                <input
                  className={inputCls}
                  type="text"
                  value={form.customerPhone || ''}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="Phone"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">Address</label>
                <textarea
                  className={`${inputCls} resize-none h-16`}
                  value={form.customerAddress || ''}
                  onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                  placeholder="Address"
                />
              </div>

              {/* Total preview */}
              {selectedProduct && Number(form.quantitySold) > 0 && (
                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl">
                  <span className="text-slate-400 text-sm">Total Amount:</span>
                  <span className="text-green-400 font-bold text-lg">
                    {formatCurrency((Number(form.quantitySold) || 0) * selectedProduct.price)}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setSellModal(false); setForm({}); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  Confirm Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// import { useState, useEffect } from 'react';
// import { ShoppingCart, Trash2, Calendar, Phone, MapPin, User, TrendingUp, DollarSign, Package, LayoutGrid, Table } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { getSales, deleteSale } from '../services/storeService';
// import useUIStore from '../store/uiStore';
// import { formatCurrency, formatDate } from '../utils/formatCurrency';

// export default function SalesRecords() {
//   const [sales, setSales] = useState([]);
//   const { openModal } = useUIStore();
//   const [isLoading, setIsLoading] = useState(true);
//   const [view, setView] = useState('cards');

//   const fetchSales = async () => {
//     try {
//       const data = await getSales();
//       setSales(data);
//     } catch (error) {
//       toast.error('Failed to load sales records');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => { fetchSales(); }, []);

//   const handleDelete = (s) => {
//     openModal(
//       'Delete Sale Record',
//       `Delete sale record for ${s.productName}? This will NOT return stock to inventory.`,
//       async () => {
//         try {
//           await deleteSale(s._id || s.id);
//           fetchSales();
//           toast.success('Sale record deleted');
//         } catch (error) {
//           toast.error('Failed to delete sale');
//         }
//       }
//     );
//   };

//   // ── Analytics ────────────────────────────────────────────────────────────────
//   const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
//   const totalUnitsSold = sales.reduce((acc, s) => acc + s.quantitySold, 0);
//   const avgOrderValue = sales.length ? totalRevenue / sales.length : 0;

//   // Top selling product
//   const productTotals = sales.reduce((acc, s) => {
//     const key = s.productName;
//     if (!acc[key]) acc[key] = { revenue: 0, units: 0 };
//     acc[key].revenue += s.totalAmount;
//     acc[key].units += s.quantitySold;
//     return acc;
//   }, {});
//   const topProduct = Object.entries(productTotals).sort((a, b) => b[1].revenue - a[1].revenue)[0];

//   // ── Shared Styles ────────────────────────────────────────────────────────────
//   const ViewToggle = () => (
//     <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 gap-0.5">
//       <button
//         onClick={() => setView('cards')}
//         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
//           view === 'cards' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
//         }`}
//       >
//         <LayoutGrid size={13} /> Cards
//       </button>
//       <button
//         onClick={() => setView('table')}
//         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
//           view === 'table' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
//         }`}
//       >
//         <Table size={13} /> Table
//       </button>
//     </div>
//   );

//   // ── Cards View ───────────────────────────────────────────────────────────────
//   const CardsView = () => (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//       {sales.map((s) => (
//         <div
//           key={s._id || s.id}
//           className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col transition-colors hover:bg-slate-800"
//         >
//           <div className="flex justify-between items-start mb-3 border-b border-slate-700/50 pb-3">
//             <div>
//               <h4 className="text-white font-medium">{s.productName}</h4>
//               <p className="text-slate-400 text-sm mt-0.5">
//                 <span className="text-blue-400 font-medium">{s.quantitySold} units</span>{' '}
//                 @ {formatCurrency(s.priceAtSale)}
//               </p>
//             </div>
//             <div className="text-right flex space-x-3 items-start">
//               <div>
//                 <h4 className="text-green-400 font-bold">{formatCurrency(s.totalAmount)}</h4>
//                 <p className="text-slate-500 text-[10px] font-mono mt-0.5 uppercase">
//                   #{(s._id || s.id).slice(-6)}
//                 </p>
//               </div>
//               <button
//                 onClick={() => handleDelete(s)}
//                 className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
//               >
//                 <Trash2 size={15} />
//               </button>
//             </div>
//           </div>

//           <div className="space-y-2 mt-auto">
//             <div className="flex items-center gap-2 text-slate-300 text-sm">
//               <User size={14} className="text-slate-500 shrink-0" />
//               <span className="font-medium truncate">{s.customerName || 'N/A'}</span>
//             </div>
//             {(s.customerPhone || s.date) && (
//               <div className="flex items-center gap-4 text-slate-400 text-xs">
//                 {s.customerPhone && (
//                   <div className="flex items-center gap-1.5">
//                     <Phone size={12} className="text-slate-500" />
//                     <span>{s.customerPhone}</span>
//                   </div>
//                 )}
//                 {s.date && (
//                   <div className="flex items-center gap-1.5">
//                     <Calendar size={12} className="text-slate-500" />
//                     <span>{formatDate(s.date)}</span>
//                   </div>
//                 )}
//               </div>
//             )}
//             {s.customerAddress && (
//               <div className="flex items-start gap-1.5 text-slate-400 text-xs mt-1">
//                 <MapPin size={12} className="text-slate-500 shrink-0 mt-0.5" />
//                 <span className="leading-tight">{s.customerAddress}</span>
//               </div>
//             )}
//           </div>
//         </div>
//       ))}
//     </div>
//   );

//   // ── Table View ───────────────────────────────────────────────────────────────
//   const TableView = () => (
//     <div className="overflow-x-auto rounded-xl border border-slate-700/50">
//       <table className="w-full text-sm">
//         <thead>
//           <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
//             <th className="text-left px-4 py-3 font-semibold">#</th>
//             <th className="text-left px-4 py-3 font-semibold">Product</th>
//             <th className="text-left px-4 py-3 font-semibold">Customer</th>
//             <th className="text-left px-4 py-3 font-semibold">Phone</th>
//             <th className="text-left px-4 py-3 font-semibold">Address</th>
//             <th className="text-right px-4 py-3 font-semibold">Qty</th>
//             <th className="text-right px-4 py-3 font-semibold">Rate</th>
//             <th className="text-right px-4 py-3 font-semibold">Amount</th>
//             <th className="text-right px-4 py-3 font-semibold">Date</th>
//             <th className="px-4 py-3" />
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-slate-700/40">
//           {sales.map((s, idx) => (
//             <tr key={s._id || s.id} className="bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
//               <td className="px-4 py-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
//               <td className="px-4 py-3 text-white font-medium">{s.productName}</td>
//               <td className="px-4 py-3 text-slate-300">{s.customerName || '—'}</td>
//               <td className="px-4 py-3 text-slate-400">{s.customerPhone || '—'}</td>
//               <td className="px-4 py-3 text-slate-400 max-w-[120px] truncate">{s.customerAddress || '—'}</td>
//               <td className="px-4 py-3 text-blue-400 font-semibold text-right">{s.quantitySold}</td>
//               <td className="px-4 py-3 text-slate-300 text-right">{formatCurrency(s.priceAtSale)}</td>
//               <td className="px-4 py-3 text-green-400 font-bold text-right">{formatCurrency(s.totalAmount)}</td>
//               <td className="px-4 py-3 text-slate-400 text-right whitespace-nowrap">{formatDate(s.date)}</td>
//               <td className="px-4 py-3 text-center">
//                 <button
//                   onClick={() => handleDelete(s)}
//                   className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
//                 >
//                   <Trash2 size={14} />
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//         {/* Totals row */}
//         <tfoot>
//           <tr className="bg-slate-800/80 border-t border-slate-600">
//             <td colSpan={5} className="px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">
//               Total ({sales.length} records)
//             </td>
//             <td className="px-4 py-3 text-blue-400 font-bold text-right">{totalUnitsSold}</td>
//             <td />
//             <td className="px-4 py-3 text-green-400 font-bold text-right">{formatCurrency(totalRevenue)}</td>
//             <td colSpan={2} />
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   );

//   // ── Render ───────────────────────────────────────────────────────────────────
//   return (
//     <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-5">

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-white font-bold text-2xl">Sales Records</h2>
//           <p className="text-slate-400 text-sm mt-0.5">{sales.length} total records</p>
//         </div>
//       </div>

//       {isLoading ? (
//         <div className="flex justify-center items-center py-20">
//           <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
//         </div>
//       ) : sales.length === 0 ? (
//         <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/40">
//           <div className="p-4 bg-slate-800/50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
//             <ShoppingCart size={28} className="text-slate-500" />
//           </div>
//           <p className="text-slate-400 font-medium">No sales recorded yet</p>
//           <p className="text-slate-500 text-sm mt-1">Go to the Store to sell products.</p>
//         </div>
//       ) : (
//         <>
//           {/* ── Summary Stats ── */}
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
//             <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
//               <div className="flex items-center gap-2 mb-2">
//                 <DollarSign size={15} className="text-green-400" />
//                 <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
//               </div>
//               <p className="text-white font-bold text-xl">{formatCurrency(totalRevenue)}</p>
//             </div>

//             <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
//               <div className="flex items-center gap-2 mb-2">
//                 <Package size={15} className="text-blue-400" />
//                 <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Units Sold</span>
//               </div>
//               <p className="text-white font-bold text-xl">{totalUnitsSold}</p>
//             </div>

//             <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
//               <div className="flex items-center gap-2 mb-2">
//                 <TrendingUp size={15} className="text-purple-400" />
//                 <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg. Order</span>
//               </div>
//               <p className="text-white font-bold text-xl">{formatCurrency(avgOrderValue)}</p>
//             </div>

//             <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
//               <div className="flex items-center gap-2 mb-2">
//                 <ShoppingCart size={15} className="text-amber-400" />
//                 <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Top Product</span>
//               </div>
//               {topProduct ? (
//                 <>
//                   <p className="text-white font-bold text-base leading-tight truncate">{topProduct[0]}</p>
//                   <p className="text-slate-400 text-xs mt-0.5">{formatCurrency(topProduct[1].revenue)}</p>
//                 </>
//               ) : (
//                 <p className="text-slate-500 text-sm">—</p>
//               )}
//             </div>
//           </div>

//           {/* ── Product Breakdown Bar ── */}
//           {Object.keys(productTotals).length > 1 && (
//             <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
//               <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Revenue by Product</p>
//               <div className="space-y-2.5">
//                 {Object.entries(productTotals)
//                   .sort((a, b) => b[1].revenue - a[1].revenue)
//                   .map(([name, data]) => {
//                     const pct = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
//                     return (
//                       <div key={name}>
//                         <div className="flex justify-between items-center mb-1">
//                           <span className="text-slate-300 text-xs font-medium truncate max-w-[60%]">{name}</span>
//                           <div className="flex items-center gap-3">
//                             <span className="text-slate-500 text-xs">{data.units} units</span>
//                             <span className="text-white text-xs font-semibold">{formatCurrency(data.revenue)}</span>
//                             <span className="text-slate-500 text-xs w-8 text-right">{pct.toFixed(0)}%</span>
//                           </div>
//                         </div>
//                         <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
//                           <div
//                             className="h-full bg-blue-500 rounded-full transition-all duration-500"
//                             style={{ width: `${pct}%` }}
//                           />
//                         </div>
//                       </div>
//                     );
//                   })}
//               </div>
//             </div>
//           )}

//           {/* ── Records Header with Toggle ── */}
//           <div className="flex items-center justify-between">
//             <h3 className="text-white font-semibold text-lg">All Records</h3>
//             <ViewToggle />
//           </div>

//           {/* ── Records ── */}
//           {view === 'cards' ? <CardsView /> : <TableView />}
//         </>
//       )}
//     </div>
//   );
// }

// // import { useState, useEffect } from 'react';
// // import { ShoppingCart, Trash2, Calendar, Phone, MapPin, User } from 'lucide-react';
// // import toast from 'react-hot-toast';
// // import { getSales, deleteSale } from '../services/storeService';
// // import useUIStore from '../store/uiStore';
// // import { formatCurrency, formatDate } from '../utils/formatCurrency';

// // export default function SalesRecords() {
// //   const [sales, setSales] = useState([]);
// //   const { openModal } = useUIStore();

// //   const [isLoading, setIsLoading] = useState(true);

// //   const fetchSales = async () => {
// //     try {
// //       const data = await getSales();
// //       setSales(data);
// //     } catch (error) {
// //       toast.error('Failed to load sales records');
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   useEffect(() => { fetchSales(); }, []);

// //   const handleDelete = (s) => {
// //     openModal('Delete Sale Record', `Delete sale record for ${s.productName}? This will NOT return stock to inventory.`, async () => {
// //       try {
// //         await deleteSale(s._id || s.id);
// //         fetchSales();
// //         toast.success('Sale record deleted');
// //       } catch (error) {
// //         toast.error('Failed to delete sale');
// //       }
// //     });
// //   };

// //   return (
// //     <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <h2 className="text-white font-bold text-2xl">Sales Records</h2>
// //           <p className="text-slate-400 text-sm mt-0.5">{sales.length} total records</p>
// //         </div>
// //       </div>

// //       {isLoading ? (
// //         <div className="flex justify-center items-center py-20">
// //           <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
// //         </div>
// //       ) : sales.length === 0 ? (
// //         <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/40">
// //           <div className="p-4 bg-slate-800/50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
// //             <ShoppingCart size={28} className="text-slate-500" />
// //           </div>
// //           <p className="text-slate-400 font-medium">No sales recorded yet</p>
// //           <p className="text-slate-500 text-sm mt-1">Go to the Store to sell products.</p>
// //         </div>
// //       ) : (
// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
// //           {sales.map((s) => (
// //             <div key={s._id || s.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col transition-colors hover:bg-slate-800">
// //               <div className="flex justify-between items-start mb-3 border-b border-slate-700/50 pb-3">
// //                 <div>
// //                   <h4 className="text-white font-medium">{s.productName}</h4>
// //                   <p className="text-slate-400 text-sm mt-0.5"><span className="text-blue-400 font-medium">{s.quantitySold} units</span> @ {formatCurrency(s.priceAtSale)}</p>
// //                 </div>
// //                 <div className="text-right flex space-x-3 items-start">
// //                   <div>
// //                     <h4 className="text-green-400 font-bold">{formatCurrency(s.totalAmount)}</h4>
// //                     <p className="text-slate-500 text-[10px] font-mono mt-0.5 uppercase">{(s._id || s.id).slice(-6)}</p>
// //                   </div>
// //                   <button onClick={() => handleDelete(s)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0">
// //                     <Trash2 size={15} />
// //                   </button>
// //                 </div>
// //               </div>
              
// //               <div className="space-y-2 mt-auto">
// //                 <div className="flex items-center gap-2 text-slate-300 text-sm">
// //                   <User size={14} className="text-slate-500 shrink-0" />
// //                   <span className="font-medium truncate">{s.customerName || 'N/A'}</span>
// //                 </div>
                
// //                 {(s.customerPhone || s.date) && (
// //                   <div className="flex items-center gap-4 text-slate-400 text-xs">
// //                     {s.customerPhone && (
// //                       <div className="flex items-center gap-1.5">
// //                         <Phone size={12} className="text-slate-500" />
// //                         <span>{s.customerPhone}</span>
// //                       </div>
// //                     )}
// //                     {s.date && (
// //                       <div className="flex items-center gap-1.5">
// //                         <Calendar size={12} className="text-slate-500" />
// //                         <span>{formatDate(s.date)}</span>
// //                       </div>
// //                     )}
// //                   </div>
// //                 )}
                
// //                 {s.customerAddress && (
// //                   <div className="flex items-start gap-1.5 text-slate-400 text-xs mt-1">
// //                     <MapPin size={12} className="text-slate-500 shrink-0 mt-0.5" />
// //                     <span className="leading-tight">{s.customerAddress}</span>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }
