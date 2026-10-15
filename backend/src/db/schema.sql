-- ParkSmart: Smart Parking Reservation & Management System Schema
-- Compatible with both SQLite and PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK(role IN ('customer', 'owner', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id TEXT PRIMARY KEY,
  default_vehicle_type TEXT DEFAULT 'car',
  wallet_balance REAL DEFAULT 500.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parking_facilities (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  locality TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 50,
  opening_time TEXT DEFAULT '06:00',
  closing_time TEXT DEFAULT '23:59',
  is_24_7 INTEGER DEFAULT 1,
  hourly_rate REAL NOT NULL DEFAULT 40.0,
  daily_rate REAL DEFAULT 350.0,
  ev_rate REAL DEFAULT 70.0,
  has_ev_charging INTEGER DEFAULT 1,
  has_covered_parking INTEGER DEFAULT 1,
  has_disabled_access INTEGER DEFAULT 1,
  has_valet INTEGER DEFAULT 0,
  is_approved INTEGER DEFAULT 1,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parking_slots (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  slot_number TEXT NOT NULL,
  floor TEXT DEFAULT 'Ground',
  slot_type TEXT NOT NULL CHECK(slot_type IN ('standard_car', 'suv', 'two_wheeler', 'ev_car', 'accessible')),
  is_ev_equipped INTEGER DEFAULT 0,
  is_maintenance INTEGER DEFAULT 0,
  base_price_multiplier REAL DEFAULT 1.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(facility_id, slot_number),
  FOREIGN KEY (facility_id) REFERENCES parking_facilities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pricing_rules (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  hourly_rate REAL NOT NULL,
  daily_max_rate REAL,
  ev_charging_fee REAL DEFAULT 0.0,
  peak_hour_multiplier REAL DEFAULT 1.2,
  FOREIGN KEY (facility_id) REFERENCES parking_facilities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('car', 'suv', 'bike', 'ev_car')),
  model_name TEXT,
  is_primary INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  booking_reference TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  vehicle_id TEXT,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  check_in_time DATETIME,
  check_out_time DATETIME,
  duration_hours REAL NOT NULL,
  base_amount REAL NOT NULL,
  discount_amount REAL DEFAULT 0.0,
  tax_amount REAL NOT NULL,
  total_amount REAL NOT NULL,
  overstay_amount REAL DEFAULT 0.0,
  status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'expired')),
  cancellation_reason TEXT,
  refund_amount REAL DEFAULT 0.0,
  qr_token TEXT UNIQUE NOT NULL,
  payment_status TEXT NOT NULL CHECK(payment_status IN ('paid', 'pay_on_arrival', 'refunded', 'pending')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (facility_id) REFERENCES parking_facilities(id),
  FOREIGN KEY (slot_id) REFERENCES parking_slots(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  gateway_payment_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success', 'pending', 'failed', 'refunded')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  reservation_id TEXT,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (facility_id) REFERENCES parking_facilities(id)
);

CREATE TABLE IF NOT EXISTS favourites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, facility_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (facility_id) REFERENCES parking_facilities(id)
);

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  desired_start_time DATETIME NOT NULL,
  desired_end_time DATETIME NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('waiting', 'notified', 'converted', 'expired')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (facility_id) REFERENCES parking_facilities(id)
);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  facility_id TEXT,
  booking_reference TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('open', 'investigating', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_facilities_coords ON parking_facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_slots_facility ON parking_slots(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(facility_id, slot_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_qr ON reservations(qr_token);
CREATE INDEX IF NOT EXISTS idx_reviews_facility ON reviews(facility_id);
