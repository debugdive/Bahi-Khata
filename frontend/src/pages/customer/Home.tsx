import React, { useEffect, useState } from 'react';
import axios from '../../utils/axiosInstance';
import { MdPayment, MdCheckCircle, MdStorefront, MdArrowForward, MdAccountBalance } from 'react-icons/md';

const CustomerHome = () => {
  const [data, setData] = useState({ totalOutstanding: 0, businesses: [] });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/customer/dashboard');
      setData(res.data.data || { totalOutstanding: 0, businesses: [] });
    } catch (err) {
      console.error('Error fetching dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePayAll = async () => {
    setPaying(true);
    try {
      await axios.post('/api/customer/pay-all');
      setPaidSuccess(true);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Overview & Ledger</h1>
          <p className="text-xs text-slate-500 font-medium">Monitor your credit dues across local vendors</p>
        </div>
      </header>

      {/* Hero Outstanding Summary Card */}
      <div className="bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-800 text-white p-6 rounded-3xl shadow-xl shadow-indigo-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 text-9xl font-black select-none pointer-events-none">₹</div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200 block mb-1">
              Total Udhar Balance Due
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight">
              ₹{data.totalOutstanding}
            </div>
          </div>

          {(data.totalOutstanding === 0 || paidSuccess) && (
            <div className="flex items-center space-x-1.5 bg-emerald-500/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md">
              <MdCheckCircle size={16} />
              <span>All Cleared</span>
            </div>
          )}
        </div>

        {data.totalOutstanding > 0 ? (
          <button 
            onClick={handlePayAll}
            disabled={paying}
            className="mt-6 bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-3 rounded-2xl font-black text-sm shadow-md transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 hover-lift"
          >
            <MdPayment size={20} />
            <span>{paying ? 'Processing Clearing...' : `Pay Total ₹${data.totalOutstanding}`}</span>
            <MdArrowForward size={18} />
          </button>
        ) : (
          <div className="mt-6 inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-4 py-2 rounded-2xl text-xs font-bold">
            <MdCheckCircle size={16} className="text-emerald-400" />
            <span>Ledger Healthy • No Pending Payments</span>
          </div>
        )}
      </div>

      {/* Connected Merchants Directory */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Connected Local Businesses</h3>
          <span className="text-xs font-bold text-slate-400">{data.businesses.length} Merchants</span>
        </div>

        <div className="space-y-3">
          {data.businesses.map(b => (
            <div key={b.customer_id} className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex justify-between items-center hover-lift transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-100 shrink-0">
                  {b.business_name ? b.business_name.charAt(0).toUpperCase() : <MdStorefront size={24} />}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base leading-snug">{b.business_name}</h4>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                    {b.business_type}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Udhar Dues</div>
                {b.outstanding_balance > 0 ? (
                  <div className="font-black text-rose-600 text-base sm:text-lg">₹{b.outstanding_balance}</div>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">
                    <MdCheckCircle size={14} />
                    <span>Paid</span>
                  </span>
                )}
              </div>
            </div>
          ))}
          {data.businesses.length === 0 && (
            <div className="text-center text-slate-400 py-12 bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
              <MdStorefront size={36} className="mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">No connected vendors yet</p>
              <p className="text-xs text-slate-400">Ask local shops to record your phone number when billing!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;

