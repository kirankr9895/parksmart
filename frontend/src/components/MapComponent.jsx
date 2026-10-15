import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Clock, Zap, ShieldCheck } from 'lucide-react';

/**
 * Controller to smoothly pan/zoom map when user location or selected facility changes
 */
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * Custom HTML DivIcon for Parking Location Markers
 */
function createParkingIcon(facility, isSelected) {
  const isLowAvailability = facility.availableSlots <= 3;
  const isFull = facility.availableSlots === 0;

  const bgColor = isFull
    ? 'bg-rose-600'
    : isLowAvailability
    ? 'bg-amber-500'
    : isSelected
    ? 'bg-brand-600 ring-4 ring-brand-300'
    : 'bg-slate-900';

  const html = `
    <div class="relative group cursor-pointer">
      <div class="${bgColor} text-white font-extrabold text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1 border-2 border-white transform transition-transform group-hover:scale-110">
        <span>₹${facility.hourly_rate}</span>
        ${facility.has_ev_charging ? '<span class="text-amber-300 text-[10px]">⚡</span>' : ''}
      </div>
      <div class="w-2 h-2 ${bgColor} rotate-45 mx-auto -mt-1 shadow-xs"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-parking-marker',
    html,
    iconSize: [60, 30],
    iconAnchor: [30, 28],
    popupAnchor: [0, -28]
  });
}

/**
 * Custom HTML DivIcon for Current User GPS Position
 */
function createUserGpsIcon() {
  const html = `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 rounded-full bg-sky-500/30 user-gps-pulse"></div>
      <div class="w-4 h-4 rounded-full bg-sky-600 border-2 border-white shadow-md"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-user-gps-marker',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

export default function MapComponent({
  facilities = [],
  userLocation,
  selectedFacility,
  onSelectFacility,
  height = '500px'
}) {
  const centerLat = selectedFacility?.latitude || userLocation?.lat || 12.9716;
  const centerLng = selectedFacility?.longitude || userLocation?.lng || 77.5946;

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md relative" style={{ height }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController center={[centerLat, centerLng]} zoom={selectedFacility ? 15 : 13} />

        {/* High-quality OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User GPS Location Marker */}
        {userLocation && userLocation.lat && userLocation.lng && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserGpsIcon()}>
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-sky-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    Your Current Location
                  </div>
                  <div className="text-slate-600 mt-1">{userLocation.label || 'Bengaluru, Karnataka'}</div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={800}
              pathOptions={{ fillColor: '#0284c7', fillOpacity: 0.08, stroke: true, color: '#0284c7', weight: 1, dashArray: '4, 4' }}
            />
          </>
        )}

        {/* Parking Facilities Markers */}
        {facilities.map((fac) => {
          const isSelected = selectedFacility?.id === fac.id;
          return (
            <Marker
              key={fac.id}
              position={[fac.latitude, fac.longitude]}
              icon={createParkingIcon(fac, isSelected)}
              eventHandlers={{
                click: () => onSelectFacility && onSelectFacility(fac)
              }}
            >
              <Popup className="custom-leaflet-popup" maxWidth={320}>
                <div className="p-2 space-y-2">
                  <img
                    src={fac.image_url}
                    alt={fac.name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{fac.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{fac.address}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1 border-y border-slate-100">
                    <div className="flex items-center gap-1 text-brand-600 font-bold">
                      <span>₹{fac.hourly_rate}/hr</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{fac.travelTimeMinutes || 15} mins away</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${
                      fac.availableSlots > 5
                        ? 'bg-emerald-100 text-emerald-800'
                        : fac.availableSlots > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fac.availableSlots > 0 ? `${fac.availableSlots} slots left` : 'Full / Waitlist'}
                    </span>
                    <span className="text-amber-500 font-bold">★ {fac.avg_rating || 4.5}</span>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectFacility && onSelectFacility(fac)}
                      className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Reserve Now
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open Google Maps Turn-by-Turn Navigation"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg border border-slate-200 text-[11px] space-y-1">
        <div className="font-bold text-slate-700">Parking Availability</div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
          <span>Filling Fast (&le; 3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-600"></div>
          <span>Full</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-600"></div>
          <span>Your GPS Location</span>
        </div>
      </div>
    </div>
  );
}
