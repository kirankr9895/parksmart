import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Submit a review for a facility
 * POST /api/reviews
 */
router.post('/', requireAuth, (req, res) => {
  try {
    const { facility_id, reservation_id, rating, comment } = req.body;

    if (!facility_id || !rating) {
      return res.status(400).json({ success: false, error: 'facility_id and rating are required.' });
    }

    const numRating = parseInt(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
    }

    const reviewId = `rev_${uuidv4().slice(0, 8)}`;
    db.run(
      `INSERT INTO reviews (id, user_id, facility_id, reservation_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reviewId, req.user.id, facility_id, reservation_id || null, numRating, comment ? comment.trim() : null]
    );

    res.status(201).json({
      success: true,
      message: 'Thank you for your rating and feedback!',
      reviewId
    });
  } catch (err) {
    console.error('Review submit error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit review.' });
  }
});

/**
 * Get reviews for a facility
 * GET /api/reviews/:facilityId
 */
router.get('/:facilityId', (req, res) => {
  try {
    const reviews = db.query(
      `SELECT r.*, u.name as author_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.facility_id = ? 
       ORDER BY r.created_at DESC`,
      [req.params.facilityId]
    );

    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews.' });
  }
});

export default router;
