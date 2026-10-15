import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useLocation } from '../context/LocationContext';
import MapComponent from '../components/MapComponent';
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Clock,
  Star,
  Zap,
  ShieldCheck,
  Navigation,
  Car,
  Compass,
  ArrowUpDown,
  Check,
  AlertCircle
} from 'lucide-react';

export default function SearchPage({ initialParams = {}, onSelectFacility }) {
  const { currentLocation, requestCurrentGpsLocation, isDetectingGps, isLiveGpsActive } = useLocation();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialParams.query || '');
  const [sortBy, setSortBy] = useState('smart_recommended');
  const [vehicleType, setVehicleType] = useState(initialParams.vehicle_type || 'car');
  const [maxPrice, setMaxPrice] = useState(100);
  const [hasEv, setHasEv] = useState(false);
  const [hasCovered, setHasCovered] = useState(false);
  const [hasAccessible, setHasAccessible] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'map' | 'list'

  // Time window
  const [startTime] = useState(initialParams.start_time || new Date().toISOString());
  const [endTime] = useState(
    initialParams.end_time || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  );

  useEffect(() => {
    fetchFacilities();
  }, [
    currentLocation,
    sortBy,
    vehicleType,
    maxPrice,
    hasEv,
    hasCovered,
    hasAccessible,
    minRating
  ]);

  async function fetchFacilities() {
    try {
      setLoading(true);
      const params = {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        query: searchQuery,
        sort_by: sortBy,
        vehicle_type: vehicleType,
        max_price: maxPrice,
        has_ev: hasEv ? true : undefined,
        has_covered: hasCovered ? true : undefined,
        has_accessible: hasAccessible ? true : undefined,
        min_rating: minRating || undefined,
        start_time: startTime,
        end_time: endTime
      };

      const res = await api.facilities.search(params);
      if (res.success) {
        setFacilities(res.facilities);
        if (res.facilities.length > 0 && !selectedFacility) {
          setSelectedFacility(res.facilities[0]);
        }
      }
    } catch (err) {
      console.error('Failed to search facilities:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchFacilities();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      
      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by locality, landmark, mall, or street in Bengaluru..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            
            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-hidden"
              >
                <option value="smart_recommended">✨ Smart Recommended</option>
                <option value="lowest_price">💰 Lowest Hourly Price</option>
                <option value="shortest_distance">📍 Shortest Distance</option>
                <option value="highest_availability">🟢 Most Available Slots</option>
                <option value="best_rating">⭐ Highest Customer Rating</option>
              </select>
            </div>

            {/* Vehicle Type */}
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700"
            >
              <option value="car">🚗 Car</option>
              <option value="suv">🚙 SUV</option>
              <option value="bike">🏍️ Bike</option>
              <option value="ev_car">⚡ EV</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs"
            >
              Search
            </button>
          </div>

        </form>

        {/* Quick Filter Checkboxes */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={hasEv}
              onChange={(e) => setHasEv(e.target.checked)}
              className="rounded-md text-brand-600 focus:ring-brand-500"
            />
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              EV Supercharging
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={hasCovered}
              onChange={(e) => setHasCovered(e.target.checked)}
              className="rounded-md text-brand-600 focus:ring-brand-500"
            />
            <span>Covered Basement</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={hasAccessible}
              onChange={(e) => setHasAccessible(e.target.checked)}
              className="rounded-md text-brand-600 focus:ring-brand-500"
            />
            <span>Accessible Ramps</span>
          </label>

          <div className="flex items-center gap-2 ml-auto text-slate-500 text-[11px]">
            <span>Max Price: ₹{maxPrice}/hr</span>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-24 accent-brand-600 cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* Main Split Layout: Cards on Left, Live Map on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Facilities List */}
        <div className="lg:col-span-6 space-y-4 max-h-[750px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>Found {facilities.length} parking facilities</span>
            <span>Sorted by {sortBy.replace('_', ' ')}</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-slate-100 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : facilities.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-800">No parking facilities matched your criteria</div>
              <p className="text-xs text-slate-500">
                Try expanding your price range or clearing EV / covered parking filters.
              </p>
              <button
                onClick={() => {
                  setMaxPrice(100);
                  setHasEv(false);
                  setHasCovered(false);
                  setHasAccessible(false);
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            facilities.map((fac) => {
              const isSelected = selectedFacility?.id === fac.id;
              return (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac)}
                  className={`bg-white rounded-3xl border p-4 transition-all cursor-pointer flex flex-col sm:flex-row gap-4 ${
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-400/30 shadow-md bg-brand-50/10'
                      : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <img
                    src={fac.image_url}
                    alt={fac.name}
                    className="w-full sm:w-36 h-36 object-cover rounded-2xl shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                          {fac.name}
                        </h3>
                        <span className="text-amber-500 font-extrabold text-xs flex items-center gap-0.5 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{fac.avg_rating}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{fac.address}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-bold text-slate-800">
                        {fac.distanceFormatted} away
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>~{fac.travelTimeMinutes} mins driving</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <div className="font-extrabold text-brand-600 text-sm">
                          ₹{fac.hourly_rate} <span className="text-slate-400 font-medium text-[10px]">/ hr</span>
                        </div>
                        <span className={`text-[10px] font-bold ${
                          fac.availableSlots > 5
                            ? 'text-emerald-700'
                            : fac.availableSlots > 0
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}>
                          {fac.availableSlots > 0 ? `🟢 ${fac.availableSlots} bays available` : '🔴 Full (Waitlist)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open Google Maps Turn-by-Turn Navigation"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <Navigation className="w-4 h-4" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFacility(fac);
                          }}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                        >
                          Reserve Slot
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live Interactive Map */}
        <div className="lg:col-span-6 sticky top-20">
          <MapComponent
            facilities={facilities}
            userLocation={currentLocation}
            selectedFacility={selectedFacility}
            onSelectFacility={(fac) => {
              setSelectedFacility(fac);
              onSelectFacility(fac);
            }}
            height="700px"
          />
        </div>

      </div>

    </div>
  );
}
