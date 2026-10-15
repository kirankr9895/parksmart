import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Get user favorites
 * GET /api/favourites
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const favourites = db.query(
      `SELECT f.id as fav_id, fac.*, 
              COALESCE(AVG(r.rating), 4.5) as avg_rating,
              COUNT(r.id) as review_count
       FROM favourites f
       JOIN parking_facilities fac ON f.facility_id = fac.id
       LEFT JOIN reviews r ON fac.id = r.facility_id
       WHERE f.user_id = ?
       GROUP BY fac.id`,
      [req.user.id]
    );

    res.json({ success: true, favourites });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch favorites.' });
  }
});

/**
 * Toggle favorite
 * POST /api/favourites/toggle
 */
router.post('/toggle', requireAuth, (req, res) => {
  try {
    const { facility_id } = req.body;
    if (!facility_id) {
      return res.status(400).json({ success: false, error: 'facility_id is required.' });
    }

    const existing = db.get('SELECT id FROM favourites WHERE user_id = ? AND facility_id = ?', [
      req.user.id,
      facility_id
    ]);

    if (existing) {
      db.run('DELETE FROM favourites WHERE id = ?', [existing.id]);
      return res.json({ success: true, isFavourite: false, message: 'Removed from saved favorites.' });
    } else {
      const favId = `fav_${uuidv4().slice(0, 8)}`;
      db.run('INSERT INTO favourites (id, user_id, facility_id) VALUES (?, ?, ?)', [favId, req.user.id, facility_id]);
      return res.json({ success: true, isFavourite: true, message: 'Added to saved favorites!' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle favorite.' });
  }
});

export default router;
