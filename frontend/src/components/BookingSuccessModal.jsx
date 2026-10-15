import React from 'react';
import {
  CheckCircle2,
  QrCode,
  MapPin,
  Calendar,
  Navigation,
  ArrowRight,
  X,
  Share2
} from 'lucide-react';

export default function BookingSuccessModal({ reservation, onClose, onViewBookings }) {
  if (!reservation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center relative">
        
        {/* Top Banner */}
        <div className="bg-gradient-to-tr from-brand-700 to-emerald-500 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-md">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">Booking Confirmed!</h3>
          <p className="text-xs text-brand-100 mt-1">Your slot is locked and ready for your arrival</p>
        </div>

        {/* QR Code Pass Card */}
        <div className="p-6 space-y-4 text-xs">
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Gate Entry QR Code Pass
            </div>

            {reservation.qrCodeImage ? (
              <img
                src={reservation.qrCodeImage}
                alt="Gate QR Code"
                className="w-48 h-48 mx-auto rounded-xl border border-slate-200 shadow-xs bg-white p-2"
              />
            ) : (
              <div className="w-48 h-48 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                <QrCode className="w-16 h-16" />
              </div>
            )}

            <div className="mt-3 font-mono font-extrabold text-base text-slate-900 tracking-wider">
              {reservation.bookingRef}
            </div>
            <div className="text-[10px] text-slate-500">Scan at entrance boom barrier</div>
          </div>

          {/* Reserved Spot Details */}
          <div className="grid grid-cols-2 gap-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Allocated Bay</span>
              <span className="text-sm font-extrabold text-brand-700">
                {reservation.slotNumber} ({reservation.floor || 'Ground'})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Paid</span>
              <span className="text-sm font-extrabold text-slate-900">
                ₹{reservation.pricing?.totalAmount || '...'}
              </span>
            </div>
          </div>

          <div className="text-left text-slate-600 flex items-start gap-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">{reservation.facilityName}</div>
              <div className="text-[11px] text-slate-500">{reservation.facilityAddress}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                onClose();
                onViewBookings();
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>View In My Bookings</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
