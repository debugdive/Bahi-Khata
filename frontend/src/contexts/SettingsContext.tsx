import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface Address {
  id: number;
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
  [key: string]: any;
}

export interface NotificationsConfig {
  payments: boolean;
  deliveries: boolean;
  promotions: boolean;
  [key: string]: boolean;
}

export interface SettingsState {
  theme: string;
  language: string;
  addresses: Address[];
  notifications: NotificationsConfig;
}

export interface SettingsContextType {
  settings: SettingsState;
  setTheme: (theme: string) => void;
  setLanguage: (lang: string) => void;
  setNotification: (key: string, value: boolean) => void;
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: number, updates: Partial<Address>) => void;
  deleteAddress: (id: number) => void;
}

const defaultSettings: SettingsState = {
  theme: 'light',
  language: 'en',
  addresses: [],
  notifications: {
    payments: true,
    deliveries: true,
    promotions: false,
  },
};

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const stored = localStorage.getItem('bk_settings');
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Apply theme class to <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('bk_settings', JSON.stringify(settings));
  }, [settings]);

  const setTheme = (theme: string) => setSettings(prev => ({ ...prev, theme }));
  const setLanguage = (language: string) => setSettings(prev => ({ ...prev, language }));

  const setNotification = (key: string, value: boolean) =>
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));

  const addAddress = (address: Omit<Address, 'id'>) =>
    setSettings(prev => ({
      ...prev,
      addresses: [...prev.addresses, { ...address, id: Date.now() }],
    }));

  const updateAddress = (id: number, updates: Partial<Address>) =>
    setSettings(prev => ({
      ...prev,
      addresses: prev.addresses.map(a => (a.id === id ? { ...a, ...updates } : a)),
    }));

  const deleteAddress = (id: number) =>
    setSettings(prev => ({
      ...prev,
      addresses: prev.addresses.filter(a => a.id !== id),
    }));

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setTheme,
        setLanguage,
        setNotification,
        addAddress,
        updateAddress,
        deleteAddress,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
