import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { requireAuth, JWT_SECRET } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone, role = 'customer' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required.' });
    }

    if (!['customer', 'owner', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role specified.' });
    }

    // Check existing
    const existing = db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const userId = `usr_${uuidv4().slice(0, 8)}`;
    const passwordHash = bcrypt.hashSync(password, 10);

    db.run(
      'INSERT INTO users (id, name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name.trim(), email.trim().toLowerCase(), passwordHash, phone || null, role]
    );

    if (role === 'customer') {
      db.run('INSERT INTO customer_profiles (user_id, default_vehicle_type, wallet_balance) VALUES (?, ?, ?)', [
        userId,
        'car',
        500.0
      ]);
    }

    const token = jwt.sign({ id: userId, email: email.trim().toLowerCase(), role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    const user = { id: userId, name: name.trim(), email: email.trim().toLowerCase(), phone, role };
    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Failed to register account.' });
  }
});

/**
 * Login
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = db.get('SELECT id, name, email, password_hash, phone, role FROM users WHERE LOWER(email) = LOWER(?)', [
      email.trim()
    ]);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    const userSafe = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userSafe
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed.' });
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req, res) => {
  try {
    const profile = db.get('SELECT * FROM customer_profiles WHERE user_id = ?', [req.user.id]);
    const vehicles = db.query('SELECT * FROM vehicles WHERE user_id = ? ORDER BY is_primary DESC', [req.user.id]);

    res.json({
      success: true,
      user: {
        ...req.user,
        profile: profile || null,
        vehicles: vehicles || []
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch profile.' });
  }
});

export default router;
