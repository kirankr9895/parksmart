/**
 * Geo utilities for distance, travel time, and location services
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in kilometers
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (angle) => (angle * Math.PI) / 180.0;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Format distance in a human-friendly way (e.g. "350 m" or "2.4 km")
 * @param {number} distanceKm 
 * @returns {string}
 */
export function formatDistance(distanceKm) {
  if (distanceKm < 1.0) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Estimate driving travel time in minutes assuming realistic urban traffic (avg 22 km/h)
 * @param {number} distanceKm 
 * @returns {number} estimated travel time in minutes
 */
export function estimateTravelTimeMinutes(distanceKm) {
  const AVG_URBAN_SPEED_KMH = 22.0;
  const hours = distanceKm / AVG_URBAN_SPEED_KMH;
  const minutes = Math.max(2, Math.round(hours * 60));
  return minutes;
}
