import React, { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import { api } from '../api/client';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Car,
  Bike,
  Zap,
  Radio,
  ArrowRight,
  ShieldCheck,
  Star,
  Sparkles,
  QrCode,
  Navigation,
  Compass,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export default function HomePage({ onSearch, onSelectFacility }) {
  const { currentLocation, requestCurrentGpsLocation, isDetectingGps, isLiveGpsActive, setCustomLocation, popularLocations } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [vehicleType, setVehicleType] = useState('car');
  const [featuredFacilities, setFeaturedFacilities] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Time intervals (default: now to +2 hours)
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

  // Fetch featured facilities on mount
  useEffect(() => {
    fetchFeatured();
  }, [currentLocation]);

  async function fetchFeatured() {
    try {
      setLoadingFeatured(true);
      const res = await api.facilities.search({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        sort_by: 'smart_recommended'
      });
      if (res.success) {
        setFeaturedFacilities(res.facilities.slice(0, 3));
      }
    } catch (err) {
      console.warn('Featured fetch error:', err);
    } finally {
      setLoadingFeatured(false);
    }
  }

  // Handle live place search autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.geo.search(searchQuery);
        if (res.success) {
          setSuggestions(res.results || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        // ignore
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleSelectSuggestion(item) {
    setSearchQuery(item.name);
    setCustomLocation({
      lat: item.lat,
      lng: item.lng,
      label: item.name,
      locality: item.locality
    });
    setShowSuggestions(false);
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    onSearch({
      query: searchQuery,
      vehicle_type: vehicleType,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      lat: currentLocation.lat,
      lng: currentLocation.lng
    });
  }

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        {/* Decorative backdrop gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-brand-100/50 via-emerald-50/20 to-transparent blur-3xl -z-10 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Real-Time Availability & GPS Navigation in Bengaluru</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
            Smart Parking, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-500">Guaranteed Slots</span>, Zero Circling.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Find nearby parking bays in seconds, compare hourly prices, reserve and lock your slot before arriving, and glide in with instant QR verification.
          </p>

          {/* Search Box Card */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-5 sm:p-6 text-left relative z-20">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Row 1: Destination input & GPS Button */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                
                <div className="relative md:col-span-8">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Destination / Area in Bengaluru
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="e.g. Phoenix Marketcity, MG Road, Indiranagar, Forum Mall..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-hidden transition-all"
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 text-xs">
                      {suggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                            {item.locality}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* GPS Trigger Button */}
                <div className="md:col-span-4 self-end">
                  <button
                    type="button"
                    onClick={requestCurrentGpsLocation}
                    disabled={isDetectingGps}
                    className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isLiveGpsActive
                        ? 'bg-sky-50 border-sky-300 text-sky-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {isDetectingGps ? (
                      <Radio className="w-4 h-4 animate-spin text-sky-600" />
                    ) : (
                      <Compass className="w-4 h-4 text-brand-600" />
                    )}
                    <span>
                      {isDetectingGps
                        ? 'Acquiring GPS...'
                        : isLiveGpsActive
                        ? 'Using Current GPS Location'
                        : 'Use My Current Location'}
                    </span>
                  </button>
                </div>

              </div>

              {/* Row 2: Check-in, Check-out & Vehicle Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Arrival Time */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Check-In Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Departure Time */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Check-Out Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    <span>Vehicle Category</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setVehicleType('car')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        vehicleType === 'car' ? 'bg-white shadow-xs text-brand-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Car / Sedan"
                    >
                      🚗 Car
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleType('suv')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        vehicleType === 'suv' ? 'bg-white shadow-xs text-brand-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="SUV / Large"
                    >
                      🚙 SUV
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleType('bike')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        vehicleType === 'bike' ? 'bg-white shadow-xs text-brand-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Two-Wheeler"
                    >
                      🏍️ Bike
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleType('ev_car')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        vehicleType === 'ev_car' ? 'bg-white shadow-xs text-brand-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Electric Vehicle"
                    >
                      ⚡ EV
                    </button>
                  </div>
                </div>

              </div>

              {/* Row 3: Popular Location Chips & Search Button */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                
                {/* Popular chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Hotspots:</span>
                  {popularLocations.map((loc) => (
                    <button
                      key={loc.label}
                      type="button"
                      onClick={() => {
                        setCustomLocation(loc);
                        setSearchQuery(loc.label);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-transparent rounded-lg text-[11px] font-semibold text-slate-600 transition-colors"
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>

                {/* Primary Search CTA */}
                <button
                  type="submit"
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Find Available Parking</span>
                </button>

              </div>

            </form>
          </div>

          {/* Social Proof Bar */}
          <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-slate-700">
            <div className="bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
              <div className="text-xl font-extrabold text-slate-900">500+</div>
              <div className="text-[11px] text-slate-500 font-medium">Smart bays in Bengaluru</div>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
              <div className="text-xl font-extrabold text-brand-600">99.8%</div>
              <div className="text-[11px] text-slate-500 font-medium">Slot lock reliability</div>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
              <div className="text-xl font-extrabold text-slate-900">1.8 Sec</div>
              <div className="text-[11px] text-slate-500 font-medium">Avg QR gate scan time</div>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
              <div className="text-xl font-extrabold text-amber-500 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 inline" /> 4.9 / 5
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Verified driver reviews</div>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Facilities Near Current Location */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Featured Nearby Parking Locations
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Top-rated facilities near {currentLocation.locality || 'Central Bengaluru'} with live slot availability.
            </p>
          </div>
          <button
            onClick={() => onSearch({ lat: currentLocation.lat, lng: currentLocation.lng })}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            <span>View All Spots on Map</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredFacilities.map((fac) => (
              <div
                key={fac.id}
                onClick={() => onSelectFacility(fac)}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-brand-300 transition-all cursor-pointer overflow-hidden group flex flex-col"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={fac.image_url}
                    alt={fac.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                    ₹{fac.hourly_rate} / hr
                  </div>
                  <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{fac.avg_rating}</span>
                  </div>
                  {fac.has_ev_charging === 1 && (
                    <div className="absolute bottom-3 left-3 bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                      <Zap className="w-3 h-3 fill-amber-950" />
                      <span>EV Charging Bay</span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-600 transition-colors line-clamp-1">
                      {fac.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{fac.locality}, Bengaluru</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-slate-500">
                      <span className="font-bold text-slate-800">{fac.distanceFormatted}</span> ({fac.travelTimeMinutes} mins away)
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                      fac.availableSlots > 5
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : fac.availableSlots > 0
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {fac.availableSlots > 0 ? `${fac.availableSlots} bays free` : 'Full (Waitlist)'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-900 text-white py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 rounded-3xl">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Seamless 4-Step Process
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight">
              How ParkSmart Works in the Real World
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed to eliminate traffic congestion, reduce fuel waste, and streamline parking facility management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 font-extrabold text-sm flex items-center justify-center border border-brand-500/30">
                01
              </div>
              <h3 className="text-base font-bold text-white">Find & Compare</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your destination or use GPS to compare parking rates, driving distance, and live slot capacity.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 font-extrabold text-sm flex items-center justify-center border border-brand-500/30">
                02
              </div>
              <h3 className="text-base font-bold text-white">Reserve & Lock Bay</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose your exact bay or let auto-allocation lock your slot with database concurrency protection.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 font-extrabold text-sm flex items-center justify-center border border-brand-500/30">
                03
              </div>
              <h3 className="text-base font-bold text-white">GPS Navigation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Follow turn-by-turn navigation directly to the parking facility entrance with zero delay.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 font-extrabold text-sm flex items-center justify-center border border-brand-500/30">
                04
              </div>
              <h3 className="text-base font-bold text-white">QR Fast-Track Pass</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan your unique cryptographic QR code at the boom barrier for instant touchless entry and exit.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500">
            Everything you need to know about ParkSmart operations and booking rules.
          </p>
        </div>

        <div className="space-y-3 text-xs">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-600" />
              <span>How does ParkSmart prevent double-booking for the same slot?</span>
            </h4>
            <p className="text-slate-600 pl-6 leading-relaxed">
              Every reservation is executed within an atomic database transaction using SQLite WAL mode / PostgreSQL relational constraints. Before any slot is assigned, the backend verifies that no active or confirmed reservation overlaps the requested start and end interval.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-600" />
              <span>What happens if I arrive earlier or later than my booked time?</span>
            </h4>
            <p className="text-slate-600 pl-6 leading-relaxed">
              You can arrive up to 3 hours before your scheduled time. If you overstay past your reserved time, the exit scanner automatically records the extra minutes and computes the standard hourly overstay fee at exit.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-600" />
              <span>Can I cancel my advance booking and get a refund?</span>
            </h4>
            <p className="text-slate-600 pl-6 leading-relaxed">
              Yes! If you cancel at least 1 hour before the start time, you receive a 90% instant refund. Cancellations within the final hour receive a 50% refund.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
