import React, { useState } from 'react';
import { api } from '../api/client';
import {
  QrCode,
  X,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  ArrowRight,
  ShieldCheck,
  Clock,
  Car
} from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose }) {
  const [scanInput, setScanInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleVerify(tokenOrRef) {
    const value = tokenOrRef || scanInput;
    if (!value.trim()) return;

    setIsVerifying(true);
    setError('');
    setResult(null);

    try {
      const isRef = value.startsWith('BK-') || value.startsWith('PK-');
      const payload = isRef
        ? { booking_reference: value.trim() }
        : { qr_payload: value.trim() };

      const res = await api.qr.verify(payload);
      if (res.success) {
        setResult(res);
        setScanInput('');
      }
    } catch (err) {
      setError(err.message || 'QR verification failed.');
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Gate QR Code Scanner</h3>
              <p className="text-[10px] text-slate-400">Automated Boom Barrier Access Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Simulation Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Simulated Scanner Viewport */}
          <div className="relative h-44 bg-slate-950 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-400 overflow-hidden group">
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse"></div>
            <ScanLine className="w-12 h-12 text-slate-600 mb-2" />
            <span className="text-[11px] font-semibold text-slate-300">
              Optical Sensor Active
            </span>
            <span className="text-[10px] text-slate-500">
              Point camera at ParkSmart booking QR code
            </span>
          </div>

          {/* Quick Demo Pre-fill Buttons */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              1-Click Demo Scanner Test:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setScanInput('BK-78921');
                  handleVerify('BK-78921');
                }}
                className="flex-1 py-1.5 px-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px] hover:bg-emerald-100 transition-colors"
              >
                Scan Active BK-78921 (Exit Test)
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanInput('BK-99342');
                  handleVerify('BK-99342');
                }}
                className="flex-1 py-1.5 px-2 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg font-bold text-[11px] hover:bg-sky-100 transition-colors"
              >
                Scan Upcoming BK-99342 (Entry)
              </button>
            </div>
          </div>

          {/* Manual Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value.toUpperCase())}
              placeholder="Paste QR payload or Booking Ref (e.g. PK-12345)"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-hidden text-xs"
            />
            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Verification Denied</span>
              </div>
              <p className="text-[11px] text-rose-600">{error}</p>
            </div>
          )}

          {/* Success Result Card */}
          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{result.action === 'CHECK_IN_SUCCESS' ? 'Entry Granted' : 'Exit Verified'}</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono font-bold rounded-md text-[10px]">
                  BOOM BARRIER: {result.gateStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-emerald-700 block text-[10px] font-semibold">Vehicle</span>
                  <span className="font-bold">{result.details.vehicleNumber}</span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[10px] font-semibold">Assigned Bay</span>
                  <span className="font-bold">
                    Slot {result.details.slotNumber} ({result.details.floor || 'Ground'})
                  </span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[10px] font-semibold">Customer</span>
                  <span className="font-medium truncate">{result.details.customerName}</span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[10px] font-semibold">Reference</span>
                  <span className="font-mono font-bold">{result.details.bookingReference}</span>
                </div>
              </div>

              {result.details.overstayAmount > 0 && (
                <div className="p-2 bg-amber-100 rounded-lg text-amber-900 text-[11px] font-medium">
                  ⚠️ Overstay of {result.details.overstayMinutes} minutes recorded. Additional charge: ₹{result.details.overstayAmount}.
                </div>
              )}

              <p className="text-[10px] text-emerald-700 text-center font-medium">
                {result.message}
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
