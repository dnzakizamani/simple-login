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
    let params = [parsedLimit, offset];

    if (search) {
      whereClause = 'WHERE name ILIKE $3 OR description ILIKE $4';
      params = [parsedLimit, offset, `%${search}%`, `%${search}%`];
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM permissions ${whereClause.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + 2}`)}`,
      search ? [`%${search}%`, `%${search}%`] : []
    );
    const total = parseInt(countResult.rows[0].total);

    // Get permissions
    const queryParams = search ? [parsedLimit, offset, `%${search}%`, `%${search}%`] : [parsedLimit, offset];
    const queryWhereClause = search ? 'WHERE name ILIKE $3 OR description ILIKE $4' : '';
    
    const result = await pool.query(`
      SELECT * FROM permissions
      ${queryWhereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    res.json({
      ok: true,
      permissions: result.rows,
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
    const result = await pool.query('SELECT * FROM permissions WHERE id = $1', [id]);

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, message: 'Permission not found' });
    }

    res.json({ ok: true, permission: result.rows[0] });
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
    const existing = await pool.query('SELECT id FROM permissions WHERE name = $1', [name]);
    if (existing.rows.length) {
      return res.status(409).json({ ok: false, message: 'Permission name already exists' });
    }

    const result = await pool.query(
      'INSERT INTO permissions (name, description) VALUES ($1, $2) RETURNING id',
      [name, description || '']
    );

    res.status(201).json({ ok: true, message: 'Permission created successfully', permissionId: result.rows[0].id });
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
    const permRows = await pool.query('SELECT id FROM permissions WHERE id = $1', [id]);
    if (!permRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'Permission not found' });
    }

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (name) {
      // Check name uniqueness
      const existing = await pool.query('SELECT id FROM permissions WHERE name = $1 AND id != $2', [name, id]);
      if (existing.rows.length) {
        return res.status(409).json({ ok: false, message: 'Permission name already exists' });
      }
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(description);
      paramIndex++;
    }

    if (updateFields.length) {
      updateValues.push(id); // for WHERE clause
      await pool.query(`UPDATE permissions SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`, updateValues);
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
    const permRows = await pool.query('SELECT id FROM permissions WHERE id = $1', [id]);
    if (!permRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'Permission not found' });
    }

    // Check if permission is assigned to any roles
    const rolePermRows = await pool.query('SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = $1', [id]);
    if (parseInt(rolePermRows.rows[0].count) > 0) {
      return res.status(400).json({ ok: false, message: 'Cannot delete permission that is assigned to roles' });
    }

    await pool.query('DELETE FROM permissions WHERE id = $1', [id]);

    res.json({ ok: true, message: 'Permission deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;
