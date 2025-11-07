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

// GET /api/transactions - Get all transactions with pagination and search
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
      `SELECT COUNT(*) as total FROM transactions ${whereClause.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + 2}`)}`,
      search ? [`%${search}%`] : []
    );
    const total = parseInt(countResult.rows[0].total);

    // Get transactions
    const queryParams = search ? [parsedLimit, offset, `%${search}%`] : [parsedLimit, offset];
    const queryWhereClause = search ? 'WHERE name ILIKE $3' : '';
    
    const result = await pool.query(`
      SELECT id, name, date, created_at, updated_at
      FROM transactions
      ${queryWhereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    res.json({
      ok: true,
      transactions: result.rows,
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

// GET /api/transactions/:id - Get transactions by ID
router.get('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, date, created_at, updated_at FROM transactions WHERE id = $1',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, message: 'Transactions not found' });
    }

    res.json({ ok: true, transaction: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/transactions - Create new transactions
router.post('/', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { name, date } = req.body;

    if (!name) {
      return res.status(400).json({ ok: false, message: 'Name is required' });
    }
    if (!date) {
      return res.status(400).json({ ok: false, message: 'Date is required' });
    }

    const result = await pool.query(
      'INSERT INTO transactions (name, date) VALUES ($1, $2) RETURNING id',
      [req.body.name, req.body.date]
    );

    res.status(201).json({
      ok: true,
      message: 'Transactions created successfully',
      id: result.rows[0].id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PUT /api/transactions/:id - Update transactions
router.put('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date } = req.body;

    // Check if transaction exists
    const itemResult = await pool.query('SELECT id FROM transactions WHERE id = $1', [id]);
    if (!itemResult.rows.length) {
      return res.status(404).json({ ok: false, message: 'Transactions not found' });
    }

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(name);
      paramIndex++;
    }
    if (date !== undefined) {
      updateFields.push(`date = $${paramIndex}`);
      updateValues.push(date);
      paramIndex++;
    }

    if (updateFields.length) {
      updateValues.push(id); // for WHERE clause
      await pool.query(`UPDATE transactions SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`, updateValues);
    }

    res.json({ ok: true, message: 'Transactions updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// DELETE /api/transactions/:id - Delete transactions
router.delete('/:id', authMiddleware.withRoles, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const itemResult = await pool.query('SELECT id FROM transactions WHERE id = $1', [id]);
    if (!itemResult.rows.length) {
      return res.status(404).json({ ok: false, message: 'Transactions not found' });
    }

    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);

    res.json({ ok: true, message: 'Transactions deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;