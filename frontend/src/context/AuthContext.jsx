import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('ikigai_user');
    const token = localStorage.getItem('ikigai_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Listen for changes in localStorage from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'ikigai_token') {
        if (!e.newValue) {
          setUser(null);
        } else {
          const storedUser = localStorage.getItem('ikigai_user');
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('ikigai_token', data.token);
        localStorage.setItem('ikigai_user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Server error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('ikigai_token');
    localStorage.removeItem('ikigai_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
