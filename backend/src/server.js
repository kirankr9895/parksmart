import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import db from './db/database.js';
import { runMigrationsAndSeed } from './db/seed.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import facilitiesRoutes from './routes/facilities.routes.js';
import reservationsRoutes from './routes/reservations.routes.js';
import qrRoutes from './routes/qr.routes.js';
import ownerRoutes from './routes/owner.routes.js';
import adminRoutes from './routes/admin.routes.js';
import vehiclesRoutes from './routes/vehicles.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import favouritesRoutes from './routes/favourites.routes.js';
import waitlistRoutes from './routes/waitlist.routes.js';
import geoRoutes from './routes/geo.routes.js';

import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    project: 'ParkSmart',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime())
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/favourites', favouritesRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/geo', geoRoutes);

// Centralized error handler
app.use(errorHandler);

// Auto-seed if database is empty
try {
  const check = db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
  if (!check) {
    console.log('Database not yet initialized. Running auto-seed...');
    await runMigrationsAndSeed();
  }
} catch (e) {
  console.log('Running initial setup seed...');
  await runMigrationsAndSeed();
}

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚗 ParkSmart Backend running at http://localhost:${PORT}`);
    console.log(`📍 OpenStreetMap Geo API & QR System Active`);
    console.log(`⚡ Concurrency Protection Active with SQLite WAL Mode`);
  });
}

export default app;
