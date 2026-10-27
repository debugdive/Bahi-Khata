import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosInstance';
import { MdAdd, MdSearch, MdWarning, MdCheckCircle, MdInventory, MdCategory, MdErrorOutline } from 'react-icons/md';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', barcode: '', category_name: '' });

  const fetchInventory = async () => {
    try {
      const res = await axios.get('/api/shop/products');
      setProducts(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/shop/products', formData);
      setShowModal(false);
      setFormData({ name: '', price: '', stock: '', barcode: '', category_name: '' });
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add product');
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category_name || 'General'))];

  const filtered = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(search));
    const matchesCategory = selectedCategory === 'All' || (p.category_name || 'General') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Summary Metrics
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const lowStockCount = products.filter(p => p.stock <= 10 && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory & Catalog</h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Track stock health, unit prices, and add new inventory products</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all hover-lift"
        >
          <MdAdd size={20} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* KPI Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <MdInventory size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Products</div>
            <div className="text-2xl font-black text-slate-900">{totalProducts}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <MdCheckCircle size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Stock Units</div>
            <div className="text-2xl font-black text-slate-900">{totalStockUnits}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <MdWarning size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Low Stock Alerts</div>
            <div className="text-2xl font-black text-amber-600">{lowStockCount}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <MdErrorOutline size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Out of Stock</div>
            <div className="text-2xl font-black text-rose-600">{outOfStockCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Container */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <MdSearch className="absolute left-3.5 top-3 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search by product name or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm transition"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500">
          <span>Catalog List</span>
          <span>Showing {filtered.length} Items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-6">Product Details</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Barcode</th>
                <th className="py-3.5 px-6">Price</th>
                <th className="py-3.5 px-6">Stock Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400 font-medium">Loading inventory data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400 font-medium">No products match your search.</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: #{item.id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold">
                        {item.category_name || 'General'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{item.barcode || '—'}</td>
                    <td className="py-4 px-6 font-extrabold text-indigo-600 text-base">₹{item.price}</td>
                    <td className="py-4 px-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          {item.stock <= 0 ? (
                            <span className="inline-flex items-center space-x-1 text-rose-600 font-bold">
                              <MdErrorOutline size={14} />
                              <span>Out of Stock</span>
                            </span>
                          ) : item.stock <= 10 ? (
                            <span className="inline-flex items-center space-x-1 text-amber-700 font-bold">
                              <MdWarning size={14} />
                              <span>Low Stock ({item.stock})</span>
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">
                              In Stock ({item.stock})
                            </span>
                          )}
                        </div>
                        {/* Visual stock health meter bar */}
                        <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              item.stock <= 0 ? 'bg-rose-500 w-0' : item.stock <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} 
                            style={{ width: `${Math.min(100, (item.stock / 50) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-scale-up">
            <h2 className="text-lg font-black text-slate-900">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Product Name</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Amul Milk 500ml"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Price (₹)</label>
                  <input 
                    type="number" step="0.01" required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="30.00"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Initial Stock</label>
                  <input 
                    type="number" required
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Category (Optional)</label>
                <input 
                  type="text"
                  value={formData.category_name}
                  onChange={e => setFormData({ ...formData, category_name: e.target.value })}
                  placeholder="e.g. Dairy or Snacks"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Barcode (Optional)</label>
                <input 
                  type="text"
                  value={formData.barcode}
                  onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="e.g. 890123456789"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

