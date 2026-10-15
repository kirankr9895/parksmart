import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { X, Lock, Mail, User, Phone, Sparkles, ShieldCheck } from 'lucide-react';

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, authModalTab, setAuthModalTab, login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!authModalOpen) return null;

  function autofillDemo(key) {
    const demo = DEMO_USERS[key];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
      setError('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (authModalTab === 'login') {
        await login(email, password);
      } else {
        await register({ name, email, password, phone, role });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 pt-5 pb-3">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setAuthModalTab('login');
                setError('');
              }}
              className={`text-sm font-bold pb-2 transition-all border-b-2 ${
                authModalTab === 'login'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthModalTab('register');
                setError('');
              }}
              className={`text-sm font-bold pb-2 transition-all border-b-2 ${
                authModalTab === 'register'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Demo Fillers */}
        {authModalTab === 'login' && (
          <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Demo:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => autofillDemo('customer')}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('owner')}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('admin')}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {error}
            </div>
          )}

          {authModalTab === 'register' && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Account Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                >
                  <option value="customer">Customer (Book parking slots)</option>
                  <option value="owner">Parking Facility Owner</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-md shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>{authModalTab === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-400">
            Protected with role-based JWT authentication and bcrypt password encryption.
          </p>

        </form>

      </div>
    </div>
  );
}
