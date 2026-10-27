import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosInstance';
import { MdSearch, MdPhone, MdPerson, MdAdd, MdEmail, MdPeople, MdAccountBalanceWallet, MdWarning, MdCheckCircle } from 'react-icons/md';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/shop/customers');
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/shop/customers', formData);
      setShowModal(false);
      setFormData({ name: '', phone: '', email: '' });
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add customer');
    }
  };

  const filtered = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search) ||
    String(c.id).includes(search)
  );

  const totalUdhar = customers.reduce((acc, c) => acc + (Number(c.outstanding_balance) || 0), 0);
  const activeUdharCount = customers.filter(c => Number(c.outstanding_balance) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Udhar & Directory</h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Manage customer profiles, credit ledger balances, and onboard new clients</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all hover-lift"
        >
          <MdAdd size={20} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Top Financial KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <MdPeople size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Customers</div>
            <div className="text-2xl font-black text-slate-900">{customers.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <MdAccountBalanceWallet size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Outstanding Udhar</div>
            <div className="text-2xl font-black text-rose-600">₹{totalUdhar.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <MdWarning size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Accounts with Dues</div>
            <div className="text-2xl font-black text-amber-600">{activeUdharCount}</div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-100 flex items-center max-w-md">
        <MdSearch className="text-slate-400 mr-2" size={20} />
        <input 
          type="text"
          placeholder="Search by Customer ID, name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full focus:outline-none text-sm font-medium bg-transparent"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 font-medium">Loading customer directory...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 font-medium">No customer profiles found.</div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex flex-col justify-between hover-lift transition space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-100">
                    {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                      <MdPhone size={14} className="text-slate-400" /> {c.phone}
                    </p>
                    {c.email && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MdEmail size={12} /> {c.email}
                      </p>
                    )}
                  </div>
                </div>
                <span className="bg-indigo-50 text-indigo-600 text-xs font-extrabold px-2.5 py-1 rounded-full border border-indigo-100">
                  #{c.id}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Udhar Balance</span>
                  <span className={`text-lg font-black ${c.outstanding_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{c.outstanding_balance || 0}
                  </span>
                </div>
                {c.outstanding_balance > 0 ? (
                  <span className="inline-flex items-center space-x-1 text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold">
                    <MdWarning size={14} />
                    <span>Dues Pending</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                    <MdCheckCircle size={14} />
                    <span>No Dues</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-scale-up">
            <h2 className="text-lg font-black text-slate-900">Add New Customer Profile</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
                <input 
                  type="text" required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Email (Optional)</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. customer@gmail.com"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

