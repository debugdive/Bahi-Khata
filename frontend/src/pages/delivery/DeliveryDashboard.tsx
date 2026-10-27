import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosInstance';
import { MdCheckCircle, MdLocalShipping, MdPeople, MdLogout, MdAdd, MdCalculate, MdDownload, MdReceipt, MdSearch, MdCalendarToday, MdWarning, MdRoute, MdCheck } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DeliveryDashboard = () => {
  const [activeTab, setActiveTab] = useState('route'); // 'route', 'customers', 'billing'
  const [routeList, setRouteList] = useState([]);
  const [todayName, setTodayName] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Add Customer Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    service_name: '',
    unit_price: '',
    quantity_per_delivery: '1',
    frequency: 'Everyday',
    delivery_days: ALL_DAYS
  });

  const [addError, setAddError] = useState('');

  // Generated Bill Modal State
  const [calculatedBill, setCalculatedBill] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [routeRes, custRes] = await Promise.all([
        axios.get('/api/delivery/todays-route'),
        axios.get('/api/delivery/customers')
      ]);
      setRouteList(routeRes.data.data || []);
      setTodayName(routeRes.data.today || '');
      setCustomers(custRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch delivery dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDayToggle = (day) => {
    if (newCust.delivery_days.includes(day)) {
      if (newCust.delivery_days.length === 1) return; // keep at least 1 day
      setNewCust({ ...newCust, delivery_days: newCust.delivery_days.filter(d => d !== day) });
    } else {
      setNewCust({ ...newCust, delivery_days: [...newCust.delivery_days, day] });
    }
  };

  const handleMarkAttendance = async (subscription_id, status, quantity) => {
    try {
      await axios.post('/api/delivery/attendance', {
        subscription_id,
        date: new Date().toISOString().split('T')[0],
        status,
        quantity_delivered: quantity
      });
      fetchData();
    } catch (err) {
      alert('Failed to update delivery status');
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setAddError('');
    try {
      const payload = {
        ...newCust,
        delivery_days: newCust.delivery_days.join(',')
      };
      await axios.post('/api/delivery/customers', payload);
      setShowAddModal(false);
      setNewCust({ name: '', phone: '', service_name: '', unit_price: '', quantity_per_delivery: '1', frequency: 'Everyday', delivery_days: ALL_DAYS });
      fetchData();
      alert('Customer & Service Subscription added successfully!');
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add customer subscription');
    }
  };

  const handleCalculateBill = async (subscription_id) => {
    try {
      const res = await axios.post('/api/delivery/calculate-bill', { subscription_id });
      setCalculatedBill(res.data.data);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to calculate bill');
    }
  };

  const handleDownloadPDF = (billId) => {
    window.open(`/api/bills/${billId}/pdf`, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredCustomers = customers.filter(c => 
    c.customer_name?.toLowerCase().includes(search.toLowerCase()) || 
    c.customer_phone?.includes(search) ||
    c.service_name?.toLowerCase().includes(search.toLowerCase())
  );

  const completedTodayCount = routeList.filter(item => item.today_status === 'Delivered').length;
  const progressPercent = routeList.length > 0 ? Math.round((completedTodayCount / routeList.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 border-b border-slate-100 sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <MdLocalShipping size={22} />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-base leading-tight">{user?.name || 'Delivery Partner'}</h1>
            <p className="text-[11px] font-semibold text-indigo-600">{user?.role || 'Service Provider'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-1 text-xs text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl font-bold transition border border-rose-200"
        >
          <MdLogout size={16} />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Header Banner & Action Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Service Route Tracker</h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Manage weekly delivery schedules, track route completions, and issue monthly bills</p>
          </div>

          <button 
            onClick={() => { setAddError(''); setShowAddModal(true); }}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all hover-lift"
          >
            <MdAdd size={20} />
            <span>Add Service Customer</span>
          </button>
        </div>

        {/* Route Progress Overview Banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MdRoute size={26} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Schedule</div>
              <div className="text-xl font-black text-slate-900">{todayName || 'Today'} Route</div>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Route Completion Progress</span>
              <span className="text-indigo-600">{completedTodayCount} of {routeList.length} Completed ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm">
          <button 
            onClick={() => setActiveTab('route')} 
            className={`flex-1 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition ${activeTab === 'route' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Today's Route ({routeList.length})
          </button>
          <button 
            onClick={() => setActiveTab('customers')} 
            className={`flex-1 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition ${activeTab === 'customers' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Service Customers ({customers.length})
          </button>
          <button 
            onClick={() => setActiveTab('billing')} 
            className={`flex-1 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition ${activeTab === 'billing' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Monthly Billing Engine
          </button>
        </div>

        {/* TAB 1: TODAY'S ROUTE */}
        {activeTab === 'route' && (
          <div className="space-y-4">
            <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between text-xs text-indigo-900 font-bold">
              <span className="flex items-center space-x-1.5">
                <MdCalendarToday size={18} className="text-indigo-600" />
                <span>Delivery Schedule: Active for <strong>{todayName || 'Today'}</strong></span>
              </span>
              <span className="bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 text-indigo-700">
                {routeList.length} Deliveries
              </span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 font-medium">Loading today's delivery route...</div>
            ) : routeList.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-100 shadow-card">
                <MdCheckCircle size={40} className="mx-auto text-emerald-400 mb-2 opacity-60" />
                <p className="font-bold text-slate-700">No active delivery routes scheduled for {todayName}.</p>
                <p className="text-xs text-slate-400 mt-1">Subscriptions scheduled for other days are hidden automatically.</p>
              </div>
            ) : (
              routeList.map(item => (
                <div key={item.subscription_id} className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-lift transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-lg">{item.customer_name}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold border border-indigo-100">
                        Qty: {item.quantity_per_delivery}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-semibold">{item.product_name || item.service_name} • ₹{item.unit_price || 0}/unit</p>
                    <p className="text-xs text-slate-400 font-mono">Phone: {item.customer_phone}</p>
                    {item.delivery_days && (
                      <div className="flex items-center space-x-1 text-[11px] text-slate-500 pt-1">
                        <span className="font-bold text-slate-400">Schedule:</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">{item.delivery_days}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    {item.today_status === 'Delivered' ? (
                      <span className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl font-bold text-xs border border-emerald-200 shadow-xs">
                        <MdCheckCircle size={18} />
                        <span>Delivered</span>
                      </span>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleMarkAttendance(item.subscription_id, 'Delivered', item.quantity_per_delivery)}
                          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-200 transition"
                        >
                          Mark Delivered
                        </button>
                        <button 
                          onClick={() => handleMarkAttendance(item.subscription_id, 'Skipped', 0)}
                          className="flex-1 sm:flex-none border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs transition"
                        >
                          Skip Today
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: SERVICE CUSTOMERS DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-100 flex items-center max-w-md">
              <MdSearch className="text-slate-400 mr-2" size={20} />
              <input 
                type="text"
                placeholder="Search by customer name, phone, or service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full focus:outline-none text-sm font-medium bg-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCustomers.length === 0 ? (
                <div className="col-span-full bg-white p-10 text-center text-slate-400 rounded-2xl border">No customer subscriptions found.</div>
              ) : (
                filteredCustomers.map(c => (
                  <div key={c.subscription_id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card flex flex-col justify-between space-y-3 hover-lift transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{c.customer_name}</h3>
                        <p className="text-xs text-slate-500 font-mono">Phone: {c.customer_phone}</p>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {c.frequency}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs font-medium border border-slate-100">
                      <div className="flex justify-between"><span className="text-slate-500">Service:</span> <strong className="text-slate-800">{c.service_name || c.product_name}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500">Unit Rate:</span> <strong>₹{c.unit_price || 0}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500">Daily Quantity:</span> <strong>{c.quantity_per_delivery}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500">Scheduled Days:</span> <strong className="text-indigo-600">{c.delivery_days || 'Everyday'}</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Outstanding Balance</span>
                        <div className={`font-black text-sm ${c.outstanding_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ₹{c.outstanding_balance || 0}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCalculateBill(c.subscription_id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-1 shadow-xs"
                      >
                        <MdCalculate size={16} />
                        <span>Calculate Bill</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BILL CALCULATION SYSTEM */}
        {activeTab === 'billing' && (
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center text-sm">
              <span>Service Bill Calculation Engine</span>
              <span className="text-xs text-slate-400 font-normal">Auto-computed from logged attendance</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Customer</th>
                    <th className="py-3.5 px-6">Service</th>
                    <th className="py-3.5 px-6">Daily Qty</th>
                    <th className="py-3.5 px-6">Unit Price</th>
                    <th className="py-3.5 px-6">Outstanding Dues</th>
                    <th className="py-3.5 px-6 text-right">Calculate Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {customers.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-400 font-medium">No service subscriptions found.</td></tr>
                  ) : (
                    customers.map(c => (
                      <tr key={c.subscription_id} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {c.customer_name}
                          <div className="text-xs font-mono text-slate-400">{c.customer_phone}</div>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-800">{c.service_name || c.product_name}</td>
                        <td className="py-4 px-6 font-bold text-slate-700">{c.quantity_per_delivery}</td>
                        <td className="py-4 px-6 font-extrabold text-slate-900">₹{c.unit_price || 0}</td>
                        <td className="py-4 px-6 font-extrabold text-rose-600">₹{c.outstanding_balance || 0}</td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => handleCalculateBill(c.subscription_id)}
                            className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold transition shadow-xs"
                          >
                            <MdCalculate size={16} />
                            <span>Issue Monthly Bill</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Customer & Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-100 animate-scale-up">
            <h2 className="text-lg font-black text-slate-900">Add Service Customer & Subscription</h2>
            
            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-start space-x-2">
                <MdWarning size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Customer Phone Number (Registered)</label>
                <input 
                  type="text" required
                  value={newCust.phone}
                  onChange={e => setNewCust({ ...newCust, phone: e.target.value })}
                  placeholder="e.g. 5555555555"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Service / Product Name</label>
                <input 
                  type="text" required
                  value={newCust.service_name}
                  onChange={e => setNewCust({ ...newCust, service_name: e.target.value })}
                  placeholder="e.g. Cow Milk 1L or House Cleaning"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Unit Rate / Price (₹)</label>
                  <input 
                    type="number" step="0.01" required
                    value={newCust.unit_price}
                    onChange={e => setNewCust({ ...newCust, unit_price: e.target.value })}
                    placeholder="e.g. 60"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Daily Delivery Qty</label>
                  <input 
                    type="number" required
                    value={newCust.quantity_per_delivery}
                    onChange={e => setNewCust({ ...newCust, quantity_per_delivery: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Day of Week Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Select Delivery Days</label>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_DAYS.map(day => {
                    const isSelected = newCust.delivery_days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
                          isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Calculated Result Modal */}
      {calculatedBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-100 animate-scale-up">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <MdCheckCircle size={40} />
            </div>
            <h2 className="text-lg font-black text-slate-900">Monthly Bill Calculated!</h2>
            
            <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-1.5 border border-slate-100 font-medium">
              <div className="flex justify-between"><span className="text-slate-500">Invoice No:</span> <strong className="text-indigo-600 font-mono">{calculatedBill.invoice_no}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Customer:</span> <strong>{calculatedBill.customer_name}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Days Delivered:</span> <strong>{calculatedBill.days_delivered} Days</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Total Units:</span> <strong>{calculatedBill.total_qty} Units</strong></div>
              <div className="pt-2 border-t text-sm font-black flex justify-between text-slate-900">
                <span>Calculated Bill:</span>
                <span className="text-emerald-600">₹{calculatedBill.calculated_amount}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setCalculatedBill(null)} 
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button 
                onClick={() => handleDownloadPDF(calculatedBill.bill_id)} 
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center space-x-1 shadow-md shadow-indigo-200"
              >
                <MdDownload size={16} />
                <span>PDF Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;

