import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';

export interface User {
  id: string | number;
  role: string;
  name: string;
  email: string;
  phone: string;
  profile_pic?: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<{ exp: number }>(token);
        // Check token not expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setLoading(false);
          return;
        }
        // token is picked up automatically by the axiosInstance interceptor
        // Fetch full profile so name/email/phone are available after refresh
        axios.get('/api/auth/me')
          .then(res => {
            const d = res.data.data;
            setUser({ id: d.id, role: d.roleName, name: d.name, email: d.email, phone: d.phone, profile_pic: d.profile_pic });
          })
          .catch(() => {
            localStorage.removeItem('token');
            // token removed from localStorage; interceptor will no longer attach it
          })
          .finally(() => setLoading(false));
      } catch (err) {
        localStorage.removeItem('token');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phone: string, password: string): Promise<User> => {
    const res = await axios.post('/api/auth/login', { phone, password });
    const { token, data } = res.data;
    localStorage.setItem('token', token);
    // token stored in localStorage; interceptor picks it up on next request
    const loggedUser: User = { id: data.id, role: data.role, name: data.name, email: data.email, phone: data.phone, profile_pic: data.profile_pic };
    setUser(loggedUser);
    return loggedUser;
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updates } : null));
  };

  const logout = () => {
    localStorage.removeItem('token');
    // token removed from localStorage; interceptor will no longer attach it
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
