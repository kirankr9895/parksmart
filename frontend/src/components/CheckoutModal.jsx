import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  Tag,
  AlertCircle,
  Car,
  Clock,
  MapPin,
  CheckCircle2,
  Wallet
} from 'lucide-react';

export default function CheckoutModal({
  isOpen,
  onClose,
  facility,
  selectedSlot,
  startTime,
  endTime,
  vehicleType = 'car',
  needsEv = false,
  onBookingSuccess
}) {
  const { user } = useAuth();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState(vehicleType);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [breakdown, setBreakdown] = useState(null);

  // Pre-fill user's primary vehicle if available
  useEffect(() => {
    if (user?.vehicles && user.vehicles.length > 0) {
      const primary = user.vehicles.find((v) => v.is_primary) || user.vehicles[0];
      setVehicleNumber(primary.vehicle_number);
      setSelectedVehicleType(primary.vehicle_type || vehicleType);
    } else {
      setVehicleNumber('KA-01-MJ-4052');
    }
  }, [user, vehicleType]);

  // Estimate price
  useEffect(() => {
    if (facility && startTime && endTime) {
      fetchEstimate();
    }
  }, [facility, startTime, endTime, selectedVehicleType, needsEv, appliedCoupon]);

  async function fetchEstimate() {
    try {
      const res = await api.reservations.estimate({
        facility_id: facility.id,
        vehicle_type: selectedVehicleType,
        start_time: startTime,
        end_time: endTime,
        needs_ev: needsEv,
        coupon_code: appliedCoupon
      });
      if (res.success) {
        setBreakdown(res.breakdown);
      }
    } catch (err) {
      console.warn('Estimate fetch error:', err);
    }
  }

  function handleApplyCoupon() {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (code === 'PARKSMART20' || code === 'FIRSTPARK') {
      setAppliedCoupon(code);
    } else {
      setCouponError('Invalid coupon code. Try PARKSMART20');
    }
  }

  async function handleConfirmBooking(e) {
    e.preventDefault();
    setError('');

    if (!vehicleNumber.trim()) {
      setError('Please provide vehicle registration number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        facility_id: facility.id,
        slot_id: selectedSlot?.id || null, // null triggers auto-allocation!
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        vehicle_type: selectedVehicleType,
        start_time: startTime,
        end_time: endTime,
        needs_ev: needsEv,
        coupon_code: appliedCoupon,
        payment_method: paymentMethod
      };

      const res = await api.reservations.create(payload);
      if (res.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        onBookingSuccess(res.reservation);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to complete reservation.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen || !facility) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Confirm & Secure Slot</span>
            </h3>
            <p className="text-xs text-slate-400">Advance Reservation Protection</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConfirmBooking} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Facility Summary Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 text-sm">{facility.name}</div>
            <div className="text-slate-500 flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{facility.address}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Slot</span>
                <span className="font-bold text-brand-700">
                  {selectedSlot ? `Bay ${selectedSlot.slot_number} (${selectedSlot.floor})` : 'Auto-Allocated (Best Bay)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                <span className="font-bold">{breakdown?.durationHours || 2} Hours</span>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">Vehicle Registration Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. KA-01-MJ-4052"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold tracking-wider text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
              />
              <select
                value={selectedVehicleType}
                onChange={(e) => setSelectedVehicleType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-700"
              >
                <option value="car">Car (Sedan/Hatch)</option>
                <option value="suv">SUV</option>
                <option value="bike">Two-Wheeler</option>
                <option value="ev_car">EV Car</option>
              </select>
            </div>
          </div>

          {/* Coupon Code */}
          <div className="space-y-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon (e.g. PARKSMART20)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-bold"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Apply
              </button>
            </div>
            {appliedCoupon && (
              <div className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Coupon {appliedCoupon} applied!
              </div>
            )}
            {couponError && <div className="text-rose-600 font-semibold">{couponError}</div>}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">Payment Method (Test Mode)</label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-1 ring-brand-400 font-bold'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="hidden"
                />
                <Wallet className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-bold">UPI / GPay / PhonePe</div>
                  <div className="text-[10px] text-slate-500">Instant Sandbox</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-1 ring-brand-400 font-bold'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="hidden"
                />
                <CreditCard className="w-4 h-4 text-sky-600" />
                <div>
                  <div className="font-bold">Credit / Debit Card</div>
                  <div className="text-[10px] text-slate-500">Razorpay Test</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-1 ring-brand-400 font-bold'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="hidden"
                />
                <QrCode className="w-4 h-4 text-slate-600" />
                <div>
                  <div className="font-bold">Pay on Arrival</div>
                  <div className="text-[10px] text-slate-500">Settle at Exit Gate</div>
                </div>
              </label>
            </div>
          </div>

          {/* Itemized Price Breakdown */}
          {breakdown && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Base Rate ({breakdown.durationHours} hrs × ₹{breakdown.hourlyRate})</span>
                <span>₹{breakdown.baseAmount}</span>
              </div>
              {breakdown.evFee > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>EV Supercharging Fee</span>
                  <span>+₹{breakdown.evFee}</span>
                </div>
              )}
              {breakdown.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{breakdown.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Taxes (18% GST)</span>
                <span>₹{breakdown.taxAmount}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                <span>Total Amount Payable</span>
                <span className="text-brand-600 text-base">₹{breakdown.totalAmount}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm & Reserve Slot (₹{breakdown?.totalAmount || '...'})</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-400">
            Guaranteed slot locking. 90% instant refund on cancellations before reservation start time.
          </p>

        </form>

      </div>
    </div>
  );
}
