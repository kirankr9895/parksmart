import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const LocationContext = createContext(null);

// Default coordinates: Central Bengaluru (MG Road)
export const DEFAULT_LOCATION = {
  lat: 12.9754,
  lng: 77.6066,
  label: 'MG Road Metro, Central Bengaluru',
  locality: 'MG Road'
};

export const POPULAR_LOCATIONS = [
  { label: 'MG Road Central', lat: 12.9754, lng: 77.6066, locality: 'MG Road' },
  { label: 'Indiranagar 100ft', lat: 12.9716, lng: 77.6412, locality: 'Indiranagar' },
  { label: 'Phoenix Marketcity', lat: 12.9975, lng: 77.6967, locality: 'Whitefield' },
  { label: 'Forum South Mall', lat: 12.8893, lng: 77.5678, locality: 'Kanakapura Rd' },
  { label: 'Electronic City Ph 1', lat: 12.8452, lng: 77.6602, locality: 'Electronic City' }
];

export function LocationProvider({ children }) {
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [isLiveGpsActive, setIsLiveGpsActive] = useState(false);

  /**
   * Request live real-time GPS location from browser
   */
  async function requestCurrentGpsLocation() {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode to get human readable address
          const res = await api.geo.reverse(latitude, longitude);
          const addressLabel = res.address
            ? res.address.split(',').slice(0, 3).join(', ')
            : `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

          setCurrentLocation({
            lat: latitude,
            lng: longitude,
            label: addressLabel,
            locality: res.details?.suburb || res.details?.city || 'My Location'
          });
          setIsLiveGpsActive(true);
        } catch (err) {
          setCurrentLocation({
            lat: latitude,
            lng: longitude,
            label: `My Current Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
            locality: 'Current Location'
          });
          setIsLiveGpsActive(true);
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setGpsError('Could not get GPS coordinates. Using central Bengaluru default.');
        setIsDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function setCustomLocation(loc) {
    setCurrentLocation(loc);
    setIsLiveGpsActive(false);
    setGpsError(null);
  }

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        isDetectingGps,
        gpsError,
        isLiveGpsActive,
        requestCurrentGpsLocation,
        setCustomLocation,
        popularLocations: POPULAR_LOCATIONS
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
