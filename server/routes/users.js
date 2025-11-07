const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// Validation helper
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// GET /api/users - Get all users with pagination and search (admin only)
router.get('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereClause = '';
    let params = [parsedLimit, offset];

    if (search) {
      whereClause = 'WHERE u.username ILIKE $3 OR u.email ILIKE $4';
      params = [parsedLimit, offset, `%${search}%`, `%${search}%`];
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + 2}`)}`,
      search ? [`%${search}%`, `%${search}%`] : []
    );
    const total = parseInt(countResult.rows[0].total);

    // Get users with roles
    const queryParams = search ? [parsedLimit, offset, `%${search}%`, `%${search}%`] : [parsedLimit, offset];
    const queryWhereClause = search ? 'WHERE u.username ILIKE $3 OR u.email ILIKE $4' : '';
    
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.gender, u.status, u.created_at, u.updated_at,
             string_agg(r.name, ',') as roles,
             string_agg(ur.role_id::text, ',') as role_ids
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ${queryWhereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    const users = result.rows.map(user => ({
      ...user,
      roles: user.roles ? user.roles.split(',') : [],
      role_ids: user.role_ids ? user.role_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : []
    }));

    res.json({
      ok: true,
      users,
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

// GET /api/users/:id - Get user by ID (admin only)
router.get('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.gender, u.status, u.created_at, u.updated_at,
             string_agg(r.name, ',') as roles,
             string_agg(ur.role_id::text, ',') as role_ids
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    const user = {
      ...result.rows[0],
      roles: result.rows[0].roles ? result.rows[0].roles.split(',') : [],
      role_ids: result.rows[0].role_ids ? result.rows[0].role_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : []
    };

    res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/users - Create new user (admin only)
router.post('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, gender, roleIds, status } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Username, email, and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ ok: false, message: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
    }

    // Check if username or email already exists
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.rows.length) {
      return res.status(409).json({ ok: false, message: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, gender, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, email, passwordHash, gender || null, status || 'active']
    );

    const userId = result.rows[0].id;

    // Assign roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      for (const roleId of roleIds) {
        await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);
      }
    }

    res.status(201).json({ ok: true, message: 'User created successfully', userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, gender, roleIds, status } = req.body;

    // Check if user exists
    const userRows = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (!userRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (username) {
      // Check username uniqueness
      const existing = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
      if (existing.rows.length) {
        return res.status(409).json({ ok: false, message: 'Username already exists' });
      }
      updateFields.push(`username = $${paramIndex}`);
      updateValues.push(username);
      paramIndex++;
    }

    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ ok: false, message: 'Invalid email format' });
      }
      // Check email uniqueness
      const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (existing.rows.length) {
        return res.status(409).json({ ok: false, message: 'Email already exists' });
      }
      updateFields.push(`email = $${paramIndex}`);
      updateValues.push(email);
      paramIndex++;
    }

    if (password) {
      if (!validatePassword(password)) {
        return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      updateFields.push(`password_hash = $${paramIndex}`);
      updateValues.push(passwordHash);
      paramIndex++;
    }

    if (gender !== undefined) {
      updateFields.push(`gender = $${paramIndex}`);
      updateValues.push(gender);
      paramIndex++;
    }

    if (status) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(status);
      paramIndex++;
    }

    if (updateFields.length) {
      updateValues.push(id); // for WHERE clause
      await pool.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`, updateValues);
    }

    // Update roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      // Remove existing roles
      await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
      // Add new roles
      for (const roleId of roleIds) {
        await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [id, roleId]);
      }
    }

    res.json({ ok: true, message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userRows = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (!userRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    // Prevent deleting self
    if (req.user.id == id) {
      return res.status(400).json({ ok: false, message: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ ok: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;
