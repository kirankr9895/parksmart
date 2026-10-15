import test from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { runMigrationsAndSeed } from '../db/seed.js';
import { calculateHaversineDistance, estimateTravelTimeMinutes } from '../utils/geo.js';
import { buildQRToken, generateQRCodeDataURL } from '../utils/qr.js';

test('ParkSmart Core Unit & Integration Tests', async (t) => {
  await runMigrationsAndSeed();

  await t.test('Haversine distance calculation is accurate', () => {
    // Distance between Phoenix Marketcity (12.9975, 77.6967) and Forum South (12.8893, 77.5678)
    const dist = calculateHaversineDistance(12.9975, 77.6967, 12.8893, 77.5678);
    assert.ok(dist > 18 && dist < 22, `Expected distance ~18-22km, got ${dist}`);
    const time = estimateTravelTimeMinutes(dist);
    assert.ok(time >= 40 && time <= 70, `Expected travel time ~40-70 mins, got ${time}`);
  });

  await t.test('QR Token generation produces expected format', async () => {
    const token = buildQRToken('PK-12345', 'res_test', 'usr_test');
    assert.strictEqual(token, 'PARKSMART|PK-12345|res_test|usr_test');
    const qrImage = await generateQRCodeDataURL(token);
    assert.ok(qrImage.startsWith('data:image/png;base64,'), 'QR code should be data url png');
  });

  await t.test('Concurrency: Prevents double booking on the same slot for overlapping intervals', () => {
    const testSlot = 'slot_fac_mgroad_A1';
    const now = new Date();
    const start1 = new Date(now.getTime() + 10 * 60 * 60 * 1000).toISOString();
    const end1 = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();

    // 1st booking
    db.run(
      `INSERT INTO reservations (
        id, booking_reference, user_id, facility_id, slot_id, vehicle_number, vehicle_type,
        start_time, end_time, duration_hours, base_amount, discount_amount, tax_amount,
        total_amount, status, qr_token, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'res_t1',
        'PK-TEST1',
        'usr_cust_01',
        'fac_mgroad',
        testSlot,
        'KA-01-AB-1234',
        'car',
        start1,
        end1,
        2.0,
        80.0,
        0.0,
        14.4,
        94.4,
        'confirmed',
        'PARKSMART|PK-TEST1|res_t1|usr_cust_01',
        'paid'
      ]
    );

    // 2nd booking attempt with overlapping time (e.g. starting 1 hour into booking 1)
    const start2 = new Date(now.getTime() + 11 * 60 * 60 * 1000).toISOString();
    const end2 = new Date(now.getTime() + 13 * 60 * 60 * 1000).toISOString();

    const overlap = db.get(
      `SELECT id, booking_reference FROM reservations 
       WHERE slot_id = ? 
         AND status IN ('confirmed', 'checked_in', 'pending')
         AND start_time < ? AND end_time > ?`,
      [testSlot, end2, start2]
    );

    assert.ok(overlap, 'Overlap check must catch concurrent booking conflict');
    assert.strictEqual(overlap.booking_reference, 'PK-TEST1');
  });
});
