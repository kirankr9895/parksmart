import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
import { generateQRCodeDataURL, buildQRToken } from '../utils/qr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrationsAndSeed() {
  console.log('🔄 Initializing database schema...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);
  console.log('✅ Database tables and indexes created.');

  // Check if already seeded
  const userCount = db.get('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count > 0) {
    console.log(`ℹ️ Database already contains ${userCount.count} users. Refreshing seed data...`);
    // Clear dynamic tables if we want clean state
    db.exec(`
      DELETE FROM payments;
      DELETE FROM complaints;
      DELETE FROM waitlist_entries;
      DELETE FROM reviews;
      DELETE FROM favourites;
      DELETE FROM reservations;
      DELETE FROM vehicles;
      DELETE FROM pricing_rules;
      DELETE FROM parking_slots;
      DELETE FROM parking_facilities;
      DELETE FROM customer_profiles;
      DELETE FROM users;
    `);
  }

  console.log('🌱 Seeding users (Customer, Owner, Admin)...');
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  // 1. Users
  const users = [
    {
      id: 'usr_cust_01',
      name: 'Rahul Sharma',
      email: 'rahul@parksmart.in',
      password_hash: passwordHash,
      phone: '+91 98765 43210',
      role: 'customer'
    },
    {
      id: 'usr_cust_02',
      name: 'Priya Patel',
      email: 'priya@parksmart.in',
      password_hash: passwordHash,
      phone: '+91 98112 23344',
      role: 'customer'
    },
    {
      id: 'usr_owner_01',
      name: 'Vikram Rao (Bangalore Smart Parks)',
      email: 'owner@parksmart.in',
      password_hash: passwordHash,
      phone: '+91 99001 12233',
      role: 'owner'
    },
    {
      id: 'usr_owner_02',
      name: 'Ananya Deshmukh (Mall Parks India)',
      email: 'owner2@parksmart.in',
      password_hash: passwordHash,
      phone: '+91 99008 87766',
      role: 'owner'
    },
    {
      id: 'usr_admin_01',
      name: 'Suresh Kumar (Chief Admin)',
      email: 'admin@parksmart.in',
      password_hash: passwordHash,
      phone: '+91 98450 00000',
      role: 'admin'
    }
  ];

  for (const u of users) {
    db.run(
      'INSERT INTO users (id, name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [u.id, u.name, u.email, u.password_hash, u.phone, u.role]
    );
  }

  // Customer profiles
  db.run('INSERT INTO customer_profiles (user_id, default_vehicle_type, wallet_balance) VALUES (?, ?, ?)', [
    'usr_cust_01',
    'car',
    750.0
  ]);
  db.run('INSERT INTO customer_profiles (user_id, default_vehicle_type, wallet_balance) VALUES (?, ?, ?)', [
    'usr_cust_02',
    'ev_car',
    1200.0
  ]);

  // Customer Vehicles
  const customerVehicles = [
    {
      id: 'veh_01',
      user_id: 'usr_cust_01',
      vehicle_number: 'KA-01-MJ-4052',
      vehicle_type: 'car',
      model_name: 'Honda City (Sedan)',
      is_primary: 1
    },
    {
      id: 'veh_02',
      user_id: 'usr_cust_01',
      vehicle_number: 'KA-05-EV-9921',
      vehicle_type: 'ev_car',
      model_name: 'Tata Nexon EV Max',
      is_primary: 0
    },
    {
      id: 'veh_03',
      user_id: 'usr_cust_01',
      vehicle_number: 'KA-03-JK-1204',
      vehicle_type: 'bike',
      model_name: 'Ather 450X Gen 3',
      is_primary: 0
    }
  ];

  for (const v of customerVehicles) {
    db.run(
      'INSERT INTO vehicles (id, user_id, vehicle_number, vehicle_type, model_name, is_primary) VALUES (?, ?, ?, ?, ?, ?)',
      [v.id, v.user_id, v.vehicle_number, v.vehicle_type, v.model_name, v.is_primary]
    );
  }

  console.log('🌱 Seeding Bengaluru Parking Facilities...');
  // 2. Parking Facilities in Bengaluru
  const facilities = [
    {
      id: 'fac_phoenix',
      owner_id: 'usr_owner_01',
      name: 'Phoenix Marketcity Multilevel Smart Parking',
      description: 'Ultra-modern 5-level secure parking with automated guidance, fast EV superchargers, CCTV 24/7 security, and direct mall access.',
      address: 'Whitefield Main Rd, Mahadevapura, Bengaluru, Karnataka 560048',
      city: 'Bengaluru',
      locality: 'Mahadevapura / Whitefield',
      latitude: 12.9975,
      longitude: 77.6967,
      total_slots: 100,
      opening_time: '00:00',
      closing_time: '23:59',
      is_24_7: 1,
      hourly_rate: 40.0,
      daily_rate: 350.0,
      ev_rate: 75.0,
      has_ev_charging: 1,
      has_covered_parking: 1,
      has_disabled_access: 1,
      has_valet: 1,
      is_approved: 1,
      image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'fac_forum',
      owner_id: 'usr_owner_01',
      name: 'Forum South Bengaluru Covered Parking',
      description: 'Spacious underground parking right at Konanakunte Cross Metro Station with seamless bay indicators and disabled ramps.',
      address: 'Kanakapura Main Rd, Anjanadri Layout, Konanakunte, Bengaluru 560062',
      city: 'Bengaluru',
      locality: 'Kanakapura Road / Konanakunte',
      latitude: 12.8893,
      longitude: 77.5678,
      total_slots: 80,
      opening_time: '06:00',
      closing_time: '23:59',
      is_24_7: 0,
      hourly_rate: 30.0,
      daily_rate: 280.0,
      ev_rate: 60.0,
      has_ev_charging: 1,
      has_covered_parking: 1,
      has_disabled_access: 1,
      has_valet: 0,
      is_approved: 1,
      image_url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'fac_garuda',
      owner_id: 'usr_owner_02',
      name: 'Garuda Central Multilevel Hub',
      description: 'Prime central Bengaluru parking located next to Brigade Road and MG Road shopping districts with boom barrier entry.',
      address: 'Magrath Road, Ashok Nagar, Bengaluru 560025',
      city: 'Bengaluru',
      locality: 'Ashok Nagar / MG Road',
      latitude: 12.9702,
      longitude: 77.6094,
      total_slots: 60,
      opening_time: '08:00',
      closing_time: '23:30',
      is_24_7: 0,
      hourly_rate: 50.0,
      daily_rate: 450.0,
      ev_rate: 80.0,
      has_ev_charging: 1,
      has_covered_parking: 1,
      has_disabled_access: 1,
      has_valet: 1,
      is_approved: 1,
      image_url: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'fac_indiranagar',
      owner_id: 'usr_owner_02',
      name: 'Indiranagar 100ft Metro Transit Lot',
      description: 'Ideal for dining and café hopping along 100 Feet Road and 12th Main. Dedicated two-wheeler bays and quick QR scans.',
      address: '100 Feet Road, Defence Colony, Indiranagar, Bengaluru 560038',
      city: 'Bengaluru',
      locality: 'Indiranagar',
      latitude: 12.9716,
      longitude: 77.6412,
      total_slots: 50,
      opening_time: '07:00',
      closing_time: '01:00',
      is_24_7: 0,
      hourly_rate: 35.0,
      daily_rate: 300.0,
      ev_rate: 65.0,
      has_ev_charging: 1,
      has_covered_parking: 0,
      has_disabled_access: 1,
      has_valet: 0,
      is_approved: 1,
      image_url: 'https://images.unsplash.com/photo-1617886322168-72b886573c35?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'fac_mgroad',
      owner_id: 'usr_owner_01',
      name: 'MG Road Metro Automated Multilevel Parking',
      description: 'Fully automated robotic parking system with high security and direct skywalk to MG Road Namma Metro Station.',
      address: 'Mahatma Gandhi Rd, Haridevpur, Shanthala Nagar, Bengaluru 560001',
      city: 'Bengaluru',
      locality: 'MG Road / Shivaji Nagar',
      latitude: 12.9754,
      longitude: 77.6066,
      total_slots: 90,
      opening_time: '00:00',
      closing_time: '23:59',
      is_24_7: 1,
      hourly_rate: 45.0,
      daily_rate: 400.0,
      ev_rate: 70.0,
      has_ev_charging: 1,
      has_covered_parking: 1,
      has_disabled_access: 1,
      has_valet: 1,
      is_approved: 1,
      image_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'fac_ecity',
      owner_id: 'usr_owner_02',
      name: 'Electronic City Tech Corridor Smart Park',
      description: 'Affordable long-stay parking for IT professionals visiting Electronic City Phase 1 campus with 24/7 security patrols.',
      address: 'Velankani Drive, Electronic City Phase 1, Bengaluru 560100',
      city: 'Bengaluru',
      locality: 'Electronic City Phase 1',
      latitude: 12.8452,
      longitude: 77.6602,
      total_slots: 120,
      opening_time: '00:00',
      closing_time: '23:59',
      is_24_7: 1,
      hourly_rate: 20.0,
      daily_rate: 160.0,
      ev_rate: 50.0,
      has_ev_charging: 1,
      has_covered_parking: 1,
      has_disabled_access: 1,
      has_valet: 0,
      is_approved: 1,
      image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    }
  ];

  for (const f of facilities) {
    db.run(
      `INSERT INTO parking_facilities (
        id, owner_id, name, description, address, city, locality, latitude, longitude,
        total_slots, opening_time, closing_time, is_24_7, hourly_rate, daily_rate, ev_rate,
        has_ev_charging, has_covered_parking, has_disabled_access, has_valet, is_approved, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        f.id, f.owner_id, f.name, f.description, f.address, f.city, f.locality, f.latitude, f.longitude,
        f.total_slots, f.opening_time, f.closing_time, f.is_24_7, f.hourly_rate, f.daily_rate, f.ev_rate,
        f.has_ev_charging, f.has_covered_parking, f.has_disabled_access, f.has_valet, f.is_approved, f.image_url
      ]
    );

    // Pricing rules per vehicle type
    db.run('INSERT INTO pricing_rules (id, facility_id, vehicle_type, hourly_rate, daily_max_rate, ev_charging_fee) VALUES (?, ?, ?, ?, ?, ?)',
      [`pr_${f.id}_car`, f.id, 'car', f.hourly_rate, f.daily_rate, 0.0]);
    db.run('INSERT INTO pricing_rules (id, facility_id, vehicle_type, hourly_rate, daily_max_rate, ev_charging_fee) VALUES (?, ?, ?, ?, ?, ?)',
      [`pr_${f.id}_suv`, f.id, 'suv', Math.round(f.hourly_rate * 1.25), Math.round(f.daily_rate * 1.2), 0.0]);
    db.run('INSERT INTO pricing_rules (id, facility_id, vehicle_type, hourly_rate, daily_max_rate, ev_charging_fee) VALUES (?, ?, ?, ?, ?, ?)',
      [`pr_${f.id}_bike`, f.id, 'bike', Math.round(f.hourly_rate * 0.4), Math.round(f.daily_rate * 0.4), 0.0]);
    db.run('INSERT INTO pricing_rules (id, facility_id, vehicle_type, hourly_rate, daily_max_rate, ev_charging_fee) VALUES (?, ?, ?, ?, ?, ?)',
      [`pr_${f.id}_ev`, f.id, 'ev_car', f.ev_rate, f.daily_rate + 200, 35.0]);
  }

  console.log('🌱 Seeding slots for all facilities...');
  // 3. Generate detailed slots for each facility
  for (const f of facilities) {
    const slotDefinitions = [
      { num: 'A1', type: 'standard_car', floor: 'Floor 1', ev: 0 },
      { num: 'A2', type: 'standard_car', floor: 'Floor 1', ev: 0 },
      { num: 'A3', type: 'standard_car', floor: 'Floor 1', ev: 0 },
      { num: 'A4', type: 'standard_car', floor: 'Floor 1', ev: 0 },
      { num: 'A5', type: 'standard_car', floor: 'Floor 1', ev: 0 },
      { num: 'B1', type: 'suv', floor: 'Floor 1', ev: 0 },
      { num: 'B2', type: 'suv', floor: 'Floor 1', ev: 0 },
      { num: 'B3', type: 'suv', floor: 'Floor 2', ev: 0 },
      { num: 'E1', type: 'ev_car', floor: 'Ground', ev: 1 },
      { num: 'E2', type: 'ev_car', floor: 'Ground', ev: 1 },
      { num: 'E3', type: 'ev_car', floor: 'Ground', ev: 1 },
      { num: 'T1', type: 'two_wheeler', floor: 'Ground', ev: 0 },
      { num: 'T2', type: 'two_wheeler', floor: 'Ground', ev: 0 },
      { num: 'T3', type: 'two_wheeler', floor: 'Ground', ev: 0 },
      { num: 'T4', type: 'two_wheeler', floor: 'Ground', ev: 0 },
      { num: 'D1', type: 'accessible', floor: 'Ground', ev: 0 }
    ];

    for (const s of slotDefinitions) {
      db.run(
        `INSERT INTO parking_slots (id, facility_id, slot_number, floor, slot_type, is_ev_equipped, is_maintenance)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`slot_${f.id}_${s.num}`, f.id, s.num, s.floor, s.type, s.ev, 0]
      );
    }
  }

  console.log('🌱 Seeding sample reservations, payments & QR codes...');
  // 4. Sample active & upcoming reservations
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

  const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const tomorrowEnd = new Date(now.getTime() + 27 * 60 * 60 * 1000).toISOString();

  // Active checked-in reservation for Rahul
  const activeToken = buildQRToken('BK-78921', 'res_active_01', 'usr_cust_01');
  const activeQrData = await generateQRCodeDataURL(activeToken);

  db.run(
    `INSERT INTO reservations (
      id, booking_reference, user_id, facility_id, slot_id, vehicle_id, vehicle_number, vehicle_type,
      start_time, end_time, check_in_time, duration_hours, base_amount, discount_amount, tax_amount,
      total_amount, status, qr_token, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'res_active_01',
      'BK-78921',
      'usr_cust_01',
      'fac_phoenix',
      'slot_fac_phoenix_A1',
      'veh_01',
      'KA-01-MJ-4052',
      'car',
      oneHourAgo,
      twoHoursLater,
      oneHourAgo,
      3.0,
      120.0,
      0.0,
      21.6,
      141.6,
      'checked_in',
      activeToken,
      'paid'
    ]
  );

  db.run(
    `INSERT INTO payments (id, reservation_id, user_id, amount, payment_method, gateway_payment_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['pay_01', 'res_active_01', 'usr_cust_01', 141.6, 'upi', 'pay_rzp_mock_8921', 'success']
  );

  // Upcoming confirmed reservation for Rahul
  const upcomingToken = buildQRToken('BK-99342', 'res_upcoming_01', 'usr_cust_01');
  db.run(
    `INSERT INTO reservations (
      id, booking_reference, user_id, facility_id, slot_id, vehicle_id, vehicle_number, vehicle_type,
      start_time, end_time, duration_hours, base_amount, discount_amount, tax_amount,
      total_amount, status, qr_token, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'res_upcoming_01',
      'BK-99342',
      'usr_cust_01',
      'fac_garuda',
      'slot_fac_garuda_B1',
      'veh_01',
      'KA-01-MJ-4052',
      'car',
      tomorrowStart,
      tomorrowEnd,
      3.0,
      150.0,
      15.0,
      24.3,
      159.3,
      'confirmed',
      upcomingToken,
      'paid'
    ]
  );

  db.run(
    `INSERT INTO payments (id, reservation_id, user_id, amount, payment_method, gateway_payment_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['pay_02', 'res_upcoming_01', 'usr_cust_01', 159.3, 'card', 'pay_rzp_mock_9934', 'success']
  );

  // 5. Sample Reviews
  db.run(
    `INSERT INTO reviews (id, user_id, facility_id, reservation_id, rating, comment)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['rev_01', 'usr_cust_01', 'fac_phoenix', 'res_active_01', 5, 'Super smooth experience! QR code scanned in 2 seconds at the boom barrier. Wide slots and plenty of EV chargers.']
  );
  db.run(
    `INSERT INTO reviews (id, user_id, facility_id, rating, comment)
     VALUES (?, ?, ?, ?, ?)`,
    ['rev_02', 'usr_cust_02', 'fac_forum', 5, 'Clean underground bays with bright LED indicators. Definitely booking ahead next time I visit the mall!']
  );
  db.run(
    `INSERT INTO reviews (id, user_id, facility_id, rating, comment)
     VALUES (?, ?, ?, ?, ?)`,
    ['rev_03', 'usr_cust_01', 'fac_garuda', 4, 'Very convenient spot near Brigade Road. Saved me at least 30 minutes of circling around.']
  );

  // 6. User Favourites
  db.run('INSERT INTO favourites (id, user_id, facility_id) VALUES (?, ?, ?)', ['fav_01', 'usr_cust_01', 'fac_phoenix']);
  db.run('INSERT INTO favourites (id, user_id, facility_id) VALUES (?, ?, ?)', ['fav_02', 'usr_cust_01', 'fac_indiranagar']);

  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('DEMO ACCOUNTS READY:');
  console.log('Customer: rahul@parksmart.in / Password123!');
  console.log('Owner:    owner@parksmart.in / Password123!');
  console.log('Admin:    admin@parksmart.in / Password123!');
  console.log('----------------------------------------------------');
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runMigrationsAndSeed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
