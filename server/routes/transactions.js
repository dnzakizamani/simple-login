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
    let params = [];

    if (search) {
      whereClause = 'WHERE name LIKE ?';
      params = ['%' + search + '%'];
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM transactions ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get transactions
    const [rows] = await pool.query(`
      SELECT id, name, date, created_at, updated_at
      FROM transactions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `, params);

    res.json({
      ok: true,
      transactions: rows,
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
    const [rows] = await pool.query(
      'SELECT id, name, date, created_at, updated_at FROM transactions WHERE id = ?',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Transactions not found' });
    }

    res.json({ ok: true, transaction: rows[0] });
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

    const [result] = await pool.query(
      'INSERT INTO transactions (name, date) VALUES (?, ?)',
      [req.body.name, req.body.date]
    );

    res.status(201).json({
      ok: true,
      message: 'Transactions created successfully',
      id: result.insertId
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
    const [itemRows] = await pool.query('SELECT id FROM transactions WHERE id = ?', [id]);
    if (!itemRows.length) {
      return res.status(404).json({ ok: false, message: 'Transactions not found' });
    }

    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (date !== undefined) {
      updateFields.push('date = ?');
      updateValues.push(date);
    }

    if (updateFields.length) {
      updateValues.push(id);
      await pool.query(`UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
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
    const [itemRows] = await pool.query('SELECT id FROM transactions WHERE id = ?', [id]);
    if (!itemRows.length) {
      return res.status(404).json({ ok: false, message: 'Transactions not found' });
    }

    await pool.query('DELETE FROM transactions WHERE id = ?', [id]);

    res.json({ ok: true, message: 'Transactions deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;