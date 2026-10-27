import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Login from './pages/Login';
import Register from './pages/Register';

import CustomerLayout from './layouts/CustomerLayout';
import CustomerHome from './pages/customer/Home';
import CustomerServices from './pages/customer/Services';
import CustomerPayments from './pages/customer/Payments';
import CustomerAccount from './pages/customer/Account';

import ShopLayout from './layouts/ShopLayout';
import POS from './pages/shop/POS';
import Inventory from './pages/shop/Inventory';
import ShopCustomers from './pages/shop/Customers';
import Reports from './pages/shop/Reports';

import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Loading Bahi Khata...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;

  return children;
};

const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  switch (user.role) {
    case 'Customer': return <Navigate to="/customer/home" />;
    case 'Retail Shop': return <Navigate to="/shop/pos" />;
    case 'Delivery Business': return <Navigate to="/delivery/dashboard" />;
    case 'Service Provider': return <Navigate to="/delivery/dashboard" />;
    case 'Admin': return <Navigate to="/admin/dashboard" />;
    default: return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
            
            {/* Customer Routes */}
            <Route path="/customer" element={<ProtectedRoute allowedRoles={['Customer']}><CustomerLayout /></ProtectedRoute>}>
              <Route path="home" element={<CustomerHome />} />
              <Route path="services" element={<CustomerServices />} />
              <Route path="payments" element={<CustomerPayments />} />
              <Route path="account" element={<CustomerAccount />} />
            </Route>
            
            {/* Shop Routes */}
            <Route path="/shop" element={<ProtectedRoute allowedRoles={['Retail Shop']}><ShopLayout /></ProtectedRoute>}>
              <Route path="pos" element={<POS />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="customers" element={<ShopCustomers />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* Delivery Routes */}
            <Route path="/delivery/dashboard" element={<ProtectedRoute allowedRoles={['Delivery Business', 'Service Provider']}><DeliveryDashboard /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center text-red-600 font-bold text-lg">403 - Unauthorized Access</div>} />
            <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-gray-500 font-bold text-lg">404 - Page Not Found</div>} />
          </Routes>
        </Router>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
