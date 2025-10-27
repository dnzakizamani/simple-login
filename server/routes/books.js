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

// GET /api/books - Get all books with pagination and search (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE title LIKE ?';
      params = ['%' + search + '%'];
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM books ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get books
    const [rows] = await pool.query(`
      SELECT id, title, author, isbn, published_year, image_url, description, user_id, created_at, updated_at
      FROM books
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `, params);

    res.json({
      ok: true,
      books: rows,
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

// GET /api/books/:id - Get books by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT
        b.id,
        b.title,
        b.author,
        b.isbn,
        b.published_year,
        b.image_url,
        b.description,
        b.user_id,
        b.created_at,
        b.updated_at,
        u.username as creator_username
      FROM books b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Books not found' });
    }

    res.json({ ok: true, book: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/books - Create new books (authenticated users)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, author, isbn, published_year, image_url, description } = req.body;
    const user_id = req.user.id;

    if (!title) {
      return res.status(400).json({ ok: false, message: 'Title is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO books (title, author, isbn, published_year, image_url, description, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, author, isbn, published_year, image_url, description, user_id]
    );

    res.status(201).json({
      ok: true,
      message: 'Book created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PUT /api/books/:id - Update books (owner or admin)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, published_year, image_url, description } = req.body;

    // Check if book exists and user owns it (or is admin)
    const [itemRows] = await pool.query('SELECT id, user_id FROM books WHERE id = ?', [id]);
    if (!itemRows.length) {
      return res.status(404).json({ ok: false, message: 'Book not found' });
    }

    // Check ownership (allow admin to edit any book)
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.some(role => role.name === 'admin');
    if (itemRows[0].user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ ok: false, message: 'Access denied' });
    }

    let updateFields = [];
    let updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (author !== undefined) {
      updateFields.push('author = ?');
      updateValues.push(author);
    }
    if (isbn !== undefined) {
      updateFields.push('isbn = ?');
      updateValues.push(isbn);
    }
    if (published_year !== undefined) {
      updateFields.push('published_year = ?');
      updateValues.push(published_year);
    }
    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(image_url);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (updateFields.length) {
      updateValues.push(id);
      await pool.query(`UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    res.json({ ok: true, message: 'Books updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// DELETE /api/books/:id - Delete books (owner or admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if book exists and user owns it (or is admin)
    const [itemRows] = await pool.query('SELECT id, user_id FROM books WHERE id = ?', [id]);
    if (!itemRows.length) {
      return res.status(404).json({ ok: false, message: 'Book not found' });
    }

    // Check ownership (allow admin to delete any book)
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.some(role => role.name === 'admin');
    if (itemRows[0].user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ ok: false, message: 'Access denied' });
    }

    await pool.query('DELETE FROM books WHERE id = ?', [id]);

    res.json({ ok: true, message: 'Book deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// GET /api/books/user/:userId - Get books by user
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    // Check if user can access (own books or admin)
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.some(role => role.name === 'admin');
    if (parseInt(userId) !== req.user.id && !isAdmin) {
      return res.status(403).json({ ok: false, message: 'Access denied' });
    }

    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM books WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    // Get user's books
    const [rows] = await pool.query(`
      SELECT id, title, author, isbn, published_year, image_url, description, created_at, updated_at
      FROM books
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `, [userId]);

    res.json({
      ok: true,
      books: rows,
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

module.exports = router;