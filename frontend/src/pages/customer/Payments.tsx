import React, { useEffect, useState } from 'react';
import axios from '../../utils/axiosInstance';
import { MdReceiptLong, MdCheckCircle, MdPayment, MdHistory } from 'react-icons/md';

const CustomerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get('/api/customer/payments');
        setPayments(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch payment history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const handleDownloadReceipt = (billId) => {
    if (!billId) return alert('No invoice attached to this transaction receipt.');
    const base = import.meta.env.VITE_API_URL || '';
    window.open(`${base}/api/bills/${billId}/pdf`, '_blank');
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Payment Ledger & Receipts</h1>
          <p className="text-xs text-slate-500 font-medium">Completed transaction logs across your connected merchants</p>
        </div>
      </header>

      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading payment history...</div>
        ) : payments.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 space-y-2">
            <MdHistory size={36} className="mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No payment history recorded</p>
            <p className="text-xs text-slate-400">Transactions cleared via shop counters or Pay All will list here.</p>
          </div>
        ) : (
          payments.map(payment => (
            <div key={payment.id} className="bg-white p-4 sm:p-5 rounded-2xl shadow-card border border-slate-100 flex justify-between items-center hover-lift transition">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shrink-0">
                  <MdCheckCircle size={22} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{payment.business_name}</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {new Date(payment.created_at).toLocaleString()} • <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{payment.payment_method}</span>
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-black text-slate-900 text-base sm:text-lg">₹{payment.amount}</div>
                {payment.bill_id ? (
                  <button 
                    onClick={() => handleDownloadReceipt(payment.bill_id)}
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center justify-end mt-1 hover:underline ml-auto"
                  >
                    <MdReceiptLong className="mr-1"/> PDF Invoice
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {payment.status || 'Success'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerPayments;

