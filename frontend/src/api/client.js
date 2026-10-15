const API_BASE = '/api';

/**
 * Common request wrapper with Bearer token authentication
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('parksmart_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (details) => request('/auth/register', { method: 'POST', body: JSON.stringify(details) }),
    me: () => request('/auth/me')
  },

  // Facilities & Search
  facilities: {
    search: (params = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      return request(`/facilities${qs ? `?${qs}` : ''}`);
    },
    getById: (id, params = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      return request(`/facilities/${id}${qs ? `?${qs}` : ''}`);
    },
    getSlots: (id, params = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      return request(`/facilities/${id}/slots${qs ? `?${qs}` : ''}`);
    }
  },

  // Reservations
  reservations: {
    estimate: (data) => request('/reservations/estimate', { method: 'POST', body: JSON.stringify(data) }),
    create: (data) => request('/reservations', { method: 'POST', body: JSON.stringify(data) }),
    getMyBookings: () => request('/reservations/my'),
    cancel: (id, reason) => request(`/reservations/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    extend: (id, extraHours) => request(`/reservations/${id}/extend`, { method: 'POST', body: JSON.stringify({ extra_hours: extraHours }) })
  },

  // QR Code Verification
  qr: {
    verify: (payload) => request('/qr/verify', { method: 'POST', body: JSON.stringify(payload) })
  },

  // Owner
  owner: {
    getDashboard: (params = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      return request(`/owner/dashboard${qs ? `?${qs}` : ''}`);
    },
    getFacilities: () => request('/owner/facilities'),
    createFacility: (data) => request('/owner/facilities', { method: 'POST', body: JSON.stringify(data) }),
    toggleSlotMaintenance: (slotId) => request(`/owner/slots/${slotId}/toggle-maintenance`, { method: 'PATCH' })
  },

  // Admin
  admin: {
    getMetrics: () => request('/admin/metrics'),
    getFacilities: () => request('/admin/facilities'),
    toggleFacilityApproval: (id) => request(`/admin/facilities/${id}/toggle-approval`, { method: 'PATCH' }),
    getUsers: () => request('/admin/users'),
    getComplaints: () => request('/admin/complaints'),
    updateComplaint: (id, data) => request(`/admin/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getAuditLogs: () => request('/admin/audit-logs')
  },

  // Vehicles
  vehicles: {
    list: () => request('/vehicles'),
    add: (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/vehicles/${id}`, { method: 'DELETE' })
  },

  // Reviews & Favourites
  reviews: {
    submit: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
    getByFacility: (facilityId) => request(`/reviews/${facilityId}`)
  },
  favourites: {
    list: () => request('/favourites'),
    toggle: (facility_id) => request('/favourites/toggle', { method: 'POST', body: JSON.stringify({ facility_id }) })
  },

  // Waitlist
  waitlist: {
    join: (data) => request('/waitlist', { method: 'POST', body: JSON.stringify(data) }),
    list: () => request('/waitlist')
  },

  // Geo
  geo: {
    search: (q) => request(`/geo/search?q=${encodeURIComponent(q || '')}`),
    reverse: (lat, lng) => request(`/geo/reverse?lat=${lat}&lng=${lng}`)
  }
};
