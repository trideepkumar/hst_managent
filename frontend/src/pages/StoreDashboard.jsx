import { useState, useEffect } from 'react';
import { Package, TrendingUp, DollarSign, AlertCircle, Plus, Edit, Trash2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts, saveProduct, deleteProduct, getSales, saveSale } from '../utils/localStorage';
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

  useEffect(() => {
    setProducts(getProducts());
    setSales(getSales());
  }, []);

  const refreshData = () => {
    setProducts(getProducts());
    setSales(getSales());
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!form.name || !form.quantity || !form.price) {
      toast.error('Please fill all fields');
      return;
    }
    
    const newProduct = {
      id: productModal.editData ? productModal.editData.id : 'PRD-' + Date.now().toString().slice(-6),
      name: form.name,
      quantity: Number(form.quantity),
      price: Number(form.price),
    };

    saveProduct(newProduct);
    toast.success(productModal.editData ? 'Product updated' : 'Product added');
    setProductModal({ isOpen: false, editData: null });
    setForm({});
    refreshData();
  };

  const handleDeleteProduct = (p) => {
    openModal('Delete Product', `Are you sure you want to delete ${p.name}?`, () => {
      deleteProduct(p.id);
      refreshData();
      toast.success('Product deleted');
    });
  };

  const handleSellProduct = (e) => {
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

    const newSale = {
      id: 'SL-' + Date.now().toString().slice(-6),
      productId: sellModal.product.id,
      productName: sellModal.product.name,
      quantitySold: qtySold,
      priceAtSale: sellModal.product.price,
      totalAmount: qtySold * sellModal.product.price,
      date: form.saleDate || new Date().toISOString(),
      customerName: form.customerName || '',
      customerPhone: form.customerPhone || '',
      customerAddress: form.customerAddress || '',
    };

    const updatedProduct = {
      ...sellModal.product,
      quantity: sellModal.product.quantity - qtySold,
    };

    saveSale(newSale);
    saveProduct(updatedProduct);
    
    toast.success('Sale recorded successfully!');
    setSellModal({ isOpen: false, product: null });
    setForm({});
    refreshData();
  };

  // Calculations
  const totalProducts = products.length;
  const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);
  const remainingValue = products.reduce((acc, p) => acc + (p.quantity * p.price), 0);
  const totalSoldRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

  const StatCard = ({ title, value, icon: Icon, colorCls, onClick }) => (
    <div onClick={onClick} className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 ${onClick ? 'cursor-pointer hover:bg-slate-800 transition-colors ring-1 ring-transparent hover:ring-amber-500/30' : ''}`}>
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

  const inputCls = "w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors";

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Store Management</h2>
          <p className="text-slate-400 text-sm mt-0.5">Inventory & Sales Tracking</p>
        </div>
        <button
          onClick={() => { setForm({}); setProductModal({ isOpen: true, editData: null }); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} /> New Product
        </button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard title="Total Products" value={totalProducts} icon={Package} colorCls="text-blue-400" />
        <StatCard title="Stocks Available" value={totalStock} icon={AlertCircle} colorCls="text-amber-400" onClick={() => setShowStockModal(true)} />
        <StatCard title="Total Revenue" value={formatCurrency(totalSoldRevenue)} icon={TrendingUp} colorCls="text-green-400" />
        <StatCard title="Inventory Value" value={formatCurrency(remainingValue)} icon={DollarSign} colorCls="text-purple-400" />
      </div>

      {/* Products List */}
      <div>
        <h3 className="text-white font-semibold text-lg mb-3">Inventory</h3>
        {products.length === 0 ? (
          <div className="bg-slate-800/40 rounded-2xl p-8 text-center border border-slate-700/40">
            <Package size={32} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400">No products in inventory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {products.map(p => (
              <div key={p.id} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-4 transition-colors flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-white font-medium truncate">{p.name}</h4>
                    <p className="text-blue-400 font-semibold text-sm">{formatCurrency(p.price)} <span className="text-slate-500 text-xs font-normal">/ unit</span></p>
                  </div>
                  <div className="flex bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shrink-0">
                    <button onClick={() => { setForm({ ...p }); setProductModal({ isOpen: true, editData: p }); }} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors">
                      <Edit size={14} />
                    </button>
                    <div className="w-px bg-slate-700"></div>
                    <button onClick={() => handleDeleteProduct(p)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Stock:</span>
                    <span className={`font-mono text-sm font-bold ${p.quantity === 0 ? 'text-red-500' : p.quantity < 5 ? 'text-amber-500' : 'text-green-400'}`}>
                      {p.quantity}
                    </span>
                    {p.quantity < 5 && p.quantity > 0 && <span className="text-[10px] uppercase bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">Low Stock</span>}
                    {p.quantity === 0 && <span className="text-[10px] uppercase bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold">Out of Stock</span>}
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
        )}
      </div>

      {/* Product Modal */}
      {productModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5">
            <h3 className="text-white font-bold text-lg mb-4">{productModal.editData ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Product Name</label>
                <input className={inputCls} value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Cement Bag" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Quantity</label>
                  <input className={inputCls} type="number" min="0" value={form.quantity || ''} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="0" required />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Price per Unit (₹)</label>
                  <input className={inputCls} type="number" min="0" step="0.01" value={form.price || ''} onChange={e => setForm({...form, price: e.target.value})} placeholder="0.00" required />
                </div>
              </div>
              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => setProductModal({ isOpen: false, editData: null })} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Save</button>
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
            <p className="text-slate-400 text-sm mb-4">Stock available: <span className="text-white font-bold">{sellModal.product.quantity}</span></p>
            <form onSubmit={handleSellProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Quantity to Sell</label>
                  <input className={inputCls} type="number" min="1" max={sellModal.product.quantity} value={form.quantitySold || ''} onChange={e => setForm({...form, quantitySold: e.target.value})} placeholder="0" required autoFocus />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Date of Sale</label>
                  <input className={inputCls} type="date" value={form.saleDate || ''} onChange={e => setForm({...form, saleDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Customer / Seller Name</label>
                <input className={inputCls} type="text" value={form.customerName || ''} onChange={e => setForm({...form, customerName: e.target.value})} placeholder="Name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-400 text-xs mb-1 block">Phone Number</label>
                  <input className={inputCls} type="text" value={form.customerPhone || ''} onChange={e => setForm({...form, customerPhone: e.target.value})} placeholder="Phone" />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-400 text-xs mb-1 block">Address</label>
                  <textarea className={`${inputCls} resize-none h-16`} value={form.customerAddress || ''} onChange={e => setForm({...form, customerAddress: e.target.value})} placeholder="Address" />
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
                <button type="button" onClick={() => setSellModal({ isOpen: false, product: null })} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors">Confirm Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Overview Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowStockModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Product Stocks Overview</h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-white transition-colors text-xs font-medium py-1 px-2 border border-slate-600 rounded bg-slate-700/50">Close</button>
            </div>
            
            <div className="max-h-96 overflow-y-auto pr-1 space-y-2 customized-scrollbar">
              {products.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No products available.</p>
              ) : (
                products.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-white font-medium text-sm">{p.name}</span>
                    <div className="flex flex-col items-end">
                       <span className={`font-bold text-lg leading-tight ${p.quantity === 0 ? 'text-red-500' : p.quantity < 5 ? 'text-amber-500' : 'text-green-400'}`}>
                         {p.quantity}
                       </span>
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
