const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// GET /api/roles - Get all roles with pagination and search (admin only)
router.get('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereClause = '';
    let params = [parsedLimit, offset];

    if (search) {
      whereClause = 'WHERE r.name ILIKE $3 OR r.description ILIKE $4';
      params = [parsedLimit, offset, `%${search}%`, `%${search}%`];
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM roles r ${whereClause.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + 2}`)}`,
      search ? [`%${search}%`, `%${search}%`] : []
    );
    const total = parseInt(countResult.rows[0].total);

    // Get roles with permissions
    const queryParams = search ? [parsedLimit, offset, `%${search}%`, `%${search}%`] : [parsedLimit, offset];
    const queryWhereClause = search ? 'WHERE r.name ILIKE $3 OR r.description ILIKE $4' : '';
    
    const result = await pool.query(`
      SELECT r.id, r.name, r.description, r.created_at,
             string_agg(rp.permission_id::text, ',') as permission_ids,
             string_agg(p.name, ',') as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      ${queryWhereClause}
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    const roles = result.rows.map(role => ({
      ...role,
      permission_ids: role.permission_ids ? role.permission_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [],
      permissions: role.permissions ? role.permissions.split(',') : []
    }));

    res.json({
      ok: true,
      roles,
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

// GET /api/roles/:id - Get role by ID (admin only)
router.get('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.id, r.name, r.description, r.created_at,
             string_agg(rp.permission_id::text, ',') as permission_ids,
             string_agg(p.name, ',') as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.id = $1
      GROUP BY r.id
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, message: 'Role not found' });
    }

    const role = {
      ...result.rows[0],
      permission_ids: result.rows[0].permission_ids ? result.rows[0].permission_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [],
      permissions: result.rows[0].permissions ? result.rows[0].permissions.split(',') : []
    };

    res.json({ ok: true, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/roles - Create new role (admin only)
router.post('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, permissionIds } = req.body;

    if (!name) {
      return res.status(400).json({ ok: false, message: 'Role name is required' });
    }

    // Check if role name already exists
    const existing = await pool.query('SELECT id FROM roles WHERE name = $1', [name]);
    if (existing.rows.length) {
      return res.status(409).json({ ok: false, message: 'Role name already exists' });
    }

    const result = await pool.query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id',
      [name, description || '']
    );

    const roleId = result.rows[0].id;

    // Assign permissions if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      for (const permissionId of permissionIds) {
        await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)', [roleId, permissionId]);
      }
    }

    res.status(201).json({ ok: true, message: 'Role created successfully', roleId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PUT /api/roles/:id - Update role (admin only)
router.put('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;

    // Check if role exists
    const roleRows = await pool.query('SELECT id FROM roles WHERE id = $1', [id]);
    if (!roleRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'Role not found' });
    }

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (name) {
      // Check name uniqueness
      const existing = await pool.query('SELECT id FROM roles WHERE name = $1 AND id != $2', [name, id]);
      if (existing.rows.length) {
        return res.status(409).json({ ok: false, message: 'Role name already exists' });
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
      await pool.query(`UPDATE roles SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`, updateValues);
    }

    // Update permissions if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      // Remove existing permissions
      await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
      // Add new permissions
      for (const permissionId of permissionIds) {
        await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)', [id, permissionId]);
      }
    }

    res.json({ ok: true, message: 'Role updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// DELETE /api/roles/:id - Delete role (admin only)
router.delete('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const roleRows = await pool.query('SELECT id FROM roles WHERE id = $1', [id]);
    if (!roleRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'Role not found' });
    }

    // Check if role is assigned to any users
    const userRoleRows = await pool.query('SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1', [id]);
    if (parseInt(userRoleRows.rows[0].count) > 0) {
      return res.status(400).json({ ok: false, message: 'Cannot delete role that is assigned to users' });
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [id]);

    res.json({ ok: true, message: 'Role deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;
