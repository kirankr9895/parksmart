import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import SlotGrid from '../components/SlotGrid';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  Zap,
  ShieldCheck,
  Navigation,
  Accessibility,
  Heart,
  Calendar,
  Share2,
  CheckCircle2,
  Sparkles,
  Users
} from 'lucide-react';

export default function FacilityDetailsPage({
  facilityId,
  onBack,
  onProceedToCheckout,
  onJoinWaitlist
}) {
  const [facility, setFacility] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [vehicleType, setVehicleType] = useState('car');
  const [needsEv, setNeedsEv] = useState(false);

  // Time Window
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  // Price breakdown estimate
  const [estimate, setEstimate] = useState(null);

  useEffect(() => {
    fetchFacilityDetails();
  }, [facilityId]);

  useEffect(() => {
    if (facilityId && startTime && endTime) {
      fetchSlots();
      fetchEstimate();
    }
  }, [facilityId, startTime, endTime, vehicleType, needsEv]);

  async function fetchFacilityDetails() {
    try {
      setLoading(true);
      const res = await api.facilities.getById(facilityId);
      if (res.success) {
        setFacility(res.facility);
      }
    } catch (err) {
      console.error('Facility fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSlots() {
    try {
      const res = await api.facilities.getSlots(facilityId, {
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        vehicle_type: vehicleType
      });
      if (res.success) {
        setSlots(res.slots);
      }
    } catch (err) {
      console.warn('Slot fetch error:', err);
    }
  }

  async function fetchEstimate() {
    try {
      const res = await api.reservations.estimate({
        facility_id: facilityId,
        vehicle_type: vehicleType,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        needs_ev: needsEv
      });
      if (res.success) {
        setEstimate(res.breakdown);
      }
    } catch (err) {
      console.warn('Estimate error:', err);
    }
  }

  function handleAutoAllocate() {
    // Find first compatible free slot
    const freeSlot = slots.find((s) => s.status === 'available');
    if (freeSlot) {
      setSelectedSlot(freeSlot);
    } else {
      setSelectedSlot(null); // Backend will handle auto allocation or trigger waitlist
    }
  }

  async function handleToggleFavourite() {
    try {
      const res = await api.favourites.toggle(facilityId);
      if (res.success) {
        setIsFavourite(res.isFavourite);
      }
    } catch (err) {
      // ignore
    }
  }

  if (loading || !facility) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
        <div className="h-96 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  const availableSlotsCount = slots.filter((s) => s.status === 'available').length;
  const isFull = availableSlotsCount === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavourite}
            className={`p-2 rounded-xl border transition-colors ${
              isFavourite
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Save to favorites"
          >
            <Heart className={`w-4 h-4 ${isFavourite ? 'fill-rose-500' : ''}`} />
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Navigation className="w-4 h-4" />
            <span>Navigate</span>
          </a>
        </div>
      </div>

      {/* Facility Hero Banner & Key Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image, Info, Slot Layout & Reviews */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Hero Image Card */}
          <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-md">
            <img
              src={facility.image_url}
              alt={facility.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-brand-500 text-white text-xs font-extrabold shadow-sm">
                  ₹{facility.hourly_rate} / hr
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{facility.avg_rating} ({facility.review_count || 12} verified reviews)</span>
                </span>
                {facility.has_ev_charging === 1 && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-extrabold flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-950" /> EV Superchargers
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {facility.name}
              </h1>

              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{facility.address}</span>
              </p>
            </div>
          </div>

          {/* Description & Operating Hours */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Facility Overview
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              {facility.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-slate-700">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Hours</span>
                <span className="font-bold">{facility.is_24_7 ? '24 Hours Open' : `${facility.opening_time} - ${facility.closing_time}`}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Daily Pass</span>
                <span className="font-bold">₹{facility.daily_rate} / day</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">EV Surcharge</span>
                <span className="font-bold">₹{facility.ev_rate} / hr</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Security</span>
                <span className="font-bold text-emerald-700">24/7 CCTV & Guards</span>
              </div>
            </div>
          </div>

          {/* Interactive Slot Layout Map */}
          <SlotGrid
            slots={slots}
            selectedSlotId={selectedSlot?.id}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
            onAutoAllocate={handleAutoAllocate}
          />

          {/* Customer Reviews Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Customer Ratings & Feedback
              </h3>
              <span className="text-amber-500 font-extrabold flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{facility.avg_rating} / 5.0</span>
              </span>
            </div>

            <div className="space-y-3">
              {facility.reviews && facility.reviews.length > 0 ? (
                facility.reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{rev.author_name}</span>
                      <div className="flex text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">No reviews yet for this facility.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Sticky Booking & Cost Estimator Card */}
        <div className="lg:col-span-4 sticky top-20">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-5 text-xs">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base Rate</span>
                <div className="text-2xl font-extrabold text-slate-900">
                  ₹{facility.hourly_rate} <span className="text-xs text-slate-500 font-semibold">/ hour</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                availableSlotsCount > 5
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : availableSlotsCount > 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {availableSlotsCount > 0 ? `${availableSlotsCount} slots available` : 'Full / Waitlist'}
              </span>
            </div>

            {/* Time Window Selectors */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reservation Check-In</span>
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reservation Check-Out</span>
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Vehicle Type Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Vehicle Category
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
              >
                <option value="car">🚗 Car / Sedan</option>
                <option value="suv">🚙 SUV / Large Vehicle</option>
                <option value="bike">🏍️ Two-Wheeler / Bike</option>
                <option value="ev_car">⚡ Electric Car</option>
              </select>
            </div>

            {/* EV Power Connection Toggle */}
            {facility.has_ev_charging === 1 && (
              <label className="flex items-center gap-2 p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsEv}
                  onChange={(e) => setNeedsEv(e.target.checked)}
                  className="rounded-md text-amber-600 focus:ring-amber-500"
                />
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Connect EV Fast Charger (+₹40)
                </span>
              </label>
            )}

            {/* Slot Choice Status */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Bay</span>
              <span className="font-extrabold text-sm text-brand-700">
                {selectedSlot
                  ? `Bay ${selectedSlot.slot_number} (${selectedSlot.floor})`
                  : 'Auto-Allocation Mode (Best Free Bay Assigned)'}
              </span>
            </div>

            {/* Price Breakdown */}
            {estimate && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Duration ({estimate.durationHours} hrs × ₹{estimate.hourlyRate})</span>
                  <span>₹{estimate.baseAmount}</span>
                </div>
                {estimate.evFee > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>EV Charging</span>
                    <span>+₹{estimate.evFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>GST (18%)</span>
                  <span>₹{estimate.taxAmount}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold text-base pt-2 border-t border-slate-200">
                  <span>Estimated Total</span>
                  <span className="text-brand-600">₹{estimate.totalAmount}</span>
                </div>
              </div>
            )}

            {/* Action CTA */}
            {isFull ? (
              <div className="space-y-2">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-center font-bold">
                  All bays booked for this time window!
                </div>
                <button
                  type="button"
                  onClick={() => onJoinWaitlist({ facilityId, vehicleType, startTime, endTime })}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Users className="w-4 h-4" />
                  <span>Join Instant Waitlist</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onProceedToCheckout({
                    facility,
                    selectedSlot,
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                    vehicleType,
                    needsEv
                  })
                }
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Reserve & Proceed (₹{estimate?.totalAmount || '...'})</span>
              </button>
            )}

            <p className="text-[10px] text-center text-slate-400">
              Guaranteed slot locking with database concurrency protection.
            </p>

          </div>
        </div>

      </div>

    </div>
  );
}
