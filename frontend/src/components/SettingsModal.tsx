import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import {
  MdClose, MdDarkMode, MdLightMode, MdLanguage,
  MdNotifications, MdAdd, MdEdit, MdDelete, MdCheck, MdLocationOn,
} from 'react-icons/md';

// ── Tab selector ──────────────────────────────────────────────────────────────
const tabs = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'addresses', label: 'Addresses' },
];

const emptyAddr = { label: '', line1: '', city: '', pincode: '' };

export default function SettingsModal({ open, onClose, initialTab = 'appearance' }) {
  const { settings, setTheme, setLanguage, setNotification, addAddress, updateAddress, deleteAddress } = useSettings();
  const [activeTab, setActiveTab] = useState(initialTab);

  const [addrForm, setAddrForm] = useState(emptyAddr);
  const [editingId, setEditingId] = useState(null);
  const [showAddrForm, setShowAddrForm] = useState(false);

  if (!open) return null;

  // ── Address form helpers ───────────────────────────────────────────────────
  const handleAddrChange = (e) => setAddrForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleAddrSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateAddress(editingId, addrForm);
      setEditingId(null);
    } else {
      addAddress(addrForm);
    }
    setAddrForm(emptyAddr);
    setShowAddrForm(false);
  };

  const startEdit = (addr) => {
    setAddrForm({ label: addr.label, line1: addr.line1, city: addr.city, pincode: addr.pincode });
    setEditingId(addr.id);
    setShowAddrForm(true);
  };

  const cancelAddr = () => {
    setAddrForm(emptyAddr);
    setEditingId(null);
    setShowAddrForm(false);
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">App Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === t.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">

          {/* ── APPEARANCE ─────────────────────────────────────────── */}
          {activeTab === 'appearance' && (
            <>
              {/* Theme */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Theme</p>
                <div className="flex gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: <MdLightMode size={22} /> },
                    { value: 'dark', label: 'Dark', icon: <MdDarkMode size={22} /> },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        settings.theme === opt.value
                          ? 'border-primary bg-blue-50 dark:bg-blue-900/30 text-primary'
                          : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:border-primary/50'
                      }`}
                    >
                      {opt.icon}
                      <span className="text-sm font-semibold">{opt.label}</span>
                      {settings.theme === opt.value && <MdCheck size={14} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1">
                  <MdLanguage size={14} /> Language
                </p>
                <select
                  value={settings.language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>
            </>
          )}

          {/* ── NOTIFICATIONS ───────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1">
                <MdNotifications size={14} /> Notification Preferences
              </p>
              {[
                { key: 'payments', label: 'Payment Reminders', desc: 'Get notified about due payments' },
                { key: 'deliveries', label: 'Delivery Updates', desc: 'Track your delivery status' },
                { key: 'promotions', label: 'Promotions & Offers', desc: 'Deals from your businesses' },
              ].map(item => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotification(item.key, !settings.notifications[item.key])}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.notifications[item.key] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── ADDRESSES ───────────────────────────────────────────── */}
          {activeTab === 'addresses' && (
            <div className="space-y-3">
              {settings.addresses.length === 0 && !showAddrForm && (
                <div className="text-center text-gray-400 dark:text-gray-500 py-8 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                  <MdLocationOn size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No addresses saved yet</p>
                </div>
              )}

              {settings.addresses.map(addr => (
                <div key={addr.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex gap-3">
                    <MdLocationOn size={20} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white text-sm">{addr.label || 'Address'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{addr.line1}, {addr.city} {addr.pincode}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(addr)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition">
                      <MdEdit size={16} />
                    </button>
                    <button onClick={() => deleteAddress(addr.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-danger transition">
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {showAddrForm ? (
                <form onSubmit={handleAddrSubmit} className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{editingId ? 'Edit Address' : 'New Address'}</p>
                  {[
                    { name: 'label', placeholder: 'Label (e.g. Home, Office)', required: true },
                    { name: 'line1', placeholder: 'Street / Area', required: true },
                    { name: 'city', placeholder: 'City', required: true },
                    { name: 'pincode', placeholder: 'PIN Code' },
                  ].map(f => (
                    <input
                      key={f.name}
                      name={f.name}
                      value={addrForm[f.name]}
                      onChange={handleAddrChange}
                      placeholder={f.placeholder}
                      required={f.required}
                      className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ))}
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                      {editingId ? 'Update' : 'Save'}
                    </button>
                    <button type="button" onClick={cancelAddr} className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300 transition">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddrForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-primary/40 text-primary rounded-xl text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                >
                  <MdAdd size={18} /> Add Address
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
