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
    let params = [];

    if (search) {
      whereClause = 'WHERE u.username LIKE ? OR u.email LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get users with roles
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.email, u.gender, u.status, u.created_at, u.updated_at,
             GROUP_CONCAT(r.name) as roles,
             GROUP_CONCAT(ur.role_id) as role_ids
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `, params);

    const users = rows.map(user => ({
      ...user,
      roles: user.roles ? user.roles.split(',') : [],
      role_ids: user.role_ids ? user.role_ids.split(',').map(id => parseInt(id)) : []
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
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.email, u.gender, u.status, u.created_at, u.updated_at,
             GROUP_CONCAT(r.name) as roles,
             GROUP_CONCAT(ur.role_id) as role_ids
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    const user = {
      ...rows[0],
      roles: rows[0].roles ? rows[0].roles.split(',') : [],
      role_ids: rows[0].role_ids ? rows[0].role_ids.split(',').map(id => parseInt(id)) : []
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
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length) {
      return res.status(409).json({ ok: false, message: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, gender, status) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, gender || null, status || 'active']
    );

    const userId = result.insertId;

    // Assign roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      for (const roleId of roleIds) {
        await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
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
    const [userRows] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!userRows.length) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    let updateFields = [];
    let updateValues = [];

    if (username) {
      // Check username uniqueness
      const [existing] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
      if (existing.length) {
        return res.status(409).json({ ok: false, message: 'Username already exists' });
      }
      updateFields.push('username = ?');
      updateValues.push(username);
    }

    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ ok: false, message: 'Invalid email format' });
      }
      // Check email uniqueness
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (existing.length) {
        return res.status(409).json({ ok: false, message: 'Email already exists' });
      }
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (password) {
      if (!validatePassword(password)) {
        return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      updateValues.push(passwordHash);
    }

    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length) {
      updateValues.push(id);
      await pool.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    // Update roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      // Remove existing roles
      await pool.query('DELETE FROM user_roles WHERE user_id = ?', [id]);
      // Add new roles
      for (const roleId of roleIds) {
        await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [id, roleId]);
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
    const [userRows] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!userRows.length) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    // Prevent deleting self
    if (req.user.id == id) {
      return res.status(400).json({ ok: false, message: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ ok: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;
