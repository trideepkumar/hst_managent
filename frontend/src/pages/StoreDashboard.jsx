
import { useState, useEffect } from 'react';
import { Package, TrendingUp, DollarSign, AlertCircle, Plus, Edit, Trash2, ShoppingCart, LayoutGrid, Table } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts, createProduct, updateProduct, deleteProduct, getSales, createSale } from '../services/storeService';
import useUIStore from '../store/uiStore';
import { formatCurrency, formatDate } from '../utils/formatCurrency';

export default function StoreDashboard() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const { openModal } = useUIStore();

  const [productModal, setProductModal] = useState({ isOpen: false, editData: null });
  const [sellModal, setSellModal] = useState({ isOpen: false, product: null });
  const [showStockModal, setShowStockModal] = useState(false);
  const [form, setForm] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // View toggle state: 'cards' | 'table'
  const [inventoryView, setInventoryView] = useState('cards');
  const [salesView, setSalesView] = useState('cards');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [productsData, salesData] = await Promise.all([getProducts(), getSales()]);
      setProducts(productsData);
      setSales(salesData);
    } catch (error) {
      toast.error('Failed to load store data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.quantity || !form.price) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      const data = {
        name: form.name,
        quantity: Number(form.quantity),
        price: Number(form.price),
      };
      if (productModal.editData) {
        await updateProduct(productModal.editData._id || productModal.editData.id, data);
        toast.success('Product updated');
      } else {
        await createProduct(data);
        toast.success('Product added');
      }
      setProductModal({ isOpen: false, editData: null });
      setForm({});
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = (p) => {
    openModal('Delete Product', `Are you sure you want to delete ${p.name}?`, async () => {
      try {
        await deleteProduct(p._id || p.id);
        toast.success('Product deleted');
        fetchDashboardData();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    });
  };

  const handleSellProduct = async (e) => {
    e.preventDefault();
    const qtySold = Number(form.quantitySold);
    if (!qtySold || qtySold <= 0) {
      toast.error('Invalid quantity');
      return;
    }
    if (qtySold > sellModal.product.quantity) {
      toast.error('Cannot sell more than available stock!');
      return;
    }
    try {
      const saleData = {
        productId: sellModal.product._id || sellModal.product.id,
        quantitySold: qtySold,
        date: form.saleDate || new Date().toISOString(),
        customerName: form.customerName || '',
        customerPhone: form.customerPhone || '',
        customerAddress: form.customerAddress || '',
      };
      await createSale(saleData);
      toast.success('Sale recorded successfully!');
      setSellModal({ isOpen: false, product: null });
      setForm({});
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record sale');
    }
  };

  const totalProducts = products.length;
  const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);
  const remainingValue = products.reduce((acc, p) => acc + p.quantity * p.price, 0);
  const totalSoldRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

  // ── Reusable Components ──────────────────────────────────────────────────────

  const StatCard = ({ title, value, icon: Icon, colorCls, onClick }) => (
    <div
      onClick={onClick}
      className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 ${
        onClick ? 'cursor-pointer hover:bg-slate-800 transition-colors ring-1 ring-transparent hover:ring-amber-500/30' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className={colorCls} />
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</span>
        </div>
        {onClick && <span className="text-[10px] bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded">View</span>}
      </div>
      <p className="text-white font-bold text-xl">{value}</p>
    </div>
  );

  const ViewToggle = ({ view, setView }) => (
    <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => setView('cards')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          view === 'cards'
            ? 'bg-slate-600 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutGrid size={13} /> Cards
      </button>
      <button
        onClick={() => setView('table')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          view === 'table'
            ? 'bg-slate-600 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Table size={13} /> Table
      </button>
    </div>
  );

  const StockBadge = ({ qty }) => {
    if (qty === 0) return <span className="text-[10px] uppercase bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">Out of stock</span>;
    if (qty < 5) return <span className="text-[10px] uppercase bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">Low stock</span>;
    return null;
  };

  const stockColor = (qty) =>
    qty === 0 ? 'text-red-500' : qty < 5 ? 'text-amber-500' : 'text-green-400';

  const inputCls =
    'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';

  // ── Inventory Views ──────────────────────────────────────────────────────────

  const InventoryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {products.map((p) => (
        <div
          key={p._id || p.id}
          className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-4 transition-colors flex flex-col"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="min-w-0 pr-2">
              <h4 className="text-white font-medium truncate">{p.name}</h4>
              <p className="text-blue-400 font-semibold text-sm">
                {formatCurrency(p.price)}{' '}
                <span className="text-slate-500 text-xs font-normal">/ unit</span>
              </p>
            </div>
            <div className="flex bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => { setForm({ ...p }); setProductModal({ isOpen: true, editData: p }); }}
                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
              >
                <Edit size={14} />
              </button>
              <div className="w-px bg-slate-700" />
              <button
                onClick={() => handleDeleteProduct(p)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">Stock:</span>
              <span className={`font-mono text-sm font-bold ${stockColor(p.quantity)}`}>{p.quantity}</span>
              <StockBadge qty={p.quantity} />
            </div>
            <button
              onClick={() => { setForm({}); setSellModal({ isOpen: true, product: p }); }}
              disabled={p.quantity === 0}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <ShoppingCart size={14} /> Sell
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const InventoryTable = () => (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-3 font-semibold">Product</th>
            <th className="text-right px-4 py-3 font-semibold">Price / unit</th>
            <th className="text-right px-4 py-3 font-semibold">Stock</th>
            <th className="text-right px-4 py-3 font-semibold">Inv. value</th>
            <th className="text-center px-4 py-3 font-semibold">Status</th>
            <th className="text-center px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/40">
          {products.map((p) => (
            <tr key={p._id || p.id} className="bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
              <td className="px-4 py-3 text-white font-medium">{p.name}</td>
              <td className="px-4 py-3 text-blue-400 font-semibold text-right">{formatCurrency(p.price)}</td>
              <td className={`px-4 py-3 font-mono font-bold text-right ${stockColor(p.quantity)}`}>{p.quantity}</td>
              <td className="px-4 py-3 text-slate-300 text-right">{formatCurrency(p.quantity * p.price)}</td>
              <td className="px-4 py-3 text-center">
                {p.quantity === 0 ? (
                  <span className="text-[10px] uppercase bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">Out of stock</span>
                ) : p.quantity < 5 ? (
                  <span className="text-[10px] uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">Low stock</span>
                ) : (
                  <span className="text-[10px] uppercase bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold">In stock</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => { setForm({ ...p }); setProductModal({ isOpen: true, editData: p }); }}
                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => { setForm({}); setSellModal({ isOpen: true, product: p }); }}
                    disabled={p.quantity === 0}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-400 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <ShoppingCart size={12} /> Sell
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ── Sales Views ──────────────────────────────────────────────────────────────

  const SalesCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sales.length === 0 ? (
        <div className="col-span-2 bg-slate-800/40 rounded-2xl p-8 text-center border border-slate-700/40">
          <TrendingUp size={32} className="mx-auto text-slate-500 mb-3" />
          <p className="text-slate-400">No sales recorded yet.</p>
        </div>
      ) : (
        sales.map((s) => (
          <div
            key={s._id || s.id}
            className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-4 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-white font-medium">{s.productName || s.product?.name || '—'}</h4>
                <p className="text-slate-400 text-xs mt-0.5">{s.customerName || 'Unknown customer'}</p>
              </div>
              <span className="text-green-400 font-bold text-base">{formatCurrency(s.totalAmount)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-400">
              <div>Qty: <span className="text-white font-medium">{s.quantitySold}</span></div>
              <div>Date: <span className="text-white font-medium">{formatDate(s.date)}</span></div>
              {s.customerPhone && <div>Phone: <span className="text-white font-medium">{s.customerPhone}</span></div>}
              {s.customerAddress && (
                <div className="col-span-2 truncate">
                  Address: <span className="text-white font-medium">{s.customerAddress}</span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const SalesTable = () => (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-3 font-semibold">Product</th>
            <th className="text-left px-4 py-3 font-semibold">Customer</th>
            <th className="text-left px-4 py-3 font-semibold">Phone</th>
            <th className="text-left px-4 py-3 font-semibold">Address</th>
            <th className="text-right px-4 py-3 font-semibold">Qty</th>
            <th className="text-right px-4 py-3 font-semibold">Amount</th>
            <th className="text-right px-4 py-3 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/40">
          {sales.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No sales recorded yet.</td>
            </tr>
          ) : (
            sales.map((s) => (
              <tr key={s._id || s.id} className="bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
                <td className="px-4 py-3 text-white font-medium">{s.productName || s.product?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{s.customerName || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{s.customerPhone || '—'}</td>
                <td className="px-4 py-3 text-slate-300 max-w-[140px] truncate">{s.customerAddress || '—'}</td>
                <td className="px-4 py-3 text-white font-mono text-right">{s.quantitySold}</td>
                <td className="px-4 py-3 text-green-400 font-bold text-right">{formatCurrency(s.totalAmount)}</td>
                <td className="px-4 py-3 text-slate-400 text-right whitespace-nowrap">{formatDate(s.date)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Store Management</h2>
          <p className="text-slate-400 text-sm mt-0.5">Inventory & Sales Tracking</p>
        </div>
        <button
          onClick={() => { setForm({}); setProductModal({ isOpen: true, editData: null }); }}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} /> New Product
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <StatCard title="Total Products" value={totalProducts} icon={Package} colorCls="text-blue-400" />
            <StatCard title="Stocks Available" value={totalStock} icon={AlertCircle} colorCls="text-amber-400" onClick={() => setShowStockModal(true)} />
            <StatCard title="Total Revenue" value={formatCurrency(totalSoldRevenue)} icon={TrendingUp} colorCls="text-green-400" />
            <StatCard title="Inventory Value" value={formatCurrency(remainingValue)} icon={DollarSign} colorCls="text-purple-400" />
          </div>

          {/* Inventory Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-lg">Inventory</h3>
              <ViewToggle view={inventoryView} setView={setInventoryView} />
            </div>
            {products.length === 0 ? (
              <div className="bg-slate-800/40 rounded-2xl p-8 text-center border border-slate-700/40">
                <Package size={32} className="mx-auto text-slate-500 mb-3" />
                <p className="text-slate-400">No products in inventory.</p>
              </div>
            ) : inventoryView === 'cards' ? (
              <InventoryCards />
            ) : (
              <InventoryTable />
            )}
          </div>

          {/* Sales Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-lg">Sales</h3>
              <ViewToggle view={salesView} setView={setSalesView} />
            </div>
            {salesView === 'cards' ? <SalesCards /> : <SalesTable />}
          </div>
        </>
      )}

      {/* Product Modal */}
      {productModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5">
            <h3 className="text-white font-bold text-lg mb-4">
              {productModal.editData ? 'Edit Product' : 'Add New Product'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Product Name</label>
                <input
                  className={inputCls}
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Cement Bag"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Quantity</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    value={form.quantity || ''}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Price per Unit (₹)</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setProductModal({ isOpen: false, editData: null })}
                  className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {sellModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5">
            <h3 className="text-white font-bold text-lg mb-1">Sell Product</h3>
            <p className="text-slate-400 text-sm mb-4">
              Stock available: <span className="text-white font-bold">{sellModal.product.quantity}</span>
            </p>
            <form onSubmit={handleSellProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Quantity to Sell</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="1"
                    max={sellModal.product.quantity}
                    value={form.quantitySold || ''}
                    onChange={(e) => setForm({ ...form, quantitySold: e.target.value })}
                    placeholder="0"
                    required
                    autoFocus
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
                <label className="text-slate-400 text-xs mb-1 block">Customer / Seller Name</label>
                <input
                  className={inputCls}
                  type="text"
                  value={form.customerName || ''}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Name"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-400 text-xs mb-1 block">Phone Number</label>
                  <input
                    className={inputCls}
                    type="text"
                    value={form.customerPhone || ''}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="Phone"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-400 text-xs mb-1 block">Address</label>
                  <textarea
                    className={`${inputCls} resize-none h-16`}
                    value={form.customerAddress || ''}
                    onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                    placeholder="Address"
                  />
                </div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center text-sm mb-3 bg-slate-900/50 p-3 rounded-xl">
                  <span className="text-slate-400">Total Amount:</span>
                  <span className="text-green-400 font-bold text-lg">
                    {formatCurrency((Number(form.quantitySold) || 0) * sellModal.product.price)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSellModal({ isOpen: false, product: null })}
                  className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors">
                  Confirm Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Overview Modal */}
      {showStockModal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowStockModal(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Product Stocks Overview</h3>
              <button
                onClick={() => setShowStockModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-xs font-medium py-1 px-2 border border-slate-600 rounded bg-slate-700/50"
              >
                Close
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto pr-1 space-y-2 customized-scrollbar">
              {products.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No products available.</p>
              ) : (
                products.map((p) => (
                  <div
                    key={p._id || p.id}
                    className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50"
                  >
                    <span className="text-white font-medium text-sm">{p.name}</span>
                    <div className="flex flex-col items-end">
                      <span className={`font-bold text-lg leading-tight ${stockColor(p.quantity)}`}>{p.quantity}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Available</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// import { useState, useEffect } from 'react';
// import { Package, TrendingUp, DollarSign, AlertCircle, Plus, Edit, Trash2, ShoppingCart } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { getProducts, createProduct, updateProduct, deleteProduct, getSales, createSale } from '../services/storeService';
// import useUIStore from '../store/uiStore';
// import { formatCurrency, formatDate } from '../utils/formatCurrency';

// export default function StoreDashboard() {
//   const [products, setProducts] = useState([]);
//   const [sales, setSales] = useState([]);
//   const { openModal } = useUIStore();
  
//   const [productModal, setProductModal] = useState({ isOpen: false, editData: null });
//   const [sellModal, setSellModal] = useState({ isOpen: false, product: null });
//   const [showStockModal, setShowStockModal] = useState(false);
//   const [form, setForm] = useState({});

//   const [isLoading, setIsLoading] = useState(true);

//   const fetchDashboardData = async () => {
//     try {
//       setIsLoading(true);
//       const [productsData, salesData] = await Promise.all([getProducts(), getSales()]);
//       setProducts(productsData);
//       setSales(salesData);
//     } catch (error) {
//       toast.error('Failed to load store data');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const handleSaveProduct = async (e) => {
//     e.preventDefault();
//     if (!form.name || !form.quantity || !form.price) {
//       toast.error('Please fill all fields');
//       return;
//     }
    
//     try {
//       const data = {
//         name: form.name,
//         quantity: Number(form.quantity),
//         price: Number(form.price),
//       };

//       if (productModal.editData) {
//         await updateProduct(productModal.editData._id || productModal.editData.id, data);
//         toast.success('Product updated');
//       } else {
//         await createProduct(data);
//         toast.success('Product added');
//       }
      
//       setProductModal({ isOpen: false, editData: null });
//       setForm({});
//       fetchDashboardData();
//     } catch (error) {
//       toast.error('Failed to save product');
//     }
//   };

//   const handleDeleteProduct = (p) => {
//     openModal('Delete Product', `Are you sure you want to delete ${p.name}?`, async () => {
//       try {
//         await deleteProduct(p._id || p.id);
//         toast.success('Product deleted');
//         fetchDashboardData();
//       } catch (error) {
//         toast.error('Failed to delete product');
//       }
//     });
//   };

//   const handleSellProduct = async (e) => {
//     e.preventDefault();
//     const qtySold = Number(form.quantitySold);
//     if (!qtySold || qtySold <= 0) {
//       toast.error('Invalid quantity');
//       return;
//     }
//     if (qtySold > sellModal.product.quantity) {
//       toast.error('Cannot sell more than available stock!');
//       return;
//     }

//     try {
//       const saleData = {
//         productId: sellModal.product._id || sellModal.product.id,
//         quantitySold: qtySold,
//         date: form.saleDate || new Date().toISOString(),
//         customerName: form.customerName || '',
//         customerPhone: form.customerPhone || '',
//         customerAddress: form.customerAddress || '',
//       };

//       await createSale(saleData);
//       toast.success('Sale recorded successfully!');
//       setSellModal({ isOpen: false, product: null });
//       setForm({});
//       fetchDashboardData();
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Failed to record sale');
//     }
//   };

//   // Calculations
//   const totalProducts = products.length;
//   const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);
//   const remainingValue = products.reduce((acc, p) => acc + (p.quantity * p.price), 0);
//   const totalSoldRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

//   const StatCard = ({ title, value, icon: Icon, colorCls, onClick }) => (
//     <div onClick={onClick} className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 ${onClick ? 'cursor-pointer hover:bg-slate-800 transition-colors ring-1 ring-transparent hover:ring-amber-500/30' : ''}`}>
//       <div className="flex items-center justify-between mb-2">
//         <div className="flex items-center gap-2">
//           <Icon size={16} className={colorCls} />
//           <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</span>
//         </div>
//         {onClick && <span className="text-[10px] bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded">View</span>}
//       </div>
//       <p className="text-white font-bold text-xl">{value}</p>
//     </div>
//   );

//   const inputCls = "w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors";

//   return (
//     <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-white font-bold text-2xl">Store Management</h2>
//           <p className="text-slate-400 text-sm mt-0.5">Inventory & Sales Tracking</p>
//         </div>
//         <button
//           onClick={() => { setForm({}); setProductModal({ isOpen: true, editData: null }); }}
//           disabled={isLoading}
//           className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
//         >
//           <Plus size={16} /> New Product
//         </button>
//       </div>

//       {isLoading ? (
//         <div className="flex justify-center items-center py-20">
//           <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//         </div>
//       ) : (
//         <>
//           {/* Dashboard Stats */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
//         <StatCard title="Total Products" value={totalProducts} icon={Package} colorCls="text-blue-400" />
//         <StatCard title="Stocks Available" value={totalStock} icon={AlertCircle} colorCls="text-amber-400" onClick={() => setShowStockModal(true)} />
//         <StatCard title="Total Revenue" value={formatCurrency(totalSoldRevenue)} icon={TrendingUp} colorCls="text-green-400" />
//         <StatCard title="Inventory Value" value={formatCurrency(remainingValue)} icon={DollarSign} colorCls="text-purple-400" />
//       </div>

//       {/* Products List */}
//       <div>
//         <h3 className="text-white font-semibold text-lg mb-3">Inventory</h3>
//         {products.length === 0 ? (
//           <div className="bg-slate-800/40 rounded-2xl p-8 text-center border border-slate-700/40">
//             <Package size={32} className="mx-auto text-slate-500 mb-3" />
//             <p className="text-slate-400">No products in inventory.</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             {products.map(p => (
//               <div key={p._id || p.id} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-4 transition-colors flex flex-col">
//                 <div className="flex justify-between items-start mb-2">
//                   <div className="min-w-0 pr-2">
//                     <h4 className="text-white font-medium truncate">{p.name}</h4>
//                     <p className="text-blue-400 font-semibold text-sm">{formatCurrency(p.price)} <span className="text-slate-500 text-xs font-normal">/ unit</span></p>
//                   </div>
//                   <div className="flex bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shrink-0">
//                     <button onClick={() => { setForm({ ...p }); setProductModal({ isOpen: true, editData: p }); }} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors">
//                       <Edit size={14} />
//                     </button>
//                     <div className="w-px bg-slate-700"></div>
//                     <button onClick={() => handleDeleteProduct(p)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
//                       <Trash2 size={14} />
//                     </button>
//                   </div>
//                 </div>
                
//                 <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-700/50">
//                   <div className="flex items-center gap-2">
//                     <span className="text-slate-400 text-xs">Stock:</span>
//                     <span className={`font-mono text-sm font-bold ${p.quantity === 0 ? 'text-red-500' : p.quantity < 5 ? 'text-amber-500' : 'text-green-400'}`}>
//                       {p.quantity}
//                     </span>
//                     {p.quantity < 5 && p.quantity > 0 && <span className="text-[10px] uppercase bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">Low Stock</span>}
//                     {p.quantity === 0 && <span className="text-[10px] uppercase bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold">Out of Stock</span>}
//                   </div>
//                   <button
//                     onClick={() => { setForm({}); setSellModal({ isOpen: true, product: p }); }}
//                     disabled={p.quantity === 0}
//                     className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
//                   >
//                     <ShoppingCart size={14} /> Sell
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//       </>
//       )}

//       {/* Product Modal */}
//       {productModal.isOpen && (
//         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
//           <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5">
//             <h3 className="text-white font-bold text-lg mb-4">{productModal.editData ? 'Edit Product' : 'Add New Product'}</h3>
//             <form onSubmit={handleSaveProduct} className="space-y-3">
//               <div>
//                 <label className="text-slate-400 text-xs mb-1 block">Product Name</label>
//                 <input className={inputCls} value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Cement Bag" required />
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="text-slate-400 text-xs mb-1 block">Quantity</label>
//                   <input className={inputCls} type="number" min="0" value={form.quantity || ''} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="0" required />
//                 </div>
//                 <div>
//                   <label className="text-slate-400 text-xs mb-1 block">Price per Unit (₹)</label>
//                   <input className={inputCls} type="number" min="0" step="0.01" value={form.price || ''} onChange={e => setForm({...form, price: e.target.value})} placeholder="0.00" required />
//                 </div>
//               </div>
//               <div className="flex gap-2 pt-3">
//                 <button type="button" onClick={() => setProductModal({ isOpen: false, editData: null })} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
//                 <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Save</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Sell Modal */}
//       {sellModal.isOpen && (
//         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
//           <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5">
//             <h3 className="text-white font-bold text-lg mb-1">Sell Product</h3>
//             <p className="text-slate-400 text-sm mb-4">Stock available: <span className="text-white font-bold">{sellModal.product.quantity}</span></p>
//             <form onSubmit={handleSellProduct} className="space-y-3">
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="text-slate-400 text-xs mb-1 block">Quantity to Sell</label>
//                   <input className={inputCls} type="number" min="1" max={sellModal.product.quantity} value={form.quantitySold || ''} onChange={e => setForm({...form, quantitySold: e.target.value})} placeholder="0" required autoFocus />
//                 </div>
//                 <div>
//                   <label className="text-slate-400 text-xs mb-1 block">Date of Sale</label>
//                   <input className={inputCls} type="date" value={form.saleDate || ''} onChange={e => setForm({...form, saleDate: e.target.value})} />
//                 </div>
//               </div>
//               <div>
//                 <label className="text-slate-400 text-xs mb-1 block">Customer / Seller Name</label>
//                 <input className={inputCls} type="text" value={form.customerName || ''} onChange={e => setForm({...form, customerName: e.target.value})} placeholder="Name" required />
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="col-span-2">
//                   <label className="text-slate-400 text-xs mb-1 block">Phone Number</label>
//                   <input className={inputCls} type="text" value={form.customerPhone || ''} onChange={e => setForm({...form, customerPhone: e.target.value})} placeholder="Phone" />
//                 </div>
//                 <div className="col-span-2">
//                   <label className="text-slate-400 text-xs mb-1 block">Address</label>
//                   <textarea className={`${inputCls} resize-none h-16`} value={form.customerAddress || ''} onChange={e => setForm({...form, customerAddress: e.target.value})} placeholder="Address" />
//                 </div>
//               </div>
//               <div className="pt-2">
//                 <div className="flex justify-between items-center text-sm mb-3 bg-slate-900/50 p-3 rounded-xl">
//                   <span className="text-slate-400">Total Amount:</span>
//                   <span className="text-green-400 font-bold text-lg">
//                     {formatCurrency((Number(form.quantitySold) || 0) * sellModal.product.price)}
//                   </span>
//                 </div>
//               </div>
//               <div className="flex gap-2">
//                 <button type="button" onClick={() => setSellModal({ isOpen: false, product: null })} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
//                 <button type="submit" className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors">Confirm Sale</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Stock Overview Modal */}
//       {showStockModal && (
//         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowStockModal(false)}>
//           <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-white font-bold text-lg">Product Stocks Overview</h3>
//               <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-white transition-colors text-xs font-medium py-1 px-2 border border-slate-600 rounded bg-slate-700/50">Close</button>
//             </div>
            
//             <div className="max-h-96 overflow-y-auto pr-1 space-y-2 customized-scrollbar">
//               {products.length === 0 ? (
//                 <p className="text-slate-400 text-sm text-center py-4">No products available.</p>
//               ) : (
//                 products.map(p => (
//                   <div key={p._id || p.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
//                     <span className="text-white font-medium text-sm">{p.name}</span>
//                     <div className="flex flex-col items-end">
//                        <span className={`font-bold text-lg leading-tight ${p.quantity === 0 ? 'text-red-500' : p.quantity < 5 ? 'text-amber-500' : 'text-green-400'}`}>
//                          {p.quantity}
//                        </span>
//                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Available</span>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
