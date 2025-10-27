const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// Validation helper
function validateEmail(email) {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}

// GET /api/categories - Get all categories with pagination and search
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
      `SELECT COUNT(*) as total FROM categories ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get categories
    const [rows] = await pool.query(`
      SELECT id, name, description, created_at, updated_at
      FROM categories
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `, params);

    res.json({
      ok: true,
      categories: rows,
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

// GET /api/categories/:id - Get categories by ID
router.get('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name, description, created_at, updated_at FROM categories WHERE id = ?',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Categories not found' });
    }

    res.json({ ok: true, categorie: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/categories - Create new categories
router.post('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ ok: false, message: 'Name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [req.body.name, req.body.description]
    );

    res.status(201).json({
      ok: true,
      message: 'Categories created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PUT /api/categories/:id - Update categories
router.put('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if categorie exists
    const [itemRows] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!itemRows.length) {
      return res.status(404).json({ ok: false, message: 'Categories not found' });
    }

    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (updateFields.length) {
      updateValues.push(id);
      await pool.query(`UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    res.json({ ok: true, message: 'Categories updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// DELETE /api/categories/:id - Delete categories
router.delete('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if categorie exists
    const [itemRows] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!itemRows.length) {
      return res.status(404).json({ ok: false, message: 'Categories not found' });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ ok: true, message: 'Categories deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;