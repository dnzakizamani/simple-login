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

// GET /api/products - Get all products with pagination and search
router.get('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE name LIKE ?';
      params = ['%' + search + '%'];
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get products
    const [rows] = await pool.query(`
      SELECT id, name, description, price, category, created_at, updated_at
      FROM products
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `, params);

    res.json({
      ok: true,
      products: rows,
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

// GET /api/products/:id - Get products by ID
router.get('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name, description, price, category, created_at, updated_at FROM products WHERE id = ?',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Products not found' });
    }

    res.json({ ok: true, product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/products - Create new products
router.post('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    if (!name) {
      return res.status(400).json({ ok: false, message: 'Name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, category) VALUES (?, ?, ?, ?)',
      [name, description, price, category]
    );

    res.status(201).json({
      ok: true,
      message: 'Products created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PUT /api/products/:id - Update products
router.put('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category } = req.body;

    // Check if product exists
    const [itemRows] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (!itemRows.length) {
      return res.status(404).json({ ok: false, message: 'Products not found' });
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
    if (price !== undefined) {
      updateFields.push('price = ?');
      updateValues.push(price);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }

    if (updateFields.length) {
      updateValues.push(id);
      await pool.query(`UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    res.json({ ok: true, message: 'Products updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// DELETE /api/products/:id - Delete products
router.delete('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [itemRows] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (!itemRows.length) {
      return res.status(404).json({ ok: false, message: 'Products not found' });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ ok: true, message: 'Products deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;