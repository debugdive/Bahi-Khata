import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { MdHome, MdOutlineMiscellaneousServices, MdPayment, MdPerson, MdNotificationsNone } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';

const CustomerLayout = () => {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/customer/home', icon: <MdHome size={22} /> },
    { name: 'Subscriptions', path: '/customer/services', icon: <MdOutlineMiscellaneousServices size={22} /> },
    { name: 'Payments', path: '/customer/payments', icon: <MdPayment size={22} /> },
    { name: 'Profile', path: '/customer/account', icon: <MdPerson size={22} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh pb-24 font-sans text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200 text-base">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Welcome back</p>
            <h2 className="text-sm font-extrabold text-slate-900 leading-tight">{user?.name || 'Valued Customer'}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer">
            <MdNotificationsNone size={20} />
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl p-1.5 flex justify-around items-center z-40">
        {navItems.map((item) => {
          const isActive = path.includes(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-bold scale-105' 
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-1 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default CustomerLayout;

