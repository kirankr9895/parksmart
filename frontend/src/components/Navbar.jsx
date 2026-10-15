import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import {
  Car,
  MapPin,
  Compass,
  QrCode,
  ShieldAlert,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Radio,
  CalendarCheck,
  Building2
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage, onOpenGateScanner }) {
  const { user, logout, switchDemoUser, openLoginModal } = useAuth();
  const { currentLocation, requestCurrentGpsLocation, isDetectingGps, isLiveGpsActive } = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Location Indicator */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActivePage('home')}
              className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
                <Car className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                  Park<span className="text-brand-600">Smart</span>
                </span>
                <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-brand-100 text-brand-700 rounded-md uppercase tracking-wider">
                  Live
                </span>
              </div>
            </button>

            {/* GPS Location Pill */}
            <button
              onClick={requestCurrentGpsLocation}
              disabled={isDetectingGps}
              title="Click to detect your current live GPS position"
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isLiveGpsActive
                  ? 'bg-sky-50 border-sky-200 text-sky-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {isDetectingGps ? (
                <Radio className="w-3.5 h-3.5 animate-spin text-sky-600" />
              ) : (
                <div className={`w-2 h-2 rounded-full ${isLiveGpsActive ? 'bg-sky-500 user-gps-pulse' : 'bg-emerald-500'}`} />
              )}
              <span className="max-w-[140px] truncate">
                {isDetectingGps ? 'Locating...' : currentLocation.locality || 'MG Road'}
              </span>
            </button>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActivePage('home')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activePage === 'home'
                  ? 'text-brand-700 bg-brand-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => setActivePage('search')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activePage === 'search'
                  ? 'text-brand-700 bg-brand-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              Find Parking
            </button>

            {user?.role === 'customer' && (
              <button
                onClick={() => setActivePage('customer_dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activePage === 'customer_dashboard'
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                My Bookings
              </button>
            )}

            {(user?.role === 'owner' || user?.role === 'admin') && (
              <button
                onClick={() => setActivePage('owner_dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activePage === 'owner_dashboard'
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Owner Portal
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                onClick={() => setActivePage('admin_dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activePage === 'admin_dashboard'
                    ? 'text-purple-700 bg-purple-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                Admin Console
              </button>
            )}
          </nav>

          {/* Right Action Bar: Quick Gate Scanner, Demo Persona Switcher & User Profile */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick Gate Scanner Button (Staff feature) */}
            <button
              onClick={onOpenGateScanner}
              title="Open QR Scanner Gate Verification"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
            >
              <QrCode className="w-4 h-4 text-brand-600" />
              <span className="hidden sm:inline">Gate Scanner</span>
            </button>

            {/* Quick Demo Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="capitalize">{user?.role || 'Role'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Switch Demo Persona (1-Click)
                  </div>
                  {Object.entries(DEMO_USERS).map(([key, demo]) => (
                    <button
                      key={key}
                      onClick={() => {
                        switchDemoUser(key);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        user?.role === demo.role ? 'font-bold text-brand-700 bg-brand-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{demo.label}</span>
                      {user?.role === demo.role && <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="font-bold text-slate-900 truncate">{user.name}</div>
                      <div className="text-slate-500 truncate">{user.email}</div>
                    </div>
                    {user.role === 'customer' && (
                      <button
                        onClick={() => {
                          setActivePage('customer_dashboard');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        My Bookings
                      </button>
                    )}
                    {(user.role === 'owner' || user.role === 'admin') && (
                      <button
                        onClick={() => {
                          setActivePage('owner_dashboard');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        Owner Dashboard
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          setActivePage('admin_dashboard');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                        Admin Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
              >
                Sign In
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
