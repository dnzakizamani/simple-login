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
    let params = [parsedLimit, offset];

    if (search) {
      whereClause = 'WHERE name ILIKE $3 OR description ILIKE $4';
      params = [parsedLimit, offset, `%${search}%`, `%${search}%`];
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM categories ${whereClause.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + 2}`)}`,
      search ? [`%${search}%`, `%${search}%`] : []
    );
    const total = parseInt(countResult.rows[0].total);

    // Get categories
    const queryParams = search ? [parsedLimit, offset, `%${search}%`, `%${search}%`] : [parsedLimit, offset];
    const queryWhereClause = search ? 'WHERE name ILIKE $3 OR description ILIKE $4' : '';
    
    const result = await pool.query(`
      SELECT id, name, description, created_at, updated_at
      FROM categories
      ${queryWhereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    res.json({
      ok: true,
      categories: result.rows,
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
    const result = await pool.query(
      'SELECT id, name, description, created_at, updated_at FROM categories WHERE id = $1',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, message: 'Categories not found' });
    }

    res.json({ ok: true, categorie: result.rows[0] });
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

    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
      [req.body.name, req.body.description]
    );

    res.status(201).json({
      ok: true,
      message: 'Categories created successfully',
      id: result.rows[0].id
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
    const itemRows = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
    if (!itemRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'Categories not found' });
    }

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
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
      await pool.query(`UPDATE categories SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`, updateValues);
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
    const itemRows = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
    if (!itemRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'Categories not found' });
    }

    await pool.query('DELETE FROM categories WHERE id = $1', [id]);

    res.json({ ok: true, message: 'Categories deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;