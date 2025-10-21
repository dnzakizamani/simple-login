const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { ok: false, message: 'Too many login attempts. Try again later.' }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  const { identifier, password } = req.body; // identifier = email or username
  if (!identifier || !password) return res.status(400).json({ ok: false, message: 'Fields required' });

  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = ? OR username = ? LIMIT 1',
      [identifier, identifier]
    );

    if (!rows.length) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

    const payload = { id: user.id, username: user.username, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });

    // Set HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 // 1 hour
    });

    res.json({ ok: true, message: 'Logged in' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true, message: 'Logged out' });
});

// Check current user
const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = router;
