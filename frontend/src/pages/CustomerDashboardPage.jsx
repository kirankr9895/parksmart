import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  QrCode,
  MapPin,
  Car,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Star,
  Sparkles,
  Heart,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

export default function CustomerDashboardPage({ onSelectFacility, onNavigateToSearch }) {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'vehicles' | 'favourites'

  // Selected reservation for QR modal
  const [qrModalResv, setQrModalResv] = useState(null);

  // Extend Modal
  const [extendModalResv, setExtendModalResv] = useState(null);
  const [extraHours, setExtraHours] = useState(1);
  const [isExtending, setIsExtending] = useState(false);
  const [extendError, setExtendError] = useState('');

  // Cancel Modal
  const [cancelModalResv, setCancelModalResv] = useState(null);
  const [cancelReason, setCancelReason] = useState('Plans changed');
  const [isCancelling, setIsCancelling] = useState(false);

  // Add Vehicle Modal
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [newRegNumber, setNewRegNumber] = useState('');
  const [newVehType, setNewVehType] = useState('car');
  const [newModelName, setNewModelName] = useState('');

  // Review Modal
  const [reviewModalResv, setReviewModalResv] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [resBookings, resVehicles, resFavs] = await Promise.all([
        api.reservations.getMyBookings(),
        api.vehicles.list(),
        api.favourites.list()
      ]);

      if (resBookings.success) setReservations(resBookings.reservations);
      if (resVehicles.success) setVehicles(resVehicles.vehicles);
      if (resFavs.success) setFavourites(resFavs.favourites);
    } catch (err) {
      console.error('Error fetching customer data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmExtend() {
    if (!extendModalResv) return;
    setIsExtending(true);
    setExtendError('');

    try {
      const res = await api.reservations.extend(extendModalResv.id, extraHours);
      if (res.success) {
        setExtendModalResv(null);
        fetchData();
      }
    } catch (err) {
      setExtendError(err.message || 'Failed to extend session.');
    } finally {
      setIsExtending(false);
    }
  }

  async function handleConfirmCancel() {
    if (!cancelModalResv) return;
    setIsCancelling(true);

    try {
      const res = await api.reservations.cancel(cancelModalResv.id, cancelReason);
      if (res.success) {
        setCancelModalResv(null);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel.');
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleAddVehicle(e) {
    e.preventDefault();
    if (!newRegNumber.trim()) return;

    try {
      const res = await api.vehicles.add({
        vehicle_number: newRegNumber,
        vehicle_type: newVehType,
        model_name: newModelName
      });
      if (res.success) {
        setVehicleModalOpen(false);
        setNewRegNumber('');
        setNewModelName('');
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to add vehicle');
    }
  }

  async function handleDeleteVehicle(id) {
    if (!confirm('Remove this vehicle?')) return;
    try {
      const res = await api.vehicles.delete(id);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      alert('Failed to delete vehicle');
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!reviewModalResv) return;

    try {
      const res = await api.reviews.submit({
        facility_id: reviewModalResv.facility_id,
        reservation_id: reviewModalResv.id,
        rating: reviewRating,
        comment: reviewComment
      });
      if (res.success) {
        alert('Thank you for rating your parking experience!');
        setReviewModalResv(null);
        setReviewComment('');
      }
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    }
  }

  const activeReservations = reservations.filter((r) => ['confirmed', 'checked_in'].includes(r.status));
  const pastReservations = reservations.filter((r) => ['completed', 'cancelled', 'expired'].includes(r.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
      
      {/* Header Profile Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-brand-500/20">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Welcome back, {user?.name || 'Customer'}
            </h1>
            <p className="text-xs text-slate-500">
              {user?.email} • Verified Driver Account
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToSearch}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Parking</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Reservations ({reservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'vehicles'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>My Registered Vehicles ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('favourites')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'favourites'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Places ({favourites.length})</span>
        </button>
      </div>

      {/* Tab 1: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          
          {/* Active / Upcoming Section */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider text-xs">
              Active & Upcoming Sessions ({activeReservations.length})
            </h2>

            {loading ? (
              <div className="h-44 bg-slate-100 rounded-3xl animate-pulse"></div>
            ) : activeReservations.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <div className="font-bold text-slate-800">No active parking sessions right now</div>
                <p className="text-xs text-slate-400">Reserve a slot in advance for your upcoming trip.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeReservations.map((resv) => (
                  <div
                    key={resv.id}
                    className="bg-white rounded-3xl border border-brand-200/80 p-5 shadow-md shadow-brand-500/5 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase ${
                              resv.status === 'checked_in'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-brand-100 text-brand-800'
                            }`}>
                              {resv.status === 'checked_in' ? 'Parked Active' : 'Confirmed Ready'}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-500">
                              #{resv.booking_reference}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-base mt-1">
                            {resv.facility_name}
                          </h3>
                        </div>

                        {/* Live Countdown Clock Badge */}
                        {resv.countdown && (
                          <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-2xs ${
                            resv.isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : resv.isSessionActive
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{resv.countdown.label}</span>
                          </div>
                        )}
                      </div>

                      {/* Slot & Vehicle badges */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Allocated Bay</span>
                          <span className="font-extrabold text-brand-700 text-sm">
                            Bay {resv.slot_number} ({resv.slot_floor})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle Reg</span>
                          <span className="font-bold text-slate-900">{resv.vehicle_number}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{resv.facility_address}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setQrModalResv(resv)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span>Show QR Pass</span>
                      </button>

                      <button
                        onClick={() => setExtendModalResv(resv)}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Extend Time
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${resv.facility_latitude},${resv.facility_longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Turn-by-Turn GPS Navigation"
                      >
                        <Navigation className="w-4 h-4" />
                      </a>

                      {resv.status === 'confirmed' && (
                        <button
                          onClick={() => setCancelModalResv(resv)}
                          className="py-2 px-3 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Bookings Section */}
          <div className="space-y-4 pt-6">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider text-xs">
              Booking History ({pastReservations.length})
            </h2>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100 text-xs">
                {pastReservations.map((r) => (
                  <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{r.facility_name}</span>
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                          r.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Ref: {r.booking_reference} • Bay {r.slot_number} • ₹{r.total_amount}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.status === 'completed' && (
                        <button
                          onClick={() => setReviewModalResv(r)}
                          className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>Rate Experience</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Vehicles */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Registered Vehicles
            </h2>
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Car className="w-5 h-5" />
                  </div>
                  {v.is_primary === 1 && (
                    <span className="px-2 py-0.5 bg-brand-100 text-brand-800 font-bold rounded-md text-[10px]">
                      Primary
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-mono font-extrabold text-slate-900 text-base">{v.vehicle_number}</div>
                  <div className="text-xs text-slate-500 font-medium">{v.model_name || 'Standard Vehicle'}</div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="capitalize text-slate-400 font-semibold">{v.vehicle_type}</span>
                  <button
                    onClick={() => handleDeleteVehicle(v.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Saved Favorites */}
      {activeTab === 'favourites' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {favourites.map((fav) => (
            <div
              key={fav.fav_id}
              onClick={() => onSelectFacility(fav)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md cursor-pointer transition-all"
            >
              <img src={fav.image_url} alt={fav.name} className="w-full h-32 object-cover" />
              <div className="p-4 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm truncate">{fav.name}</h4>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-brand-600">₹{fav.hourly_rate} / hr</span>
                  <span className="text-amber-500">★ {fav.avg_rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extend Session Modal */}
      {extendModalResv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Extend Parking Session</h3>
            <p className="text-slate-500">
              Extend booking for {extendModalResv.facility_name} (Bay {extendModalResv.slot_number}).
            </p>

            {extendError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl font-medium border border-rose-200">
                {extendError}
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Additional Parking Time</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((hr) => (
                  <button
                    key={hr}
                    type="button"
                    onClick={() => setExtraHours(hr)}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      extraHours === hr
                        ? 'bg-brand-50 border-brand-500 text-brand-700'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    +{hr} Hour{hr > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setExtendModalResv(null)}
                className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExtend}
                disabled={isExtending}
                className="flex-1 py-2 bg-brand-600 text-white font-bold rounded-xl"
              >
                {isExtending ? 'Checking...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalResv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Cancel Reservation</h3>
            <div className="p-3 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-200 leading-relaxed">
              💡 <strong>Cancellation Policy:</strong> You will receive a <strong>90% refund</strong> (₹{(cancelModalResv.total_amount * 0.9).toFixed(2)}) processed immediately.
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Cancellation Reason</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelModalResv(null)}
                className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 py-2 bg-rose-600 text-white font-bold rounded-xl"
              >
                {isCancelling ? 'Processing...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full QR Pass Modal */}
      {qrModalResv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 text-xs relative">
            <button
              onClick={() => setQrModalResv(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="font-extrabold text-slate-900 text-base">Boom Barrier Gate Pass</div>
            
            {qrModalResv.qrCodeImage && (
              <img
                src={qrModalResv.qrCodeImage}
                alt="QR Pass"
                className="w-48 h-48 mx-auto rounded-2xl border border-slate-200 p-2 shadow-xs bg-white"
              />
            )}

            <div className="font-mono font-extrabold text-lg text-slate-900">
              {qrModalResv.booking_reference}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-slate-700 space-y-1">
              <div><strong>Facility:</strong> {qrModalResv.facility_name}</div>
              <div><strong>Allocated Bay:</strong> Slot {qrModalResv.slot_number} ({qrModalResv.slot_floor})</div>
              <div><strong>Vehicle:</strong> {qrModalResv.vehicle_number}</div>
            </div>

            <p className="text-[10px] text-slate-400">Present this QR code to the entrance or exit optical reader</p>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Add Vehicle</h3>
            <form onSubmit={handleAddVehicle} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-05-EV-9921"
                  value={newRegNumber}
                  onChange={(e) => setNewRegNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vehicle Type</label>
                <select
                  value={newVehType}
                  onChange={(e) => setNewVehType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="car">Car (Sedan/Hatch)</option>
                  <option value="suv">SUV</option>
                  <option value="bike">Two-Wheeler</option>
                  <option value="ev_car">Electric Vehicle</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Make / Model (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Tata Nexon EV"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-xl"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalResv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Rate Your Parking Experience</h3>
            <p className="text-slate-500">{reviewModalResv.facility_name}</p>

            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Rating</label>
                <div className="flex gap-2 text-2xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={star <= reviewRating ? 'text-amber-400' : 'text-slate-300'}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Feedback</label>
                <textarea
                  rows="3"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the entrance, lighting, bay space, and staff?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalResv(null)}
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-600 text-white font-bold rounded-xl"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
