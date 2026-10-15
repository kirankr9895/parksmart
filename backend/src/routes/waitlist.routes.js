import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Join waitlist for full parking facility
 * POST /api/waitlist
 */
router.post('/', requireAuth, (req, res) => {
  try {
    const { facility_id, vehicle_type = 'car', desired_start_time, desired_end_time } = req.body;

    if (!facility_id || !desired_start_time || !desired_end_time) {
      return res.status(400).json({
        success: false,
        error: 'facility_id, desired_start_time, and desired_end_time are required.'
      });
    }

    const waitlistId = `wt_${uuidv4().slice(0, 8)}`;
    db.run(
      `INSERT INTO waitlist_entries (id, user_id, facility_id, vehicle_type, desired_start_time, desired_end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [waitlistId, req.user.id, facility_id, vehicle_type, desired_start_time, desired_end_time, 'waiting']
    );

    // Calculate queue position
    const position = db.get(
      `SELECT COUNT(*) as count FROM waitlist_entries 
       WHERE facility_id = ? AND status = 'waiting'`,
      [facility_id]
    ).count;

    res.status(201).json({
      success: true,
      message: `You have joined the waitlist at position #${position}! We will notify you when a slot frees up.`,
      waitlistId,
      queuePosition: position
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to join waitlist.' });
  }
});

/**
 * Get user waitlist entries
 * GET /api/waitlist
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const list = db.query(
      `SELECT w.*, f.name as facility_name, f.address as facility_address
       FROM waitlist_entries w
       JOIN parking_facilities f ON w.facility_id = f.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, waitlist: list });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch waitlist.' });
  }
});

export default router;
