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
    let params = [parsedLimit, offset];

    if (search) {
      whereClause = 'WHERE name ILIKE $3';
      params = [parsedLimit, offset, `%${search}%`];
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM products ${whereClause.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + 2}`)}`,
      search ? [`%${search}%`] : []
    );
    const total = parseInt(countResult.rows[0].total);

    // Get products
    const queryParams = search ? [parsedLimit, offset, `%${search}%`] : [parsedLimit, offset];
    const queryWhereClause = search ? 'WHERE name ILIKE $3' : '';
    
    const result = await pool.query(`
      SELECT id, name, description, price, category, created_at, updated_at
      FROM products
      ${queryWhereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    res.json({
      ok: true,
      products: result.rows,
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
    const result = await pool.query(
      'SELECT id, name, description, price, category, created_at, updated_at FROM products WHERE id = $1',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, message: 'Products not found' });
    }

    res.json({ ok: true, product: result.rows[0] });
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

    const result = await pool.query(
      'INSERT INTO products (name, description, price, category) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, description, price, category]
    );

    res.status(201).json({
      ok: true,
      message: 'Products created successfully',
      id: result.rows[0].id
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
    const itemRows = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (!itemRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'Products not found' });
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
    if (price !== undefined) {
      updateFields.push(`price = $${paramIndex}`);
      updateValues.push(price);
      paramIndex++;
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex}`);
      updateValues.push(category);
      paramIndex++;
    }

    if (updateFields.length) {
      updateValues.push(id); // for WHERE clause
      await pool.query(`UPDATE products SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`, updateValues);
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
    const itemRows = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (!itemRows.rows.length) {
      return res.status(404).json({ ok: false, message: 'Products not found' });
    }

    await pool.query('DELETE FROM products WHERE id = $1', [id]);

    res.json({ ok: true, message: 'Products deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;