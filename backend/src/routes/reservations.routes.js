import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { generateQRCodeDataURL, buildQRToken } from '../utils/qr.js';

const router = express.Router();

/**
 * Helper to calculate price breakdown
 */
function calculateCostBreakdown({
  hourlyRate,
  durationHours,
  vehicleType = 'car',
  needsEv = false,
  couponCode = null
}) {
  let multiplier = 1.0;
  let evFee = 0.0;

  if (vehicleType === 'suv') multiplier = 1.25;
  if (vehicleType === 'bike') multiplier = 0.4;
  if (vehicleType === 'ev_car' || needsEv) {
    multiplier = 1.35;
    evFee = 40.0; // flat EV charging connection & power fee
  }

  const baseRate = hourlyRate * multiplier;
  const baseAmount = Math.round(baseRate * durationHours);

  // Coupons
  let discountAmount = 0.0;
  if (couponCode) {
    const code = couponCode.trim().toUpperCase();
    if (code === 'PARKSMART20') {
      discountAmount = Math.min(100, Math.round(baseAmount * 0.2));
    } else if (code === 'FIRSTPARK') {
      discountAmount = Math.min(50, Math.round(baseAmount * 0.5));
    }
  }

  const taxableAmount = Math.max(0, baseAmount + evFee - discountAmount);
  const taxAmount = Number((taxableAmount * 0.18).toFixed(2)); // 18% GST
  const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

  return {
    durationHours,
    hourlyRate: Math.round(baseRate),
    baseAmount,
    evFee,
    discountAmount,
    taxAmount,
    totalAmount
  };
}

/**
 * Estimate reservation cost
 * POST /api/reservations/estimate
 */
router.post('/estimate', (req, res) => {
  try {
    const { facility_id, vehicle_type = 'car', start_time, end_time, needs_ev, coupon_code } = req.body;

    if (!facility_id || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: 'facility_id, start_time, and end_time are required.' });
    }

    const fac = db.get('SELECT * FROM parking_facilities WHERE id = ?', [facility_id]);
    if (!fac) {
      return res.status(404).json({ success: false, error: 'Facility not found.' });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    const diffMs = end - start;

    if (diffMs <= 0) {
      return res.status(400).json({ success: false, error: 'End time must be after start time.' });
    }

    const durationHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    const breakdown = calculateCostBreakdown({
      hourlyRate: fac.hourly_rate,
      durationHours,
      vehicleType: vehicle_type,
      needsEv: Boolean(needs_ev),
      couponCode: coupon_code
    });

    res.json({
      success: true,
      facilityName: fac.name,
      currency: '₹',
      breakdown
    });
  } catch (err) {
    console.error('Error estimating cost:', err);
    res.status(500).json({ success: false, error: 'Failed to estimate cost.' });
  }
});

/**
 * Create a new advance reservation (with concurrency lock & anti-double booking transaction)
 * POST /api/reservations
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      facility_id,
      slot_id,
      vehicle_id,
      vehicle_number,
      vehicle_type = 'car',
      start_time,
      end_time,
      needs_ev = false,
      coupon_code,
      payment_method = 'upi'
    } = req.body;

    if (!facility_id || !start_time || !end_time || !vehicle_number) {
      return res.status(400).json({
        success: false,
        error: 'Missing required reservation fields (facility_id, start_time, end_time, vehicle_number).'
      });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    const diffMs = end - start;

    if (diffMs <= 0) {
      return res.status(400).json({ success: false, error: 'Reservation end time must be after start time.' });
    }

    const durationHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));

    const fac = db.get('SELECT * FROM parking_facilities WHERE id = ?', [facility_id]);
    if (!fac) {
      return res.status(404).json({ success: false, error: 'Parking facility not found.' });
    }

    // Atomic transaction for concurrency safety
    const bookingResult = db.transaction(() => {
      let chosenSlotId = slot_id;

      // Automatic slot allocation if not specified
      if (!chosenSlotId) {
        let typeCondition = "slot_type IN ('standard_car', 'suv')";
        if (vehicle_type === 'bike') typeCondition = "slot_type = 'two_wheeler'";
        if (vehicle_type === 'ev_car' || needs_ev) typeCondition = "is_ev_equipped = 1 OR slot_type = 'ev_car'";

        const candidateSlots = db.query(
          `SELECT id, slot_number FROM parking_slots 
           WHERE facility_id = ? AND is_maintenance = 0 AND (${typeCondition})
           ORDER BY floor ASC, slot_number ASC`,
          [facility_id]
        );

        // Find first slot without overlap
        for (const candidate of candidateSlots) {
          const overlap = db.get(
            `SELECT id FROM reservations 
             WHERE slot_id = ? 
               AND status IN ('confirmed', 'checked_in', 'pending')
               AND start_time < ? AND end_time > ?`,
            [candidate.id, end_time, start_time]
          );
          if (!overlap) {
            chosenSlotId = candidate.id;
            break;
          }
        }

        if (!chosenSlotId) {
          throw new Error('Sorry, no parking slots available for the selected vehicle and time interval. You may join the waitlist!');
        }
      } else {
        // Verify requested slot exists & is not in maintenance
        const slot = db.get('SELECT * FROM parking_slots WHERE id = ? AND facility_id = ?', [chosenSlotId, facility_id]);
        if (!slot) {
          throw new Error('Selected parking slot does not exist.');
        }
        if (slot.is_maintenance === 1) {
          throw new Error('Selected slot is currently temporarily unavailable for maintenance.');
        }

        // Concurrency check: overlapping reservations
        const existingOverlap = db.get(
          `SELECT id, booking_reference FROM reservations 
           WHERE slot_id = ? 
             AND status IN ('confirmed', 'checked_in', 'pending')
             AND start_time < ? AND end_time > ?`,
          [chosenSlotId, end_time, start_time]
        );

        if (existingOverlap) {
          throw new Error(`This slot is already reserved (Ref: ${existingOverlap.booking_reference}) for overlapping time. Please select another slot.`);
        }
      }

      // Slot details
      const selectedSlot = db.get('SELECT * FROM parking_slots WHERE id = ?', [chosenSlotId]);

      // Calculate fee
      const pricing = calculateCostBreakdown({
        hourlyRate: fac.hourly_rate,
        durationHours,
        vehicleType: vehicle_type,
        needsEv: Boolean(needs_ev) || selectedSlot.is_ev_equipped === 1,
        couponCode: coupon_code
      });

      const reservationId = `res_${uuidv4().slice(0, 8)}`;
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const bookingRef = `PK-${randomDigits}`;
      const qrToken = buildQRToken(bookingRef, reservationId, req.user.id);

      // Insert reservation
      db.run(
        `INSERT INTO reservations (
          id, booking_reference, user_id, facility_id, slot_id, vehicle_id, vehicle_number, vehicle_type,
          start_time, end_time, duration_hours, base_amount, discount_amount, tax_amount,
          total_amount, status, qr_token, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reservationId,
          bookingRef,
          req.user.id,
          facility_id,
          chosenSlotId,
          vehicle_id || null,
          vehicle_number.toUpperCase().trim(),
          vehicle_type,
          start_time,
          end_time,
          durationHours,
          pricing.baseAmount,
          pricing.discountAmount,
          pricing.taxAmount,
          pricing.totalAmount,
          'confirmed',
          qrToken,
          payment_method === 'cash' ? 'pay_on_arrival' : 'paid'
        ]
      );

      // Insert payment
      const paymentId = `pay_${uuidv4().slice(0, 8)}`;
      db.run(
        `INSERT INTO payments (id, reservation_id, user_id, amount, payment_method, gateway_payment_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentId,
          reservationId,
          req.user.id,
          pricing.totalAmount,
          payment_method,
          `rzp_mock_${randomDigits}`,
          'success'
        ]
      );

      // Log audit
      db.run(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `aud_${uuidv4().slice(0, 8)}`,
          req.user.id,
          'RESERVATION_CREATED',
          'reservation',
          reservationId,
          `Booked slot ${selectedSlot.slot_number} at ${fac.name} for ₹${pricing.totalAmount}`
        ]
      );

      return {
        reservationId,
        bookingRef,
        slotNumber: selectedSlot.slot_number,
        floor: selectedSlot.floor,
        qrToken,
        pricing,
        facilityName: fac.name,
        facilityAddress: fac.address
      };
    });

    // Generate high-res QR code image data URL
    const qrCodeDataUrl = await generateQRCodeDataURL(bookingResult.qrToken);

    res.status(201).json({
      success: true,
      message: 'Slot successfully reserved! Your booking pass is confirmed.',
      reservation: {
        ...bookingResult,
        qrCodeImage: qrCodeDataUrl
      }
    });
  } catch (err) {
    console.error('Reservation creation error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * Get current user bookings with live countdowns
 * GET /api/reservations/my
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    const reservations = db.query(
      `SELECT 
        r.*,
        f.name as facility_name,
        f.address as facility_address,
        f.latitude as facility_latitude,
        f.longitude as facility_longitude,
        f.has_ev_charging,
        s.slot_number,
        s.floor as slot_floor,
        s.slot_type
       FROM reservations r
       JOIN parking_facilities f ON r.facility_id = f.id
       JOIN parking_slots s ON r.slot_id = s.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    const now = new Date();

    const formatted = await Promise.all(
      reservations.map(async (resv) => {
        const start = new Date(resv.start_time);
        const end = new Date(resv.end_time);

        let countdown = null;
        let isSessionActive = false;
        let isOverdue = false;

        if (resv.status === 'confirmed') {
          const diffMinutes = Math.round((start - now) / (1000 * 60));
          if (diffMinutes > 0) {
            countdown = {
              type: 'starts_in',
              minutes: diffMinutes,
              label: `Starts in ${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`
            };
          } else {
            countdown = {
              type: 'ready_now',
              minutes: 0,
              label: 'Slot Ready Now - Please Arrive'
            };
          }
        } else if (resv.status === 'checked_in') {
          isSessionActive = true;
          const diffRemaining = Math.round((end - now) / (1000 * 60));
          if (diffRemaining > 0) {
            countdown = {
              type: 'time_remaining',
              minutes: diffRemaining,
              label: `${Math.floor(diffRemaining / 60)}h ${diffRemaining % 60}m remaining`
            };
          } else {
            isOverdue = true;
            const overstayMins = Math.abs(diffRemaining);
            countdown = {
              type: 'overstay',
              minutes: overstayMins,
              label: `Overstaying by ${Math.floor(overstayMins / 60)}h ${overstayMins % 60}m`
            };
          }
        }

        // Generate QR on demand
        let qrCodeImage = null;
        if (['confirmed', 'checked_in'].includes(resv.status)) {
          qrCodeImage = await generateQRCodeDataURL(resv.qr_token);
        }

        return {
          ...resv,
          countdown,
          isSessionActive,
          isOverdue,
          qrCodeImage
        };
      })
    );

    res.json({
      success: true,
      reservations: formatted
    });
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings.' });
  }
});

/**
 * Cancel reservation
 * POST /api/reservations/:id/cancel
 */
router.post('/:id/cancel', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Plans changed' } = req.body;

    const resv = db.get('SELECT * FROM reservations WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!resv) {
      return res.status(404).json({ success: false, error: 'Reservation not found.' });
    }

    if (resv.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel booking with status '${resv.status}'. Only confirmed upcoming bookings can be cancelled.`
      });
    }

    const now = new Date();
    const start = new Date(resv.start_time);
    const hoursToStart = (start - now) / (1000 * 60 * 60);

    let refundPercent = 0.9; // 90% default refund
    if (hoursToStart < 1) {
      refundPercent = 0.5; // 50% refund if cancelled within 1 hour
    }

    const refundAmount = Number((resv.total_amount * refundPercent).toFixed(2));

    db.run(
      `UPDATE reservations 
       SET status = 'cancelled', cancellation_reason = ?, refund_amount = ?, payment_status = 'refunded'
       WHERE id = ?`,
      [reason, refundAmount, id]
    );

    // Audit log
    db.run(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `aud_${uuidv4().slice(0, 8)}`,
        req.user.id,
        'RESERVATION_CANCELLED',
        'reservation',
        id,
        `Refunded ₹${refundAmount} (${Math.round(refundPercent * 100)}%) for reason: ${reason}`
      ]
    );

    res.json({
      success: true,
      message: `Reservation cancelled successfully. ₹${refundAmount} has been processed for refund.`,
      refundAmount,
      refundPercent: Math.round(refundPercent * 100)
    });
  } catch (err) {
    console.error('Error cancelling reservation:', err);
    res.status(500).json({ success: false, error: 'Failed to cancel reservation.' });
  }
});

/**
 * Extend active or confirmed parking session
 * POST /api/reservations/:id/extend
 */
router.post('/:id/extend', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { extra_hours = 1 } = req.body;

    const resv = db.get('SELECT * FROM reservations WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!resv) {
      return res.status(404).json({ success: false, error: 'Reservation not found.' });
    }

    if (!['confirmed', 'checked_in'].includes(resv.status)) {
      return res.status(400).json({
        success: false,
        error: 'Only active or confirmed bookings can be extended.'
      });
    }

    const currentEnd = new Date(resv.end_time);
    const newEnd = new Date(currentEnd.getTime() + extra_hours * 60 * 60 * 1000);

    // Check if slot has conflicting reservation during extension window
    const conflict = db.get(
      `SELECT id, booking_reference FROM reservations
       WHERE slot_id = ? 
         AND id != ?
         AND status IN ('confirmed', 'checked_in', 'pending')
         AND start_time < ? AND end_time > ?`,
      [resv.slot_id, id, newEnd.toISOString(), currentEnd.toISOString()]
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        error: `Cannot extend. Another customer has reserved this slot starting soon (Ref: ${conflict.booking_reference}).`
      });
    }

    const fac = db.get('SELECT hourly_rate FROM parking_facilities WHERE id = ?', [resv.facility_id]);
    const extraRate = fac ? fac.hourly_rate : 40;
    const additionalAmount = Math.round(extraRate * extra_hours);

    const updatedTotal = resv.total_amount + additionalAmount;
    const updatedDuration = resv.duration_hours + extra_hours;

    db.run(
      `UPDATE reservations 
       SET end_time = ?, duration_hours = ?, total_amount = ?
       WHERE id = ?`,
      [newEnd.toISOString(), updatedDuration, updatedTotal, id]
    );

    res.json({
      success: true,
      message: `Parking session successfully extended by ${extra_hours} hour(s)!`,
      newEndTime: newEnd.toISOString(),
      additionalAmount,
      totalAmount: updatedTotal
    });
  } catch (err) {
    console.error('Error extending reservation:', err);
    res.status(500).json({ success: false, error: 'Failed to extend reservation.' });
  }
});

export default router;
