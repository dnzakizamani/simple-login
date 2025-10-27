const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/book-reviews - Get all book reviews (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, book_id } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    let whereClause = '';
    let params = [];

    if (book_id) {
      whereClause = 'WHERE br.book_id = ?';
      params = [book_id];
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM book_reviews br ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get reviews with user and book info
    const [rows] = await pool.query(`
      SELECT
        br.id,
        br.rating,
        br.review_text,
        br.created_at,
        br.updated_at,
        u.username,
        u.email,
        b.title as book_title,
        b.author as book_author
      FROM book_reviews br
      JOIN users u ON br.user_id = u.id
      JOIN books b ON br.book_id = b.id
      ${whereClause}
      ORDER BY br.created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `, params);

    res.json({
      ok: true,
      reviews: rows,
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

// GET /api/book-reviews/:id - Get review by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT
        br.id,
        br.rating,
        br.review_text,
        br.created_at,
        br.updated_at,
        u.username,
        u.email,
        b.title as book_title,
        b.author as book_author
      FROM book_reviews br
      JOIN users u ON br.user_id = u.id
      JOIN books b ON br.book_id = b.id
      WHERE br.id = ?
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Review not found' });
    }

    res.json({ ok: true, review: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/book-reviews - Create new review (authenticated users only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { book_id, rating, review_text } = req.body;
    const user_id = req.user.id;

    if (!book_id) {
      return res.status(400).json({ ok: false, message: 'Book ID is required' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, message: 'Rating must be between 1 and 5' });
    }
    if (!review_text || review_text.trim().length === 0) {
      return res.status(400).json({ ok: false, message: 'Review text is required' });
    }

    // Check if book exists
    const [bookRows] = await pool.query('SELECT id FROM books WHERE id = ?', [book_id]);
    if (!bookRows.length) {
      return res.status(404).json({ ok: false, message: 'Book not found' });
    }

    // Check if user already reviewed this book
    const [existingReview] = await pool.query(
      'SELECT id FROM book_reviews WHERE user_id = ? AND book_id = ?',
      [user_id, book_id]
    );
    if (existingReview.length) {
      return res.status(400).json({ ok: false, message: 'You have already reviewed this book' });
    }

    const [result] = await pool.query(
      'INSERT INTO book_reviews (user_id, book_id, rating, review_text) VALUES (?, ?, ?, ?)',
      [user_id, book_id, rating, review_text.trim()]
    );

    res.status(201).json({
      ok: true,
      message: 'Review created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PUT /api/book-reviews/:id - Update review (owner only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review_text } = req.body;
    const user_id = req.user.id;

    // Check if review exists and belongs to user
    const [reviewRows] = await pool.query(
      'SELECT id FROM book_reviews WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    if (!reviewRows.length) {
      return res.status(404).json({ ok: false, message: 'Review not found or access denied' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, message: 'Rating must be between 1 and 5' });
    }
    if (!review_text || review_text.trim().length === 0) {
      return res.status(400).json({ ok: false, message: 'Review text is required' });
    }

    await pool.query(
      'UPDATE book_reviews SET rating = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [rating, review_text.trim(), id]
    );

    res.json({ ok: true, message: 'Review updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// DELETE /api/book-reviews/:id - Delete review (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if review exists and belongs to user
    const [reviewRows] = await pool.query(
      'SELECT id FROM book_reviews WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    if (!reviewRows.length) {
      return res.status(404).json({ ok: false, message: 'Review not found or access denied' });
    }

    await pool.query('DELETE FROM book_reviews WHERE id = ?', [id]);

    res.json({ ok: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// GET /api/book-reviews/user/:userId - Get reviews by user (public)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM book_reviews WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    // Get user's reviews
    const [rows] = await pool.query(`
      SELECT
        br.id,
        br.rating,
        br.review_text,
        br.created_at,
        br.updated_at,
        b.title as book_title,
        b.author as book_author
      FROM book_reviews br
      JOIN books b ON br.book_id = b.id
      WHERE br.user_id = ?
      ORDER BY br.created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `, [userId]);

    res.json({
      ok: true,
      reviews: rows,
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

// GET /api/book-reviews/my-reviews - Get current user's reviews (authenticated)
router.get('/my-reviews', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM book_reviews WHERE user_id = ?',
      [user_id]
    );
    const total = countResult[0].total;

    // Get user's reviews
    const [rows] = await pool.query(`
      SELECT
        br.id,
        br.book_id,
        br.rating,
        br.review_text,
        br.created_at,
        br.updated_at,
        b.title as book_title,
        b.author as book_author
      FROM book_reviews br
      JOIN books b ON br.book_id = b.id
      WHERE br.user_id = ?
      ORDER BY br.created_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `, [user_id]);

    res.json({
      ok: true,
      reviews: rows,
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
