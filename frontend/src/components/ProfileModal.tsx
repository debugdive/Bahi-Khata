import React, { useState } from 'react';
import axios from '../utils/axiosInstance';
import { useAuth } from '../contexts/AuthContext';
import { MdClose, MdPerson, MdEmail, MdPhone } from 'react-icons/md';

export default function ProfileModal({ open, onClose }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await axios.put('/api/auth/profile', form);
      updateUser({ name: form.name, email: form.email, phone: form.phone });
      setSuccess(true);
      setTimeout(onClose, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', icon: <MdPerson size={18} />, type: 'text', required: true },
    { name: 'email', label: 'Email', icon: <MdEmail size={18} />, type: 'email', required: false },
    { name: 'phone', label: 'Phone', icon: <MdPhone size={18} />, type: 'tel', required: true },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex justify-center pt-6 pb-2">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-danger p-3 rounded-xl text-sm border border-red-100 dark:border-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 text-success p-3 rounded-xl text-sm border border-green-100 dark:border-green-800">
              Profile updated successfully!
            </div>
          )}

          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{f.label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{f.icon}</span>
                <input
                  name={f.name}
                  type={f.type}
                  value={form[f.name]}
                  onChange={handleChange}
                  required={f.required}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
