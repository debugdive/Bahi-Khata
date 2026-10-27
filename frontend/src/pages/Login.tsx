import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { MdStorefront, MdLock, MdPhone, MdArrowForward } from 'react-icons/md';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(phone, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full glassmorphism bg-white/90 rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
            <MdStorefront size={30} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Bahi Khata</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Digital Ledger & Smart POS Ecosystem</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Phone Number</label>
            <div className="relative">
              <MdPhone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono transition"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9999999999"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <MdLock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input 
                type="password" 
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl text-white font-extrabold text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 hover-lift mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Account'}</span>
            <MdArrowForward size={18} />
          </button>
        </form>

        <div className="text-center text-xs pt-2 border-t border-slate-100">
          <p className="text-slate-500">
            Don't have a Bahi Khata account?{' '}
            <Link to="/register" className="text-indigo-600 font-extrabold hover:underline">
              Create New Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

