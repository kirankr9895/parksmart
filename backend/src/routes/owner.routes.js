import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Owner Dashboard Metrics & Real-Time Analytics
 * GET /api/owner/dashboard
 */
router.get('/dashboard', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  try {
    const ownerId = req.user.id;
    const { facility_id } = req.query;

    // Get owner's facilities
    let facilityCondition = 'f.owner_id = ?';
    const params = [ownerId];

    if (req.user.role === 'admin' && !facility_id) {
      facilityCondition = '1 = 1';
      params.length = 0;
    } else if (facility_id) {
      facilityCondition = 'f.id = ?';
      params.length = 0;
      params.push(facility_id);
    }

    const facilities = db.query(`SELECT * FROM parking_facilities f WHERE ${facilityCondition}`, params);
    const facilityIds = facilities.map((f) => f.id);

    if (facilityIds.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalSpaces: 0,
          availableSpaces: 0,
          occupiedSpaces: 0,
          reservedSpaces: 0,
          maintenanceSpaces: 0,
          todayRevenue: 0,
          monthlyRevenue: 0
        },
        facilities: [],
        occupancyChart: [],
        liveSessions: [],
        upcomingBookings: []
      });
    }

    const placeholders = facilityIds.map(() => '?').join(',');

    // 1. Slot distribution
    const allSlots = db.query(
      `SELECT id, facility_id, is_maintenance FROM parking_slots WHERE facility_id IN (${placeholders})`,
      facilityIds
    );
    const totalSpaces = allSlots.length;
    const maintenanceSpaces = allSlots.filter((s) => s.is_maintenance === 1).length;

    // Active checked in
    const occupiedRows = db.query(
      `SELECT slot_id FROM reservations 
       WHERE facility_id IN (${placeholders}) AND status = 'checked_in'`,
      facilityIds
    );
    const occupiedSpaces = occupiedRows.length;

    // Upcoming reserved
    const nowIso = new Date().toISOString();
    const reservedRows = db.query(
      `SELECT slot_id FROM reservations 
       WHERE facility_id IN (${placeholders}) AND status = 'confirmed' AND end_time > ?`,
      [...facilityIds, nowIso]
    );
    const reservedSpaces = reservedRows.length;

    const availableSpaces = Math.max(0, totalSpaces - maintenanceSpaces - occupiedSpaces - reservedSpaces);

    // 2. Revenue calculations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const todayRevRow = db.get(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM reservations
       WHERE facility_id IN (${placeholders}) 
         AND status IN ('confirmed', 'checked_in', 'completed')
         AND created_at >= ?`,
      [...facilityIds, todayStart.toISOString()]
    );
    const todayRevenue = Math.round(todayRevRow ? todayRevRow.total : 0);

    const monthRevRow = db.get(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM reservations
       WHERE facility_id IN (${placeholders}) 
         AND status IN ('confirmed', 'checked_in', 'completed')
         AND created_at >= ?`,
      [...facilityIds, monthStart.toISOString()]
    );
    const monthlyRevenue = Math.round(monthRevRow ? monthRevRow.total : 0);

    // 3. Occupancy Chart Data (simulated realistic curve per hour for peak visualization)
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const occupancyChart = hours.map((hour, idx) => {
      const multipliers = [0.25, 0.55, 0.85, 0.78, 0.82, 0.95, 0.90, 0.45];
      const occPercent = Math.min(100, Math.round(multipliers[idx] * 100));
      const occupied = Math.round((totalSpaces || 50) * multipliers[idx]);
      const revenue = Math.round(occupied * 40 * 1.5);
      return {
        time: hour,
        occupancy: occPercent,
        occupiedSlots: occupied,
        revenue
      };
    });

    // 4. Live Sessions (currently parked)
    const liveSessions = db.query(
      `SELECT r.*, f.name as facility_name, s.slot_number, s.floor, u.name as customer_name, u.phone as customer_phone
       FROM reservations r
       JOIN parking_facilities f ON r.facility_id = f.id
       JOIN parking_slots s ON r.slot_id = s.id
       JOIN users u ON r.user_id = u.id
       WHERE r.facility_id IN (${placeholders}) AND r.status = 'checked_in'
       ORDER BY r.check_in_time DESC`,
      facilityIds
    );

    // 5. Upcoming bookings
    const upcomingBookings = db.query(
      `SELECT r.*, f.name as facility_name, s.slot_number, s.floor, u.name as customer_name, u.phone as customer_phone
       FROM reservations r
       JOIN parking_facilities f ON r.facility_id = f.id
       JOIN parking_slots s ON r.slot_id = s.id
       JOIN users u ON r.user_id = u.id
       WHERE r.facility_id IN (${placeholders}) AND r.status = 'confirmed'
       ORDER BY r.start_time ASC LIMIT 10`,
      facilityIds
    );

    res.json({
      success: true,
      summary: {
        totalSpaces,
        availableSpaces,
        occupiedSpaces,
        reservedSpaces,
        maintenanceSpaces,
        todayRevenue,
        monthlyRevenue
      },
      facilities,
      occupancyChart,
      liveSessions,
      upcomingBookings
    });
  } catch (err) {
    console.error('Owner dashboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch owner dashboard metrics.' });
  }
});

/**
 * List facilities owned by user
 * GET /api/owner/facilities
 */
router.get('/facilities', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  try {
    const facilities = db.query(
      `SELECT f.*, COUNT(s.id) as slot_count 
       FROM parking_facilities f
       LEFT JOIN parking_slots s ON f.id = s.facility_id
       WHERE f.owner_id = ?
       GROUP BY f.id`,
      [req.user.id]
    );

    res.json({ success: true, facilities });
  } catch (err) {
    console.error('Error fetching owner facilities:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch facilities.' });
  }
});

/**
 * Register a new facility
 * POST /api/owner/facilities
 */
router.post('/facilities', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city = 'Bengaluru',
      locality,
      latitude,
      longitude,
      total_slots = 30,
      hourly_rate = 40,
      daily_rate = 350,
      ev_rate = 70,
      has_ev_charging = 1,
      has_covered_parking = 1,
      has_disabled_access = 1,
      has_valet = 0,
      image_url
    } = req.body;

    if (!name || !address || !locality || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Name, address, locality, latitude, and longitude are required.'
      });
    }

    const facilityId = `fac_${uuidv4().slice(0, 8)}`;
    const img =
      image_url ||
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80';

    db.run(
      `INSERT INTO parking_facilities (
        id, owner_id, name, description, address, city, locality, latitude, longitude,
        total_slots, hourly_rate, daily_rate, ev_rate, has_ev_charging, has_covered_parking,
        has_disabled_access, has_valet, is_approved, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        facilityId,
        req.user.id,
        name.trim(),
        description || '',
        address.trim(),
        city,
        locality.trim(),
        parseFloat(latitude),
        parseFloat(longitude),
        parseInt(total_slots),
        parseFloat(hourly_rate),
        parseFloat(daily_rate),
        parseFloat(ev_rate),
        has_ev_charging ? 1 : 0,
        has_covered_parking ? 1 : 0,
        has_disabled_access ? 1 : 0,
        has_valet ? 1 : 0,
        1, // auto-approve for demonstration
        img
      ]
    );

    // Auto-create initial slots
    const initialSlotCount = Math.min(20, parseInt(total_slots));
    for (let i = 1; i <= initialSlotCount; i++) {
      let type = 'standard_car';
      let isEv = 0;
      if (i <= 3 && has_ev_charging) {
        type = 'ev_car';
        isEv = 1;
      } else if (i === 4) {
        type = 'accessible';
      } else if (i > 15) {
        type = 'two_wheeler';
      }

      db.run(
        `INSERT INTO parking_slots (id, facility_id, slot_number, floor, slot_type, is_ev_equipped, is_maintenance)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`slot_${facilityId}_S${i}`, facilityId, `S${i}`, 'Ground', type, isEv, 0]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Parking facility registered successfully!',
      facilityId
    });
  } catch (err) {
    console.error('Error creating facility:', err);
    res.status(500).json({ success: false, error: 'Failed to create facility.' });
  }
});

/**
 * Toggle slot maintenance status
 * PATCH /api/owner/slots/:slotId/toggle-maintenance
 */
router.patch('/slots/:slotId/toggle-maintenance', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = db.get('SELECT * FROM parking_slots WHERE id = ?', [slotId]);
    if (!slot) {
      return res.status(404).json({ success: false, error: 'Slot not found.' });
    }

    const newStatus = slot.is_maintenance === 1 ? 0 : 1;
    db.run('UPDATE parking_slots SET is_maintenance = ? WHERE id = ?', [newStatus, slotId]);

    res.json({
      success: true,
      message: `Slot ${slot.slot_number} marked as ${newStatus === 1 ? 'Under Maintenance' : 'Active & Available'}.`,
      is_maintenance: newStatus
    });
  } catch (err) {
    console.error('Error toggling maintenance:', err);
    res.status(500).json({ success: false, error: 'Failed to update slot status.' });
  }
});

export default router;
