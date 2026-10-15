import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Building2,
  TrendingUp,
  Car,
  QrCode,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Wrench,
  DollarSign
} from 'lucide-react';

export default function OwnerDashboardPage({ onOpenGateScanner }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  // New Facility Form State
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLocality, setNewLocality] = useState('Indiranagar');
  const [newLat, setNewLat] = useState('12.9716');
  const [newLng, setNewLng] = useState('77.6412');
  const [newSlots, setNewSlots] = useState('40');
  const [newHourlyRate, setNewHourlyRate] = useState('40');
  const [newHasEv, setNewHasEv] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [selectedFacilityId]);

  async function fetchDashboard() {
    try {
      setLoading(true);
      const res = await api.owner.getDashboard({
        facility_id: selectedFacilityId || undefined
      });
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Owner dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleMaintenance(slotId) {
    try {
      const res = await api.owner.toggleSlotMaintenance(slotId);
      if (res.success) {
        fetchDashboard();
      }
    } catch (err) {
      alert(err.message || 'Failed to update slot');
    }
  }

  async function handleRegisterFacility(e) {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const res = await api.owner.createFacility({
        name: newName,
        address: newAddress,
        locality: newLocality,
        latitude: parseFloat(newLat),
        longitude: parseFloat(newLng),
        total_slots: parseInt(newSlots),
        hourly_rate: parseFloat(newHourlyRate),
        has_ev_charging: newHasEv ? 1 : 0
      });

      if (res.success) {
        alert('New facility registered successfully!');
        setRegisterModalOpen(false);
        fetchDashboard();
      }
    } catch (err) {
      alert(err.message || 'Failed to register facility');
    } finally {
      setIsRegistering(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  const { summary, facilities, occupancyChart, liveSessions, upcomingBookings } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
      
      {/* Dashboard Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 font-extrabold text-[10px] uppercase tracking-wider">
              Parking Owner Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Facility Operations & Occupancy
          </h1>
          <p className="text-xs text-slate-500">
            Real-time bay statuses, boom barrier automated access, and revenue metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenGateScanner}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Launch Gate Scanner</span>
          </button>

          <button
            onClick={() => setRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Facility</span>
          </button>
        </div>
      </div>

      {/* Facility Filter Selector if multiple */}
      {facilities.length > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">Select Facility:</span>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
          >
            <option value="">All Managed Facilities</option>
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Capacity</span>
          <div className="text-2xl font-extrabold text-slate-900">{summary.totalSpaces}</div>
          <span className="text-[10px] text-slate-500">Spaces Registered</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-1 bg-emerald-50/20">
          <span className="text-[10px] font-bold text-emerald-700 uppercase">Available</span>
          <div className="text-2xl font-extrabold text-emerald-600">{summary.availableSpaces}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">Ready for entry</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs space-y-1 bg-purple-50/20">
          <span className="text-[10px] font-bold text-purple-700 uppercase">Parked Vehicles</span>
          <div className="text-2xl font-extrabold text-purple-600">{summary.occupiedSpaces}</div>
          <span className="text-[10px] text-purple-600 font-semibold">Inside Facility</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1 bg-amber-50/20">
          <span className="text-[10px] font-bold text-amber-700 uppercase">Reserved Ahead</span>
          <div className="text-2xl font-extrabold text-amber-600">{summary.reservedSpaces}</div>
          <span className="text-[10px] text-amber-600 font-semibold">Locked Bookings</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Maintenance</span>
          <div className="text-2xl font-extrabold text-slate-500">{summary.maintenanceSpaces}</div>
          <span className="text-[10px] text-slate-400">Offline / Service</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-brand-200 shadow-2xs space-y-1 bg-brand-50/20">
          <span className="text-[10px] font-bold text-brand-700 uppercase">Today's Revenue</span>
          <div className="text-2xl font-extrabold text-brand-700">₹{summary.todayRevenue}</div>
          <span className="text-[10px] text-brand-600 font-semibold">Settled & Booked</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Total</span>
          <div className="text-2xl font-extrabold text-slate-900">₹{summary.monthlyRevenue}</div>
          <span className="text-[10px] text-slate-500">Calendar Month</span>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hourly Occupancy Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hourly Occupancy Profile (%)</h3>
              <p className="text-[11px] text-slate-500">Utilization curve throughout operating hours</p>
            </div>
            <span className="text-xs font-bold text-brand-600">Peak: 18:00 (95%)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={occupancyChart}>
                <defs>
                  <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis unit="%" stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val) => [`${val}% Occupancy`, 'Utilization']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="occupancy" stroke="#16a34a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOcc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Projection Bar Chart */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Revenue Generated by Hour</h3>
              <p className="text-[11px] text-slate-500">Fee collection trends</p>
            </div>
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis prefix="₹" stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val) => [`₹${val}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Live Vehicle Feed inside facility */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Active Vehicles Currently Parked ({liveSessions.length})
          </h3>
          <span className="text-[10px] text-slate-400">Live Optical Sensors</span>
        </div>

        {liveSessions.length === 0 ? (
          <p className="text-slate-400 py-4 text-center">No vehicles currently inside facility.</p>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase font-bold">
                  <th className="pb-2">Vehicle Reg</th>
                  <th className="pb-2">Allocated Bay</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Entry Timestamp</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {liveSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono font-bold text-slate-900">{s.vehicle_number}</td>
                    <td className="py-2.5 font-bold text-brand-700">Slot {s.slot_number} ({s.floor})</td>
                    <td className="py-2.5">{s.customer_name} ({s.customer_phone})</td>
                    <td className="py-2.5 text-slate-500">{new Date(s.check_in_time).toLocaleTimeString()}</td>
                    <td className="py-2.5">
                      <button
                        onClick={onOpenGateScanner}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold"
                      >
                        Exit Scanner
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Facility Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Register New Parking Facility</h3>

            <form onSubmit={handleRegisterFacility} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Koramangala Nexus Smart Parking"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 80ft Road, 4th Block, Koramangala"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Locality</label>
                  <input
                    type="text"
                    required
                    value={newLocality}
                    onChange={(e) => setNewLocality(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Capacity</label>
                  <input
                    type="number"
                    required
                    value={newSlots}
                    onChange={(e) => setNewSlots(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rate (₹/hr)</label>
                  <input
                    type="number"
                    required
                    value={newHourlyRate}
                    onChange={(e) => setNewHourlyRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude</label>
                  <input
                    type="text"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="text"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={newHasEv}
                  onChange={(e) => setNewHasEv(e.target.checked)}
                  className="rounded-md text-brand-600"
                />
                <span>Equipped with Fast EV Superchargers</span>
              </label>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-1 py-2 bg-brand-600 text-white font-bold rounded-xl"
                >
                  {isRegistering ? 'Registering...' : 'Register Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
