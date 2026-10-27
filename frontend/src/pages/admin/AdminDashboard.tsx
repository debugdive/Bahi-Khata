import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosInstance';
import { MdSupervisorAccount, MdStorefront, MdLocalShipping, MdAttachMoney, MdLogout, MdCheckCircle, MdBlock, MdSearch, MdPieChart, MdTrendingUp, MdShield } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ROLE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total_users: 0, total_shops: 0, total_deliveries: 0, total_volume: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users')
      ]);
      setStats(statsRes.data.data || {});
      setUsers(usersRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch admin dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (userId) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/status`);
      fetchData();
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roles = ['All', ...new Set(users.map(u => u.roleName))];

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || 
                          u.phone?.includes(search) || 
                          u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.roleName === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate role breakdown for pie chart
  const roleDistribution = users.reduce((acc, u) => {
    const role = u.roleName || 'Customer';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const roleChartData = Object.keys(roleDistribution).map(role => ({
    name: role,
    value: roleDistribution[role]
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Super Admin Top Header */}
      <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 border-b border-slate-800 shadow-md sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
            <MdShield size={22} />
          </div>
          <div>
            <h1 className="font-black text-slate-100 text-base leading-tight tracking-tight">Super Admin Control Room</h1>
            <p className="text-[11px] text-purple-400 font-mono">{user?.email || 'admin@bahikhata.com'}</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-600/20 px-3 py-2 rounded-xl font-bold transition border border-rose-500/30"
        >
          <MdLogout size={16} />
          <span>Exit Admin</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Platform Control Center</h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Monitor ecosystem stats, user roles, and enforce security policies</p>
        </div>

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <MdSupervisorAccount size={26} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Ecosystem Users</div>
              <div className="text-2xl font-black text-slate-900">{stats.total_users || 0}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MdStorefront size={26} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Retail Shops</div>
              <div className="text-2xl font-black text-slate-900">{stats.total_shops || 0}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <MdLocalShipping size={26} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Delivery & Service Partners</div>
              <div className="text-2xl font-black text-slate-900">{stats.total_deliveries || 0}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MdAttachMoney size={26} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Platform Transaction Volume</div>
              <div className="text-2xl font-black text-emerald-600">₹{stats.total_volume || 0}</div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 space-y-3 flex flex-col justify-between">
            <div className="flex items-center space-x-2">
              <MdPieChart className="text-purple-600" size={20} />
              <h3 className="font-extrabold text-slate-800 text-sm">User Role Breakdown</h3>
            </div>
            
            <div className="h-56 w-full flex items-center justify-center">
              {roleChartData.length === 0 ? (
                <div className="text-xs text-slate-400">No user data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {roleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl font-black select-none pointer-events-none">
              AGY
            </div>
            
            <div className="space-y-2">
              <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                System Security & Status
              </span>
              <h3 className="text-xl font-black text-white">Platform Health & Access Auditing</h3>
              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                Super Admins can toggle individual user account access flags in real-time. Deactivating an account revokes authorization tokens instantly across API endpoints.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Active Accounts</span>
                <span className="text-emerald-400 font-extrabold text-lg">{users.filter(u => u.is_active).length} Users</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Suspended Accounts</span>
                <span className="text-rose-400 font-extrabold text-lg">{users.filter(u => !u.is_active).length} Users</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total Onboarded</span>
                <span className="text-indigo-300 font-extrabold text-lg">{users.length} Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Directory Controls & Table */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <MdSearch className="absolute left-3.5 top-3 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Search user by name, phone or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role:</span>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-slate-200 rounded-xl py-2 px-3 text-xs bg-white font-bold text-slate-700 focus:ring-2 focus:ring-purple-500"
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-6">User Profile</th>
                  <th className="py-3.5 px-6">Phone</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Access Status</th>
                  <th className="py-3.5 px-6 text-right">Security Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10 text-slate-400 font-medium">Loading user records...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-slate-400 font-medium">No registered users matching search.</td></tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {u.name}
                        <div className="text-[10px] text-slate-400 font-mono">User ID: #{u.id}</div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-600">{u.phone}</td>
                      <td className="py-4 px-6 text-slate-500 text-xs">{u.email || '—'}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                          {u.roleName}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {u.is_active ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            <MdCheckCircle size={14} />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            <MdBlock size={14} />
                            <span>Blocked</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition shadow-xs ${
                            u.is_active 
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' 
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.is_active ? 'Block Access' : 'Activate User'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

