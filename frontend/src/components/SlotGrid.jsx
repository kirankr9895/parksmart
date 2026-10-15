import React, { useState } from 'react';
import { Car, Zap, Accessibility, Bike, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function SlotGrid({ slots = [], selectedSlotId, onSelectSlot, onAutoAllocate }) {
  const [activeFloor, setActiveFloor] = useState('All');

  // Extract unique floors
  const floors = ['All', ...Array.from(new Set(slots.map((s) => s.floor || 'Ground')))];

  const filteredSlots = activeFloor === 'All' ? slots : slots.filter((s) => s.floor === activeFloor);

  function getSlotIcon(type, isEv) {
    if (isEv) return <Zap className="w-4 h-4 text-amber-500" />;
    if (type === 'two_wheeler') return <Bike className="w-4 h-4 text-emerald-600" />;
    if (type === 'accessible') return <Accessibility className="w-4 h-4 text-sky-600" />;
    return <Car className="w-4 h-4" />;
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      
      {/* Header and Auto-allocate CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Interactive Parking Bay Layout</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
              {slots.filter((s) => s.status === 'available').length} free
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Pick your preferred spot or let ParkSmart automatically assign the best slot.
          </p>
        </div>

        <button
          type="button"
          onClick={onAutoAllocate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Auto-Allocate Best Slot</span>
        </button>
      </div>

      {/* Floor Filter Tabs */}
      {floors.length > 2 && (
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          {floors.map((floor) => (
            <button
              key={floor}
              type="button"
              onClick={() => setActiveFloor(floor)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeFloor === floor
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {floor}
            </button>
          ))}
        </div>
      )}

      {/* Visual Slot Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-72 overflow-y-auto p-1">
        {filteredSlots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          const isAvailable = slot.status === 'available';
          const isOccupied = slot.status === 'occupied';
          const isReserved = slot.status === 'reserved';
          const isMaintenance = slot.status === 'maintenance';

          let stateStyle = 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60';

          if (isAvailable) {
            stateStyle = isSelected
              ? 'bg-brand-50 border-brand-500 text-brand-700 ring-2 ring-brand-400 shadow-md transform scale-105'
              : 'bg-emerald-50/60 border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer shadow-2xs';
          } else if (isOccupied) {
            stateStyle = 'bg-purple-50 border-purple-200 text-purple-700 cursor-not-allowed opacity-75';
          } else if (isReserved) {
            stateStyle = 'bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed opacity-75';
          } else if (isMaintenance) {
            stateStyle = 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed';
          }

          return (
            <button
              key={slot.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectSlot(slot)}
              className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${stateStyle}`}
            >
              <div className="flex items-center gap-1 mb-1">
                {getSlotIcon(slot.slot_type, slot.is_ev_equipped)}
                <span className="font-extrabold text-xs">{slot.slot_number}</span>
              </div>

              <div className="text-[10px] uppercase font-bold truncate max-w-full">
                {isSelected ? (
                  <span className="flex items-center gap-0.5 text-brand-700 font-extrabold">
                    <Check className="w-3 h-3 stroke-[3]" /> Selected
                  </span>
                ) : isAvailable ? (
                  <span className="text-emerald-700 font-semibold">Available</span>
                ) : isOccupied ? (
                  <span className="text-purple-700 font-medium">Parked</span>
                ) : isReserved ? (
                  <span className="text-amber-700 font-medium">Reserved</span>
                ) : (
                  <span className="text-slate-400 font-medium">Service</span>
                )}
              </div>

              {slot.is_ev_equipped === 1 && (
                <div className="absolute top-1 right-1" title="EV Fast Charger Ready">
                  <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-brand-50 border-2 border-brand-500"></div>
          <span className="font-bold text-slate-900">Your Selection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-purple-100 border border-purple-200"></div>
          <span>Occupied (Parked)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-amber-100 border border-amber-200"></div>
          <span>Reserved Ahead</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-slate-100 border border-slate-200"></div>
          <span>Maintenance</span>
        </div>
      </div>

    </div>
  );
}
