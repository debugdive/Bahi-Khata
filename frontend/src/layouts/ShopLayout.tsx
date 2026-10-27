import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { MdPointOfSale, MdInventory, MdPeople, MdInsertChart, MdMenu, MdClose, MdLogout, MdStorefront, MdNotificationsNone } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';

const ShopLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const path = location.pathname;
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'POS Billing', path: '/shop/pos', icon: <MdPointOfSale size={20} /> },
    { name: 'Inventory Management', path: '/shop/inventory', icon: <MdInventory size={20} /> },
    { name: 'Customer Udhar', path: '/shop/customers', icon: <MdPeople size={20} /> },
    { name: 'Sales & Analytics', path: '/shop/reports', icon: <MdInsertChart size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeNav = navItems.find(item => path.includes(item.path)) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white w-64 shadow-xl z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 border-r border-slate-100 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <MdStorefront size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 tracking-tight text-lg leading-tight">Bahi Khata</h2>
              <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Shop Partner</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 p-1">
            <MdClose size={22} />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1 justify-between">
          <nav className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Main Navigation</div>
            {navItems.map(item => {
              const isActive = path.includes(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-200 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Footer Card */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Retail Merchant'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'shop@bahikhata.com'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-rose-600 bg-rose-50/80 hover:bg-rose-100 rounded-xl transition-colors font-bold text-xs"
            >
              <MdLogout size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-4 lg:px-8 border-b border-slate-100 shrink-0 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100">
              <MdMenu size={24} />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight">{activeNav.name}</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Store Online • Ready to Bill
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition cursor-pointer">
              <MdNotificationsNone size={20} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 bg-slate-50/60">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ShopLayout;

