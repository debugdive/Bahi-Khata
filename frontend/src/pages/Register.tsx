import React, { useState } from 'react';
import axios from '../utils/axiosInstance';
import { useNavigate, Link } from 'react-router-dom';
import { MdStorefront, MdPerson, MdPhone, MdLock, MdEmail, MdBusiness, MdArrowForward } from 'react-icons/md';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    roleName: 'Customer',
    businessName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const needsBusinessName = ['Retail Shop', 'Delivery Business', 'Service Provider'].includes(formData.roleName);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full glassmorphism bg-white/90 rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
            <MdStorefront size={30} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Join Bahi Khata POS & Local Ledger Platform</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
            <div className="relative">
              <MdPerson className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input 
                name="name" 
                required 
                onChange={handleChange} 
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
            <div className="relative">
              <MdPhone className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input 
                name="phone" 
                required 
                onChange={handleChange} 
                placeholder="e.g. 9876543210"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono transition" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">Email (Optional)</label>
            <div className="relative">
              <MdEmail className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input 
                name="email" 
                type="email" 
                onChange={handleChange} 
                placeholder="e.g. rahul@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <MdLock className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input 
                name="password" 
                type="password" 
                required 
                onChange={handleChange} 
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm transition" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">Account Role</label>
            <select 
              name="roleName" 
              onChange={handleChange} 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-800 cursor-pointer"
            >
              <option value="Customer">👤 Customer (Consumer)</option>
              <option value="Retail Shop">🏪 Retail Shop Merchant</option>
              <option value="Delivery Business">🚚 Delivery Business</option>
              <option value="Service Provider">🛠️ Daily Service Provider</option>
            </select>
          </div>

          {needsBusinessName && (
            <div>
              <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">Business Name</label>
              <div className="relative">
                <MdBusiness className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input 
                  name="businessName" 
                  required 
                  onChange={handleChange} 
                  placeholder="e.g. Sharma Grocery Store"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold transition" 
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl text-white font-extrabold text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 hover-lift mt-2"
          >
            <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
            <MdArrowForward size={18} />
          </button>
        </form>

        <div className="text-center text-xs pt-2 border-t border-slate-100">
          <p className="text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-extrabold hover:underline">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

