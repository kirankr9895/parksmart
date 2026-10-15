# ParkSmart 🚗 – Smart Parking Reservation & Management System

> **A Complete, Real-World, Database-Connected Smart Parking Web Application**  
> Built with **React 19**, **Node.js (v24)**, **Express.js**, **SQLite/PostgreSQL**, **Leaflet Maps**, and **OpenStreetMap Nominatim Geolocation API**.

---

## 🌟 1. Project Overview & Objectives

In modern urban cities like Bengaluru, up to 30% of daily traffic congestion is caused by drivers circling around commercial hubs, malls, and metro stations searching for vacant parking spaces. 

**ParkSmart** solves this real-world problem by enabling drivers to:
1. **Find Nearby Parking** using live browser GPS coordinates or destination search.
2. **Compare Prices & Slot Availability** across multi-tier parking facilities.
3. **Lock & Reserve a Specific Bay in Advance** with database concurrency guarantees against double-booking.
4. **Estimate Itemized Parking Costs** (Base fee, EV fast charging, 18% GST, and promotional coupons).
5. **Navigate Turn-by-Turn** directly to the facility entrance via Google Maps integration.
6. **Fast-Track Entry & Exit** using cryptographically unique QR Code passes at automated boom barriers.
7. **Empower Facility Owners & Administrators** with live bay monitors, revenue tracking, and dispute management.

---

## 🛠️ 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS | High-performance, mobile-responsive UI |
| **Icons** | Lucide React | Modern aesthetic iconography |
| **Interactive Maps** | Leaflet & React-Leaflet | OpenStreetMap rendering with custom parking pins & live GPS pulse radar |
| **Charts & Analytics**| Recharts | Hourly occupancy curves & revenue analytics |
| **Backend** | Node.js (v24.16), Express.js | High-throughput REST API with middleware & transactions |
| **Database** | Node built-in `node:sqlite` (WAL Mode) & PostgreSQL Schema | ACID compliance, immediate zero-config persistence & relational integrity |
| **Authentication** | JWT (JSON Web Tokens) & BcryptJS | Role-based authorization (`customer`, `owner`, `admin`) |
| **QR Code Engine** | `qrcode` (Node) & SVG Canvas | Cryptographic booking tokens & simulated boom barrier optical scanner |
| **External APIs** | OpenStreetMap Nominatim & Browser Geolocation API | Live reverse geocoding and global address lookup |

---

## 🚀 3. Quick Start (Running Locally)

### Prerequisites
- Node.js (v20 or v24 recommended)
- npm (v10 or v11+)

### Option A: 1-Click Launch (Windows)
Double-click `start.bat` in the `parksmart/` directory, or run in PowerShell:
```powershell
.\start.bat
```

### Option B: Manual Launch

1. **Start the Backend Server (Port 5000)**:
   ```bash
   cd backend
   npm install
   npm run seed    # Populates realistic Bengaluru facilities, slots, and demo accounts
   npm start       # Starts server at http://localhost:5000
   ```

2. **Start the Frontend Client (Port 5173)**:
   ```bash
   cd frontend
   npm install
   npm run dev     # Launches Vite dev server at http://localhost:5173
   ```

3. Open your browser and navigate to **`http://localhost:5173`**.

---

## 🔑 4. Demo Evaluation Personas (1-Click Login)

The app features a **Persona Switcher** in the top navigation bar, allowing evaluators to switch between roles instantly without typing passwords:

| Role | Email | Password | What to Test |
|---|---|---|---|
| **Customer** | `rahul@parksmart.in` | `Password123!` | Search nearby spots, pick slot on visual grid, book slot, show QR pass, extend active session, view live countdown timer |
| **Parking Owner** | `owner@parksmart.in` | `Password123!` | View real-time bay occupancy, toggle slot maintenance, view hourly charts, scan QR code at entrance/exit gate |
| **Administrator** | `admin@parksmart.in` | `Password123!` | Platform revenue, approve/suspend parking facilities, review customer disputes, inspect audit trail |

---

## 🛡️ 5. Concurrency & Double-Booking Prevention

One of the most critical requirements for an advance reservation system is **concurrency protection**:
> *What happens if two drivers attempt to book the exact same slot for overlapping time intervals at the same second?*

In ParkSmart, this is handled through:
1. **Time Interval Overlap Logic**:
   A slot is deemed occupied for a requested range `[ReqStart, ReqEnd]` if:
   ```sql
   SELECT id FROM reservations 
   WHERE slot_id = ? 
     AND status IN ('confirmed', 'checked_in', 'pending')
     AND start_time < ReqEnd AND end_time > ReqStart;
   ```
2. **Atomic Database Transactions**:
   All reservation creations are executed inside `db.transaction(() => { ... })` in SQLite (with `BEGIN IMMEDIATE`) or PostgreSQL serializable transactions. If a collision occurs, the second booking is rolled back immediately with a clean user alert and an offer to join the priority waitlist.

---

## 🗺️ 6. Pre-Seeded Bengaluru Parking Facilities

1. **Phoenix Marketcity Multilevel Smart Parking** (Mahadevapura, Whitefield) – 80 bays, EV Supercharging, Valet, 24/7.
2. **Forum South Bengaluru Covered Parking** (Konanakunte Cross, Kanakapura Rd) – 80 bays, direct Metro access.
3. **Garuda Central Multilevel Hub** (Magrath Road, Ashok Nagar / MG Road) – Central shopping district, automated boom barriers.
4. **Indiranagar 100ft Metro Transit Lot** (100 Feet Rd, HAL 2nd Stage) – Café district, dedicated 2-wheeler bays.
5. **MG Road Metro Automated Multilevel Parking** (MG Road / Shivaji Nagar) – Robotic parking with skywalk.
6. **Electronic City Tech Corridor Smart Park** (Phase 1, Hosur Rd) – Long-stay IT park commuter discount.

---

## 🧪 7. Automated Unit & Integration Tests

Run the backend test suite:
```bash
npm run test --prefix backend
```
Test suite verifies:
- Haversine distance calculations and urban travel time estimates.
- Anti-double-booking concurrency locking.
- QR token cryptographic encoding and payload formatting.

---

## 📜 8. REST API Reference

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public |
| `POST` | `/api/auth/register` | Register new customer or owner | Public |
| `GET` | `/api/facilities` | Search nearby facilities with live distance & slot counts | Public |
| `GET` | `/api/facilities/:id/slots` | Fetch visual slot layout & statuses for time window | Public |
| `POST` | `/api/reservations/estimate` | Calculate itemized parking fee, EV fee, GST, coupons | Public |
| `POST` | `/api/reservations` | Create advance reservation with concurrency lock | Customer |
| `GET` | `/api/reservations/my` | List user bookings with live countdown remaining | Customer |
| `POST` | `/api/reservations/:id/extend`| Extend active session time | Customer |
| `POST` | `/api/reservations/:id/cancel`| Cancel booking and calculate refund | Customer |
| `POST` | `/api/qr/verify` | Gate barrier check-in & check-out scanner | Owner / Admin |
| `GET` | `/api/owner/dashboard` | Real-time bay metrics, occupancy curve & charts | Owner / Admin |
| `PATCH`| `/api/owner/slots/:id/toggle-maintenance` | Toggle slot between active and maintenance | Owner / Admin |
| `GET` | `/api/admin/metrics` | Platform overview KPIs | Admin |
| `PATCH`| `/api/admin/facilities/:id/toggle-approval` | Approve or suspend facility listing | Admin |
| `GET` | `/api/geo/search` | OpenStreetMap live Nominatim geocoding proxy | Public |
