import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Get user vehicles
 * GET /api/vehicles
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const vehicles = db.query(
      'SELECT * FROM vehicles WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, vehicles });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch vehicles.' });
  }
});

/**
 * Add a new vehicle
 * POST /api/vehicles
 */
router.post('/', requireAuth, (req, res) => {
  try {
    const { vehicle_number, vehicle_type = 'car', model_name, is_primary = false } = req.body;

    if (!vehicle_number) {
      return res.status(400).json({ success: false, error: 'Vehicle registration number is required.' });
    }

    const vehicleId = `veh_${uuidv4().slice(0, 8)}`;
    const formattedReg = vehicle_number.trim().toUpperCase();

    // If marked primary, unset other primaries
    if (is_primary) {
      db.run('UPDATE vehicles SET is_primary = 0 WHERE user_id = ?', [req.user.id]);
    }

    db.run(
      `INSERT INTO vehicles (id, user_id, vehicle_number, vehicle_type, model_name, is_primary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [vehicleId, req.user.id, formattedReg, vehicle_type, model_name || null, is_primary ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully.',
      vehicle: {
        id: vehicleId,
        vehicle_number: formattedReg,
        vehicle_type,
        model_name,
        is_primary: is_primary ? 1 : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add vehicle.' });
  }
});

/**
 * Delete a vehicle
 * DELETE /api/vehicles/:id
 */
router.delete('/:id', requireAuth, (req, res) => {
  try {
    db.run('DELETE FROM vehicles WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Vehicle removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete vehicle.' });
  }
});

export default router;
