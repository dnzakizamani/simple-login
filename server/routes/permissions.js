const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// GET /api/permissions - Get all permissions with pagination and search (admin only)
router.get('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE name LIKE ? OR description LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM permissions ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get permissions
    const [rows] = await pool.query(`
      SELECT * FROM permissions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `, params);

    res.json({
      ok: true,
      permissions: rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// GET /api/permissions/:id - Get permission by ID (admin only)
router.get('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM permissions WHERE id = ?', [id]);

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Permission not found' });
    }

    res.json({ ok: true, permission: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/permissions - Create new permission (admin only)
router.post('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ ok: false, message: 'Permission name is required' });
    }

    // Check if permission name already exists
    const [existing] = await pool.query('SELECT id FROM permissions WHERE name = ?', [name]);
    if (existing.length) {
      return res.status(409).json({ ok: false, message: 'Permission name already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO permissions (name, description) VALUES (?, ?)',
      [name, description || '']
    );

    res.status(201).json({ ok: true, message: 'Permission created successfully', permissionId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PUT /api/permissions/:id - Update permission (admin only)
router.put('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if permission exists
    const [permRows] = await pool.query('SELECT id FROM permissions WHERE id = ?', [id]);
    if (!permRows.length) {
      return res.status(404).json({ ok: false, message: 'Permission not found' });
    }

    let updateFields = [];
    let updateValues = [];

    if (name) {
      // Check name uniqueness
      const [existing] = await pool.query('SELECT id FROM permissions WHERE name = ? AND id != ?', [name, id]);
      if (existing.length) {
        return res.status(409).json({ ok: false, message: 'Permission name already exists' });
      }
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (updateFields.length) {
      updateValues.push(id);
      await pool.query(`UPDATE permissions SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    res.json({ ok: true, message: 'Permission updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// DELETE /api/permissions/:id - Delete permission (admin only)
router.delete('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if permission exists
    const [permRows] = await pool.query('SELECT id FROM permissions WHERE id = ?', [id]);
    if (!permRows.length) {
      return res.status(404).json({ ok: false, message: 'Permission not found' });
    }

    // Check if permission is assigned to any roles
    const [rolePermRows] = await pool.query('SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = ?', [id]);
    if (rolePermRows[0].count > 0) {
      return res.status(400).json({ ok: false, message: 'Cannot delete permission that is assigned to roles' });
    }

    await pool.query('DELETE FROM permissions WHERE id = ?', [id]);

    res.json({ ok: true, message: 'Permission deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;
