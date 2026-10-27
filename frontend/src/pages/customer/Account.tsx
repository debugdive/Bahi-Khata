import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
  MdLogout, MdPersonOutline, MdLocationOn, MdNotificationsNone, MdSettings,
  MdChevronRight, MdDarkMode, MdLightMode, MdShield,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../../components/SettingsModal';
import ProfileModal from '../../components/ProfileModal';

const CustomerAccount = () => {
  const { user, logout } = useAuth();
  const { settings, setTheme } = useSettings();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [settingsTab, setSettingsTab] = useState('appearance');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openSettings = (tab = 'appearance') => {
    setSettingsTab(tab);
    setShowSettings(true);
  };

  const menuItems = [
    {
      icon: <MdPersonOutline size={22} />,
      title: 'Profile Details',
      desc: 'Update your name, email & phone number',
      action: () => setShowProfile(true),
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      icon: <MdLocationOn size={22} />,
      title: 'Saved Addresses',
      desc: `${settings.addresses.length} delivery address${settings.addresses.length !== 1 ? 'es' : ''} saved`,
      action: () => openSettings('addresses'),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: <MdNotificationsNone size={22} />,
      title: 'Notification Preferences',
      desc: 'Configure payment & service delivery reminders',
      action: () => openSettings('notifications'),
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      icon: <MdSettings size={22} />,
      title: 'App System Settings',
      desc: `Theme: ${settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'} · Lang: ${settings.language.toUpperCase()}`,
      action: () => openSettings('appearance'),
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <header className="bg-white p-6 rounded-3xl shadow-card border border-slate-100 flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md shadow-indigo-200 shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 leading-tight">{user?.name || 'Customer Profile'}</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.phone}</p>
          <div className="mt-1">
            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full font-bold border border-indigo-100">
              {user?.role || 'Customer'}
            </span>
          </div>
        </div>
      </header>

      {/* Quick Theme Toggle */}
      <div className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl shadow-card border border-slate-100">
        <div className="flex items-center space-x-2.5">
          {settings.theme === 'dark' ? <MdDarkMode className="text-indigo-600" size={20} /> : <MdLightMode className="text-amber-500" size={20} />}
          <span className="text-xs font-extrabold text-slate-800">Interface Theme</span>
        </div>
        <button
          onClick={() => setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
          className={`relative w-12 h-6 rounded-full transition-colors ${settings.theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform flex items-center justify-center ${settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}>
            {settings.theme === 'dark' ? <MdDarkMode size={10} className="text-indigo-600" /> : <MdLightMode size={10} className="text-amber-500" />}
          </span>
        </button>
      </div>

      {/* Menu Items */}
      <div className="space-y-2.5">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className="w-full flex items-center p-4 bg-white rounded-2xl shadow-card cursor-pointer hover-lift transition border border-slate-100 text-left group"
          >
            <div className={`${item.bg} ${item.color} p-3 rounded-xl mr-4 shadow-xs`}>{item.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition">{item.title}</h3>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            <MdChevronRight size={20} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full mt-4 flex items-center justify-center p-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm hover:bg-rose-100 transition border border-rose-100 shadow-xs"
      >
        <MdLogout className="mr-2" size={18} /> Sign Out Account
      </button>

      {/* Modals */}
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} initialTab={settingsTab} />
      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
};

export default CustomerAccount;


