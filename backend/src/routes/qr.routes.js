import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * QR Code verification endpoint for parking staff and barrier scanners
 * POST /api/qr/verify
 */
router.post('/verify', requireAuth, (req, res) => {
  try {
    const { qr_payload, booking_reference } = req.body;

    if (!qr_payload && !booking_reference) {
      return res.status(400).json({
        success: false,
        error: 'Please scan a valid QR code or enter a booking reference.'
      });
    }

    // Find reservation
    let resv = null;
    if (booking_reference) {
      resv = db.get(
        `SELECT r.*, f.name as facility_name, f.owner_id, s.slot_number, s.floor, u.name as customer_name, u.phone as customer_phone
         FROM reservations r
         JOIN parking_facilities f ON r.facility_id = f.id
         JOIN parking_slots s ON r.slot_id = s.id
         JOIN users u ON r.user_id = u.id
         WHERE r.booking_reference = ?`,
        [booking_reference.trim().toUpperCase()]
      );
    } else {
      resv = db.get(
        `SELECT r.*, f.name as facility_name, f.owner_id, s.slot_number, s.floor, u.name as customer_name, u.phone as customer_phone
         FROM reservations r
         JOIN parking_facilities f ON r.facility_id = f.id
         JOIN parking_slots s ON r.slot_id = s.id
         JOIN users u ON r.user_id = u.id
         WHERE r.qr_token = ? OR r.booking_reference = ?`,
        [qr_payload.trim(), qr_payload.trim().toUpperCase()]
      );
    }

    if (!resv) {
      return res.status(404).json({
        success: false,
        verified: false,
        error: 'Invalid QR code. No active reservation found in the system.'
      });
    }

    // If caller is an owner, verify facility belongs to owner
    if (req.user.role === 'owner' && resv.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        verified: false,
        error: `Unauthorized: This reservation belongs to ${resv.facility_name}, not your registered facility.`
      });
    }

    const now = new Date();

    // 1. Check if already completed (Duplicate redemption prevention)
    if (resv.status === 'completed') {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Duplicate QR Redemption Denied: This booking pass has already completed check-out and exited.',
        reservation: resv
      });
    }

    // 2. Check if cancelled
    if (resv.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Access Denied: This reservation was previously cancelled.',
        reservation: resv
      });
    }

    // 3. Entry Gate Check-In Workflow
    if (resv.status === 'confirmed' || resv.status === 'pending') {
      const startTime = new Date(resv.start_time);
      const hoursEarly = (startTime - now) / (1000 * 60 * 60);

      // Early arrival guard
      if (hoursEarly > 3) {
        return res.status(400).json({
          success: false,
          verified: false,
          error: `Too early for check-in. Reservation start time is ${startTime.toLocaleTimeString()}. You can enter up to 3 hours in advance.`
        });
      }

      db.run(
        `UPDATE reservations 
         SET status = 'checked_in', check_in_time = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [resv.id]
      );

      // Audit log
      db.run(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `aud_${uuidv4().slice(0, 8)}`,
          req.user.id,
          'QR_ENTRY_VERIFIED',
          'reservation',
          resv.id,
          `Vehicle ${resv.vehicle_number} checked in to Slot ${resv.slot_number} (${resv.floor})`
        ]
      );

      return res.json({
        success: true,
        verified: true,
        action: 'CHECK_IN_SUCCESS',
        message: 'QR Code verified! Boom barrier opened. Welcome to ParkSmart.',
        gateStatus: 'OPEN',
        details: {
          bookingReference: resv.booking_reference,
          customerName: resv.customer_name,
          vehicleNumber: resv.vehicle_number,
          vehicleType: resv.vehicle_type,
          slotNumber: resv.slot_number,
          floor: resv.floor,
          checkInTime: now.toISOString(),
          facilityName: resv.facility_name
        }
      });
    }

    // 4. Exit Gate Check-Out Workflow
    if (resv.status === 'checked_in') {
      const endTime = new Date(resv.end_time);
      let overstayAmount = 0.0;
      let overstayMinutes = 0;

      if (now > endTime) {
        const diffMs = now - endTime;
        overstayMinutes = Math.round(diffMs / (1000 * 60));
        // Grace period 15 mins
        if (overstayMinutes > 15) {
          const overstayHours = Math.ceil(overstayMinutes / 60);
          overstayAmount = overstayHours * 50.0; // ₹50/hr overstay penalty
        }
      }

      const finalTotal = resv.total_amount + overstayAmount;

      db.run(
        `UPDATE reservations 
         SET status = 'completed', check_out_time = CURRENT_TIMESTAMP, 
             overstay_amount = ?, total_amount = ?
         WHERE id = ?`,
        [overstayAmount, finalTotal, resv.id]
      );

      // Audit log
      db.run(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `aud_${uuidv4().slice(0, 8)}`,
          req.user.id,
          'QR_EXIT_VERIFIED',
          'reservation',
          resv.id,
          `Vehicle ${resv.vehicle_number} exited. Overstay: ₹${overstayAmount}. Total bill: ₹${finalTotal}`
        ]
      );

      return res.json({
        success: true,
        verified: true,
        action: 'CHECK_OUT_SUCCESS',
        message: 'Vehicle exit verified. Thank you for parking with ParkSmart!',
        gateStatus: 'OPEN',
        details: {
          bookingReference: resv.booking_reference,
          customerName: resv.customer_name,
          vehicleNumber: resv.vehicle_number,
          slotNumber: resv.slot_number,
          checkOutTime: now.toISOString(),
          overstayMinutes,
          overstayAmount,
          finalTotal,
          paymentSettled: true
        }
      });
    }

    res.status(400).json({
      success: false,
      verified: false,
      error: `Reservation is currently in '${resv.status}' state.`
    });
  } catch (err) {
    console.error('QR verification error:', err);
    res.status(500).json({ success: false, error: 'QR verification process failed.' });
  }
});

export default router;
