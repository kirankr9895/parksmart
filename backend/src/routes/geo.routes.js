import express from 'express';

const router = express.Router();

// Fallback landmark database for instant offline/fast suggestions in Bengaluru
const BENGALURU_HOTSPOTS = [
  { name: 'Phoenix Marketcity, Whitefield', lat: 12.9975, lng: 77.6967, locality: 'Mahadevapura' },
  { name: 'Forum South Bengaluru, Konanakunte', lat: 12.8893, lng: 77.5678, locality: 'Kanakapura Road' },
  { name: 'Garuda Mall, Ashok Nagar / Brigade Rd', lat: 12.9702, lng: 77.6094, locality: 'Ashok Nagar' },
  { name: 'Indiranagar 100 Feet Road', lat: 12.9716, lng: 77.6412, locality: 'Indiranagar' },
  { name: 'MG Road Metro Station', lat: 12.9754, lng: 77.6066, locality: 'MG Road' },
  { name: 'Electronic City Phase 1', lat: 12.8452, lng: 77.6602, locality: 'Electronic City' },
  { name: 'Koramangala 5th Block', lat: 12.9352, lng: 77.6245, locality: 'Koramangala' },
  { name: 'Kempegowda International Airport (BLR)', lat: 13.1986, lng: 77.7066, locality: 'Devanahalli' },
  { name: 'Majestic Bus Stand / KSR Railway Station', lat: 12.9781, lng: 77.5694, locality: 'Majestic' }
];

/**
 * Real-time geocoding search via OpenStreetMap Nominatim with local fallback
 * GET /api/geo/search?q=...
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, results: BENGALURU_HOTSPOTS });
    }

    const term = q.trim().toLowerCase();

    // 1. Check local hotspots first for instantaneous match
    const localMatches = BENGALURU_HOTSPOTS.filter(
      (h) => h.name.toLowerCase().includes(term) || h.locality.toLowerCase().includes(term)
    );

    // 2. Fetch live OpenStreetMap Nominatim API
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q + ', Karnataka, India'
      )}&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ParkSmart-RealTime-Parking-System/1.0 (contact@parksmart.in)'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const osmResults = data.map((item) => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          locality: item.address?.suburb || item.address?.neighbourhood || item.address?.city || 'Bengaluru'
        }));

        // Merge unique results
        const combined = [...localMatches, ...osmResults];
        const unique = Array.from(new Map(combined.map((item) => [`${item.lat.toFixed(4)},${item.lng.toFixed(4)}`, item])).values());
        return res.json({ success: true, results: unique.slice(0, 8) });
      }
    } catch (fetchErr) {
      console.warn('OSM Nominatim API fetch error (using local fallback):', fetchErr.message);
    }

    // If external call failed or had no results, return local matches
    res.json({
      success: true,
      results: localMatches.length > 0 ? localMatches : BENGALURU_HOTSPOTS.slice(0, 5)
    });
  } catch (err) {
    console.error('Geo search error:', err);
    res.status(500).json({ success: false, error: 'Failed to search location.' });
  }
});

/**
 * Reverse geocode coordinates to human-readable address
 * GET /api/geo/reverse?lat=...&lng=...
 */
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'lat and lng parameters are required.' });
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ParkSmart-RealTime-Parking-System/1.0 (contact@parksmart.in)'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return res.json({
          success: true,
          address: data.display_name,
          details: data.address
        });
      }
    } catch (osmErr) {
      console.warn('Reverse geocode error, returning approximate:', osmErr.message);
    }

    res.json({
      success: true,
      address: `Current Location (${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})`,
      details: { city: 'Bengaluru' }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Reverse geocode failed.' });
  }
});

export default router;
