import React, { useEffect, useState } from 'react';
import axios from '../../utils/axiosInstance';
import { MdCalendarMonth, MdPauseCircle, MdAddCircle, MdCheckCircle, MdOutlineLocalShipping } from 'react-icons/md';

const CustomerServices = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get('/api/customer/subscriptions');
      setSubscriptions(res.data.data || []);
    } catch (err) {
      console.error('Error fetching subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handlePause = async (id) => {
    try {
      await axios.post(`/api/customer/subscriptions/${id}/pause`, {});
      alert('Subscription paused for 7 days');
      fetchSubscriptions();
    } catch (err) {
      alert('Failed to pause subscription');
    }
  };

  const handleRequestExtra = async (id) => {
    try {
      await axios.post(`/api/customer/subscriptions/${id}/extra`, { extra_quantity: 1 });
      alert('Extra +1 quantity requested for today!');
      fetchSubscriptions();
    } catch (err) {
      alert('Failed to request extra item');
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium">Loading subscriptions...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Active Subscriptions</h1>
        <p className="text-xs text-slate-500 font-medium">Daily order fulfillment, attendance tracking, and pause requests</p>
      </header>

      <div className="space-y-4">
        {subscriptions.map(sub => (
          <div key={sub.id} className="bg-white rounded-2xl shadow-card p-5 border border-slate-100 space-y-4 hover-lift transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">{sub.product_name || sub.service_name}</h3>
                <p className="text-xs font-bold text-indigo-600 mt-0.5">{sub.business_name}</p>
                <p className="text-xs text-slate-500 mt-1">Daily Unit Qty: <strong className="text-slate-800">{sub.quantity_per_delivery}</strong></p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  sub.status === 'Active' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {sub.status}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">{sub.frequency}</p>
              </div>
            </div>

            {/* Attendance Activity Row */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <h4 className="text-[11px] font-extrabold text-slate-500 mb-2.5 flex items-center">
                <MdCalendarMonth className="mr-1 text-indigo-600" size={16} /> Weekly Fulfillment History
              </h4>
              <div className="flex justify-between items-center px-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 font-bold mb-1.5">{day}</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                      i === 6 ? (sub.today_status === 'Delivered' ? 'bg-emerald-600 scale-110' : 'bg-slate-300') : 'bg-emerald-500'
                    }`}>
                      {i === 6 && sub.today_status === 'Delivered' ? '✓' : '✓'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 pt-1">
              <button 
                onClick={() => handleRequestExtra(sub.id)}
                className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center transition space-x-1.5 border border-indigo-100"
              >
                <MdAddCircle size={18}/>
                <span>+1 Extra Item</span>
              </button>
              <button 
                onClick={() => handlePause(sub.id)}
                className={`flex-1 ${
                  sub.status === 'Paused' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                } py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center transition space-x-1.5 border`}
              >
                <MdPauseCircle size={18}/>
                <span>{sub.status === 'Paused' ? 'Resume Service' : 'Pause 7 Days'}</span>
              </button>
            </div>
          </div>
        ))}

        {subscriptions.length === 0 && (
          <div className="text-center text-slate-400 py-12 bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
            <MdOutlineLocalShipping size={36} className="mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No active subscriptions</p>
            <p className="text-xs text-slate-400">Connected service providers (e.g. Milk, Cleaning) will display your daily schedule here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerServices;

