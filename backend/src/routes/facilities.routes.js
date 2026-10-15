import express from 'express';
import db from '../db/database.js';
import { calculateHaversineDistance, formatDistance, estimateTravelTimeMinutes } from '../utils/geo.js';

const router = express.Router();

// Default coordinates: Central Bengaluru (MG Road / Brigade Rd)
const DEFAULT_BENGALURU_LAT = 12.9716;
const DEFAULT_BENGALURU_LNG = 77.5946;

/**
 * Helper to get available slot count for a facility in a given time interval
 */
function getAvailabilityForFacility(facilityId, startTime, endTime, vehicleType = null) {
  let slotTypeFilter = '';
  const params = [facilityId, endTime, startTime];

  if (vehicleType) {
    if (vehicleType === 'bike') {
      slotTypeFilter = " AND slot_type = 'two_wheeler'";
    } else if (vehicleType === 'suv') {
      slotTypeFilter = " AND slot_type IN ('suv', 'standard_car')";
    } else if (vehicleType === 'ev_car') {
      slotTypeFilter = " AND (is_ev_equipped = 1 OR slot_type = 'ev_car')";
    }
  }

  // Total active non-maintenance slots
  const totalSlotsRow = db.get(
    `SELECT COUNT(*) as count FROM parking_slots 
     WHERE facility_id = ? AND is_maintenance = 0 ${slotTypeFilter}`,
    [facilityId]
  );
  const totalSlots = totalSlotsRow ? totalSlotsRow.count : 0;

  // Occupied/reserved slots during the time window
  const reservedSlotsRow = db.get(
    `SELECT COUNT(DISTINCT slot_id) as count FROM reservations
     WHERE facility_id = ?
       AND status IN ('confirmed', 'checked_in', 'pending')
       AND start_time < ? AND end_time > ?
       AND slot_id IN (
         SELECT id FROM parking_slots 
         WHERE facility_id = ? AND is_maintenance = 0 ${slotTypeFilter}
       )`,
    [facilityId, endTime, startTime, facilityId]
  );
  const reservedSlots = reservedSlotsRow ? reservedSlotsRow.count : 0;
  const availableSlots = Math.max(0, totalSlots - reservedSlots);

  return {
    totalSlots,
    reservedSlots,
    availableSlots
  };
}

/**
 * Search and list parking facilities
 * GET /api/facilities
 */
router.get('/', (req, res) => {
  try {
    const {
      lat,
      lng,
      query: searchQuery,
      vehicle_type = 'car',
      start_time,
      end_time,
      has_ev,
      has_covered,
      has_accessible,
      max_price,
      min_rating,
      sort_by = 'smart_recommended'
    } = req.query;

    const userLat = lat ? parseFloat(lat) : DEFAULT_BENGALURU_LAT;
    const userLng = lng ? parseFloat(lng) : DEFAULT_BENGALURU_LNG;

    const now = new Date();
    const effectiveStart = start_time || now.toISOString();
    const effectiveEnd =
      end_time || new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

    // Fetch approved facilities with owner details and rating aggregates
    let sql = `
      SELECT 
        f.*,
        u.name as owner_name,
        COALESCE(AVG(r.rating), 4.5) as avg_rating,
        COUNT(r.id) as review_count
      FROM parking_facilities f
      JOIN users u ON f.owner_id = u.id
      LEFT JOIN reviews r ON f.id = r.facility_id
      WHERE f.is_approved = 1
    `;
    const params = [];

    if (searchQuery && searchQuery.trim()) {
      sql += ` AND (f.name LIKE ? OR f.locality LIKE ? OR f.address LIKE ? OR f.city LIKE ?)`;
      const term = `%${searchQuery.trim()}%`;
      params.push(term, term, term, term);
    }

    if (has_ev === 'true' || has_ev === '1') {
      sql += ` AND f.has_ev_charging = 1`;
    }

    if (has_covered === 'true' || has_covered === '1') {
      sql += ` AND f.has_covered_parking = 1`;
    }

    if (has_accessible === 'true' || has_accessible === '1') {
      sql += ` AND f.has_disabled_access = 1`;
    }

    if (max_price) {
      sql += ` AND f.hourly_rate <= ?`;
      params.push(parseFloat(max_price));
    }

    sql += ` GROUP BY f.id`;

    if (min_rating) {
      sql += ` HAVING avg_rating >= ?`;
      params.push(parseFloat(min_rating));
    }

    const facilities = db.query(sql, params);

    // Compute live distance, travel time, slot availability, and smart scores
    const enriched = facilities.map((fac) => {
      const distanceKm = calculateHaversineDistance(
        userLat,
        userLng,
        fac.latitude,
        fac.longitude
      );
      const travelTimeMinutes = estimateTravelTimeMinutes(distanceKm);
      const distanceFormatted = formatDistance(distanceKm);

      const availability = getAvailabilityForFacility(
        fac.id,
        effectiveStart,
        effectiveEnd,
        vehicle_type
      );

      // Duration in hours
      const diffMs = Math.max(
        1800000,
        new Date(effectiveEnd) - new Date(effectiveStart)
      );
      const durationHours = Math.ceil(diffMs / (1000 * 60 * 60));
      const estimatedCost = Math.round(fac.hourly_rate * durationHours);

      // Smart recommendation score (normalized 0 to 100)
      // Closer distance (+), Lower price (+), High rating (+), High availability (+)
      const distScore = Math.max(0, 10 - distanceKm * 0.5); // 0-10
      const priceScore = Math.max(0, 10 - fac.hourly_rate * 0.15); // 0-10
      const ratingScore = (fac.avg_rating || 4.0) * 2; // 0-10
      const availRatio =
        availability.totalSlots > 0
          ? availability.availableSlots / availability.totalSlots
          : 0;
      const availScore = availRatio * 10;

      const smartScore =
        distScore * 3.5 + priceScore * 2.5 + ratingScore * 2.5 + availScore * 1.5;

      return {
        ...fac,
        avg_rating: Number(Number(fac.avg_rating).toFixed(1)),
        distanceKm: Number(distanceKm.toFixed(2)),
        distanceFormatted,
        travelTimeMinutes,
        availableSlots: availability.availableSlots,
        totalSlots: availability.totalSlots,
        occupancyRate:
          availability.totalSlots > 0
            ? Math.round(
                ((availability.totalSlots - availability.availableSlots) /
                  availability.totalSlots) *
                  100
              )
            : 0,
        estimatedCost,
        smartScore: Math.round(smartScore)
      };
    });

    // Apply Sorting
    enriched.sort((a, b) => {
      if (sort_by === 'lowest_price') {
        return a.hourly_rate - b.hourly_rate;
      } else if (sort_by === 'shortest_distance') {
        return a.distanceKm - b.distanceKm;
      } else if (sort_by === 'highest_availability') {
        return b.availableSlots - a.availableSlots;
      } else if (sort_by === 'best_rating') {
        return b.avg_rating - a.avg_rating;
      } else {
        // smart_recommended
        return b.smartScore - a.smartScore;
      }
    });

    res.json({
      success: true,
      count: enriched.length,
      userLocation: { lat: userLat, lng: userLng },
      timeInterval: { start: effectiveStart, end: effectiveEnd },
      facilities: enriched
    });
  } catch (err) {
    console.error('Error fetching facilities:', err);
    res.status(500).json({ success: false, error: 'Failed to search parking facilities.' });
  }
});

/**
 * Get facility details by ID
 * GET /api/facilities/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, lat, lng } = req.query;

    const fac = db.get(
      `SELECT f.*, u.name as owner_name, u.phone as owner_phone,
              COALESCE(AVG(r.rating), 4.6) as avg_rating,
              COUNT(r.id) as review_count
       FROM parking_facilities f
       JOIN users u ON f.owner_id = u.id
       LEFT JOIN reviews r ON f.id = r.facility_id
       WHERE f.id = ?
       GROUP BY f.id`,
      [id]
    );

    if (!fac) {
      return res.status(404).json({ success: false, error: 'Parking facility not found.' });
    }

    const now = new Date();
    const effectiveStart = start_time || now.toISOString();
    const effectiveEnd =
      end_time || new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

    const availability = getAvailabilityForFacility(fac.id, effectiveStart, effectiveEnd);

    // Calculate distance if lat/lng passed
    let distanceKm = null;
    let distanceFormatted = null;
    let travelTimeMinutes = null;
    if (lat && lng) {
      distanceKm = calculateHaversineDistance(parseFloat(lat), parseFloat(lng), fac.latitude, fac.longitude);
      distanceFormatted = formatDistance(distanceKm);
      travelTimeMinutes = estimateTravelTimeMinutes(distanceKm);
    }

    // Pricing rules
    const pricingRules = db.query('SELECT * FROM pricing_rules WHERE facility_id = ?', [id]);

    // Reviews with user names
    const reviews = db.query(
      `SELECT r.*, u.name as author_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.facility_id = ? 
       ORDER BY r.created_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      facility: {
        ...fac,
        avg_rating: Number(Number(fac.avg_rating).toFixed(1)),
        distanceKm,
        distanceFormatted,
        travelTimeMinutes,
        availableSlots: availability.availableSlots,
        totalSlots: availability.totalSlots,
        pricingRules,
        reviews
      }
    });
  } catch (err) {
    console.error('Error fetching facility details:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch facility details.' });
  }
});

/**
 * Get individual slot layout and status for a facility
 * GET /api/facilities/:id/slots
 */
router.get('/:id/slots', (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, vehicle_type } = req.query;

    const now = new Date();
    const effectiveStart = start_time || now.toISOString();
    const effectiveEnd =
      end_time || new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

    const allSlots = db.query(
      `SELECT * FROM parking_slots WHERE facility_id = ? ORDER BY floor ASC, slot_number ASC`,
      [id]
    );

    // Active or upcoming reservations overlapping this window
    const activeReservations = db.query(
      `SELECT slot_id, status, start_time, end_time, booking_reference
       FROM reservations
       WHERE facility_id = ?
         AND status IN ('confirmed', 'checked_in', 'pending')
         AND start_time < ? AND end_time > ?`,
      [id, effectiveEnd, effectiveStart]
    );

    const reservationMap = new Map();
    for (const r of activeReservations) {
      reservationMap.set(r.slot_id, r);
    }

    const slotsWithStatus = allSlots.map((slot) => {
      let slotStatus = 'available';
      let activeReservationInfo = null;

      if (slot.is_maintenance === 1) {
        slotStatus = 'maintenance';
      } else if (reservationMap.has(slot.id)) {
        const resv = reservationMap.get(slot.id);
        slotStatus = resv.status === 'checked_in' ? 'occupied' : 'reserved';
        activeReservationInfo = {
          bookingReference: resv.booking_reference,
          startTime: resv.start_time,
          endTime: resv.end_time
        };
      }

      // Check vehicle type compatibility
      let isCompatible = true;
      if (vehicle_type) {
        if (vehicle_type === 'bike' && slot.slot_type !== 'two_wheeler') {
          isCompatible = false;
        } else if (vehicle_type === 'ev_car' && !slot.is_ev_equipped && slot.slot_type !== 'ev_car') {
          isCompatible = false;
        } else if (vehicle_type === 'suv' && !['suv', 'standard_car'].includes(slot.slot_type)) {
          isCompatible = false;
        }
      }

      return {
        ...slot,
        status: slotStatus,
        isCompatible,
        activeReservationInfo
      };
    });

    res.json({
      success: true,
      facilityId: id,
      timeInterval: { start: effectiveStart, end: effectiveEnd },
      slots: slotsWithStatus
    });
  } catch (err) {
    console.error('Error fetching facility slots:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch slots.' });
  }
});

export default router;
