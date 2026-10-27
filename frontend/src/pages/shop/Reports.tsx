import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosInstance';
import { MdReceipt, MdAttachMoney, MdShowChart, MdDownload, MdPieChart, MdTrendingUp } from 'react-icons/md';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const Reports = () => {
  const [stats, setStats] = useState({ todaysRevenue: 0, pendingUdhar: 0, lowStockCount: 0 });
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [dashRes, billsRes] = await Promise.all([
          axios.get('/api/shop/dashboard'),
          axios.get('/api/bills')
        ]);
        setStats(dashRes.data.data || {});
        setBills(billsRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleDownloadPDF = (billId) => {
    window.open(`/api/bills/${billId}/pdf`, '_blank');
  };

  // Group bills by payment method for pie chart
  const paymentDataMap = bills.reduce((acc, b) => {
    const method = b.payment_method || 'Cash';
    acc[method] = (acc[method] || 0) + (Number(b.net_amount || b.total_amount) || 0);
    return acc;
  }, {});

  const pieChartData = Object.keys(paymentDataMap).map(method => ({
    name: method,
    value: paymentDataMap[method]
  }));

  // Generate sales by invoice index / recent bills for bar chart
  const barChartData = bills.slice(0, 10).reverse().map((b, i) => ({
    name: b.invoice_no || `Bill #${i+1}`,
    Amount: Number(b.net_amount || b.total_amount) || 0
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Reports & Sales History</h1>
        <p className="text-slate-500 text-xs sm:text-sm font-medium">Track sales analytics, invoice revenue trends, and download past bills</p>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <MdAttachMoney size={26} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today's Revenue</div>
            <div className="text-2xl font-black text-slate-900">₹{stats.todaysRevenue || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <MdReceipt size={26} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invoices</div>
            <div className="text-2xl font-black text-slate-900">{bills.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <MdShowChart size={26} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Udhar</div>
            <div className="text-2xl font-black text-rose-600">₹{stats.pendingUdhar || 0}</div>
          </div>
        </div>
      </div>

      {/* Recharts Sales Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-card border border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MdTrendingUp className="text-indigo-600" size={20} />
              <h2 className="font-extrabold text-slate-800 text-sm">Recent Invoices Volume</h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Last 10 Invoices</span>
          </div>

          <div className="h-64 w-full pt-2">
            {barChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No bill data available for chart</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }} 
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Bar dataKey="Amount" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Method Breakdown Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 space-y-4 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <MdPieChart className="text-indigo-600" size={20} />
            <h2 className="font-extrabold text-slate-800 text-sm">Payment Methods Breakdown</h2>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <div className="text-xs text-slate-400">No transaction data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Invoice History Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50/60 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center text-sm">
          <span>Recent Sales Invoices</span>
          <span className="text-xs text-slate-400 font-normal">Total {bills.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-6">Invoice No</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Payment Method</th>
                <th className="py-3.5 px-6">Net Amount</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6 text-right">PDF Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 font-medium">Loading sales history...</td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 font-medium">No sales bills generated yet.</td></tr>
              ) : (
                bills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600">{b.invoice_no}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {b.customer_name || 'Walk-in Customer'} {b.customer_id ? `(#${b.customer_id})` : ''}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        b.payment_method === 'Udhar' 
                          ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {b.payment_method}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-900">₹{b.net_amount || b.total_amount}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleDownloadPDF(b.id)}
                        className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg transition font-bold shadow-xs"
                      >
                        <MdDownload size={15} />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;

