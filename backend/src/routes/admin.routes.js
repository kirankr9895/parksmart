import express from 'express';
import db from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Platform Overview Metrics
 * GET /api/admin/metrics
 */
router.get('/metrics', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const totalCustomers = db.get("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").count;
    const totalOwners = db.get("SELECT COUNT(*) as count FROM users WHERE role = 'owner'").count;
    const totalFacilities = db.get("SELECT COUNT(*) as count FROM parking_facilities").count;
    const pendingApprovalFacilities = db.get("SELECT COUNT(*) as count FROM parking_facilities WHERE is_approved = 0").count;
    const totalReservations = db.get("SELECT COUNT(*) as count FROM reservations").count;
    const activeParkings = db.get("SELECT COUNT(*) as count FROM reservations WHERE status = 'checked_in'").count;
    const revenueRow = db.get("SELECT COALESCE(SUM(total_amount), 0) as total FROM reservations WHERE status IN ('confirmed', 'checked_in', 'completed')");
    const totalRevenue = Math.round(revenueRow ? revenueRow.total : 0);
    const openComplaints = db.get("SELECT COUNT(*) as count FROM complaints WHERE status IN ('open', 'investigating')").count;

    res.json({
      success: true,
      metrics: {
        totalCustomers,
        totalOwners,
        totalFacilities,
        pendingApprovalFacilities,
        totalReservations,
        activeParkings,
        totalRevenue,
        openComplaints
      }
    });
  } catch (err) {
    console.error('Admin metrics error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch admin metrics.' });
  }
});

/**
 * List all facilities for admin review
 * GET /api/admin/facilities
 */
router.get('/facilities', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const facilities = db.query(
      `SELECT f.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
              COUNT(r.id) as total_bookings,
              COALESCE(SUM(r.total_amount), 0) as gross_revenue
       FROM parking_facilities f
       JOIN users u ON f.owner_id = u.id
       LEFT JOIN reservations r ON f.id = r.facility_id
       GROUP BY f.id
       ORDER BY f.created_at DESC`
    );

    res.json({ success: true, facilities });
  } catch (err) {
    console.error('Error fetching admin facilities:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch facilities.' });
  }
});

/**
 * Approve or reject a facility listing
 * PATCH /api/admin/facilities/:id/toggle-approval
 */
router.patch('/facilities/:id/toggle-approval', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const fac = db.get('SELECT * FROM parking_facilities WHERE id = ?', [id]);
    if (!fac) {
      return res.status(404).json({ success: false, error: 'Facility not found.' });
    }

    const newStatus = fac.is_approved === 1 ? 0 : 1;
    db.run('UPDATE parking_facilities SET is_approved = ? WHERE id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: `Facility "${fac.name}" has been ${newStatus === 1 ? 'Approved & Published' : 'Suspended'}.`,
      is_approved: newStatus
    });
  } catch (err) {
    console.error('Error toggling approval:', err);
    res.status(500).json({ success: false, error: 'Failed to update approval status.' });
  }
});

/**
 * List all users
 * GET /api/admin/users
 */
router.get('/users', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const users = db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
              COUNT(DISTINCT r.id) as reservation_count,
              COUNT(DISTINCT v.id) as vehicle_count
       FROM users u
       LEFT JOIN reservations r ON u.id = r.user_id
       LEFT JOIN vehicles v ON u.id = v.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users.' });
  }
});

/**
 * View complaints & disputes
 * GET /api/admin/complaints
 */
router.get('/complaints', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const complaints = db.query(
      `SELECT c.*, u.name as user_name, u.email as user_email, f.name as facility_name
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN parking_facilities f ON c.facility_id = f.id
       ORDER BY c.created_at DESC`
    );

    res.json({ success: true, complaints });
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch complaints.' });
  }
});

/**
 * Update complaint status
 * PATCH /api/admin/complaints/:id
 */
router.patch('/complaints/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    db.run(
      `UPDATE complaints SET status = ?, admin_notes = ? WHERE id = ?`,
      [status, admin_notes || null, id]
    );

    res.json({ success: true, message: 'Complaint status updated successfully.' });
  } catch (err) {
    console.error('Error updating complaint:', err);
    res.status(500).json({ success: false, error: 'Failed to update complaint.' });
  }
});

/**
 * View Audit Logs
 * GET /api/admin/audit-logs
 */
router.get('/audit-logs', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const logs = db.query(
      `SELECT a.*, u.name as user_name, u.role as user_role
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC LIMIT 50`
    );

    res.json({ success: true, logs });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs.' });
  }
});

export default router;
