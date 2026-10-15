import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ShieldAlert,
  Users,
  Building2,
  DollarSign,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  History,
  Lock
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('facilities'); // 'facilities' | 'users' | 'complaints' | 'logs'

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      setLoading(true);
      const [resMetrics, resFacs, resUsers, resComplaints, resLogs] = await Promise.all([
        api.admin.getMetrics(),
        api.admin.getFacilities(),
        api.admin.getUsers(),
        api.admin.getComplaints(),
        api.admin.getAuditLogs()
      ]);

      if (resMetrics.success) setMetrics(resMetrics.metrics);
      if (resFacs.success) setFacilities(resFacs.facilities);
      if (resUsers.success) setUsers(resUsers.users);
      if (resComplaints.success) setComplaints(resComplaints.complaints);
      if (resLogs.success) setAuditLogs(resLogs.logs);
    } catch (err) {
      console.error('Admin data error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleApproval(facilityId) {
    try {
      const res = await api.admin.toggleFacilityApproval(facilityId);
      if (res.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update approval');
    }
  }

  if (loading || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-extrabold text-[10px] uppercase tracking-wider border border-purple-500/30 flex items-center gap-1">
            <Lock className="w-3 h-3" /> System Operations Console
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          ParkSmart Platform Administration
        </h1>
        <p className="text-xs text-slate-400">
          Supervise facility verification, manage disputes, audit cryptographic logs, and track platform-wide volume.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Drivers</span>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.totalCustomers}</div>
          <span className="text-[10px] text-slate-500">Registered Customers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Parking Owners</span>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.totalOwners}</div>
          <span className="text-[10px] text-slate-500">Partners</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Facilities</span>
          <div className="text-2xl font-extrabold text-brand-600">{metrics.totalFacilities}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">Active in BLR</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Reservations</span>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.totalReservations}</div>
          <span className="text-[10px] text-slate-500">All-Time Bookings</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Platform Rev</span>
          <div className="text-2xl font-extrabold text-emerald-700">₹{metrics.totalRevenue}</div>
          <span className="text-[10px] text-slate-500">Total Transacted</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Open Disputes</span>
          <div className="text-2xl font-extrabold text-purple-600">{metrics.openComplaints}</div>
          <span className="text-[10px] text-purple-600 font-semibold">Requires Review</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('facilities')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'facilities'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Facility Approvals ({facilities.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          User Registry ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Platform Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab: Facilities Approval Management */}
      {activeTab === 'facilities' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-4">Facility Name & Address</th>
                  <th className="p-4">Owner Contact</th>
                  <th className="p-4">Total Bays</th>
                  <th className="p-4">Hourly Fee</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {facilities.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{fac.name}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-xs">{fac.address}</div>
                    </td>
                    <td className="p-4">
                      <div>{fac.owner_name}</div>
                      <div className="text-slate-400 text-[11px]">{fac.owner_email}</div>
                    </td>
                    <td className="p-4 font-bold">{fac.total_slots}</td>
                    <td className="p-4 font-bold text-brand-700">₹{fac.hourly_rate}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        fac.is_approved === 1
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {fac.is_approved === 1 ? 'Approved & Live' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleApproval(fac.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors ${
                          fac.is_approved === 1
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {fac.is_approved === 1 ? 'Suspend Listing' : 'Approve Facility'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Users Registry */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Vehicles</th>
                  <th className="p-4">Bookings</th>
                  <th className="p-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="capitalize px-2 py-0.5 bg-slate-100 rounded-md font-bold text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-bold">{u.vehicle_count}</td>
                    <td className="p-4 font-bold">{u.reservation_count}</td>
                    <td className="p-4 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs text-xs">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" />
            <span>Cryptographic Platform Audit Trail</span>
          </div>
          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                      {log.action}
                    </span>
                    <span className="text-slate-700 font-medium">{log.details}</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Actor: {log.user_name || 'System Staff'} • Entity: {log.entity_type} ({log.entity_id})
                  </div>
                </div>
                <span className="text-slate-400 text-[10px] shrink-0 font-mono">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
