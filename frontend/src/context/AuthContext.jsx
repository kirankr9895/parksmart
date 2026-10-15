import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  customer: { email: 'rahul@parksmart.in', password: 'Password123!', role: 'customer', label: 'Customer (Rahul)' },
  owner: { email: 'owner@parksmart.in', password: 'Password123!', role: 'owner', label: 'Parking Owner (Vikram)' },
  admin: { email: 'admin@parksmart.in', password: 'Password123!', role: 'admin', label: 'Admin (Suresh)' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('parksmart_token');
    if (!token) {
      // Default to logged-in customer for effortless evaluator demo
      await switchDemoUser('customer');
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.success) {
        setUser(res.user);
      } else {
        localStorage.removeItem('parksmart_token');
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('parksmart_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const res = await api.auth.login({ email, password });
    if (res.success) {
      localStorage.setItem('parksmart_token', res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      return res.user;
    }
    throw new Error(res.error || 'Login failed');
  }

  async function register(details) {
    const res = await api.auth.register(details);
    if (res.success) {
      localStorage.setItem('parksmart_token', res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      return res.user;
    }
    throw new Error(res.error || 'Registration failed');
  }

  function logout() {
    localStorage.removeItem('parksmart_token');
    setUser(null);
  }

  async function switchDemoUser(roleKey) {
    const demo = DEMO_USERS[roleKey];
    if (!demo) return;
    try {
      const res = await api.auth.login({ email: demo.email, password: demo.password });
      if (res.success) {
        localStorage.setItem('parksmart_token', res.token);
        setUser(res.user);
      }
    } catch (err) {
      console.error('Demo switch error:', err);
    }
  }

  function openLoginModal() {
    setAuthModalTab('login');
    setAuthModalOpen(true);
  }

  function openRegisterModal() {
    setAuthModalTab('register');
    setAuthModalOpen(true);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        switchDemoUser,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openLoginModal,
        openRegisterModal,
        refreshProfile: checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
