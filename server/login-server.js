// server.js - Contoh endpoint login sederhana
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Tambahkan cors
require('dotenv').config();

const app = express();

// Middleware untuk CORS - penting untuk frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Izinkan dari Vite dan Create React App
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware untuk parsing JSON dan form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Secret key untuk JWT
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Endpoint login - dengan path /api/auth/login seperti yang diharapkan oleh frontend
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validasi input - bisa menggunakan username atau email
    if (!((username || email) && password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username/email dan password wajib diisi' 
      });
    }

    // Gunakan variabel untuk pencarian - bisa username atau email
    const searchValue = username || email;

    // Ambil user dari database
    const userResult = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1 OR email = $1', 
      [searchValue]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah' 
      });
    }

    const user = userResult.rows[0];

    // Bandingkan password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah' 
      });
    }

    // Buat JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Kembalikan data user tanpa password
    const { password_hash, ...userData } = user;
    
    res.json({ 
      success: true, 
      message: 'Login berhasil', 
      user: userData,
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server' 
    });
  }
});

// Endpoint untuk testing
app.get('/', (req, res) => {
  res.json({ message: 'Server berjalan dengan baik' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  console.log(`Endpoint login tersedia di: http://localhost:${PORT}/api/auth/login`);
});

module.exports = app;
