import React from 'react';
import { Car, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Park<span className="text-brand-400">Smart</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart Parking Reservation & Management System. Real-time slot availability, advance locking, GPS navigation, and automated QR gate check-ins.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Production-Grade BCA Software Project</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 tracking-wider uppercase text-[11px]">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActivePage('search')}
                  className="hover:text-brand-400 transition-colors"
                >
                  Nearby Parking Search
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('home')}
                  className="hover:text-brand-400 transition-colors"
                >
                  How ParkSmart Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('customer_dashboard')}
                  className="hover:text-brand-400 transition-colors"
                >
                  My Active Reservations
                </button>
              </li>
            </ul>
          </div>

          {/* Supported Bengaluru Hotspots */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 tracking-wider uppercase text-[11px]">
              Top Locations
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Phoenix Marketcity, Whitefield</li>
              <li>Forum South Bengaluru, Konanakunte</li>
              <li>Garuda Mall, MG Road / Brigade Rd</li>
              <li>Indiranagar 100ft Road Metro Hub</li>
              <li>Electronic City IT Corridor</li>
            </ul>
          </div>

          {/* Tech Stack Specs */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 tracking-wider uppercase text-[11px]">
              Architecture Stack
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span className="px-2 py-1 bg-slate-800 rounded-md text-emerald-400 font-medium">React 19</span>
              <span className="px-2 py-1 bg-slate-800 rounded-md text-emerald-400 font-medium">Node.js 24</span>
              <span className="px-2 py-1 bg-slate-800 rounded-md text-emerald-400 font-medium">Express.js</span>
              <span className="px-2 py-1 bg-slate-800 rounded-md text-emerald-400 font-medium">PostgreSQL / SQLite</span>
              <span className="px-2 py-1 bg-slate-800 rounded-md text-emerald-400 font-medium">OpenStreetMap</span>
              <span className="px-2 py-1 bg-slate-800 rounded-md text-emerald-400 font-medium">Leaflet Maps</span>
              <span className="px-2 py-1 bg-slate-800 rounded-md text-emerald-400 font-medium">QR Scanning</span>
              <span className="px-2 py-1 bg-slate-800 rounded-md text-emerald-400 font-medium">Tailwind CSS</span>
            </div>
            <div className="mt-4 text-[11px] text-slate-500">
              Real-time Geolocation API & Concurrency Protection
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} ParkSmart – Smart Parking Reservation & Management System.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for BCA Final Year Project
          </div>
        </div>
      </div>
    </footer>
  );
}
