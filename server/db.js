const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

// Konfigurasi untuk Supabase dengan penanganan jaringan
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Diperlukan untuk beberapa environment Supabase
    // Alternatif: gunakan mode require untuk koneksi lebih aman
    // ssl: { rejectUnauthorized: true } bisa dicoba jika tidak ada masalah jaringan
  },
  // Konfigurasi timeout untuk koneksi
  connectionTimeoutMillis: 10000, // 10 detik sebelum timeout
  idleTimeoutMillis: 30000,      // 30 detik idle sebelum timeout
  max: 10,                        // Maksimum koneksi pool
});

// Menambahkan penanganan error opsional
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;









// const mysql = require('mysql2/promise');
// const dotenv = require('dotenv');
// dotenv.config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST || '127.0.0.1',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASS || '',
//   database: process.env.DB_NAME || 'simple_login_db',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// module.exports = pool;
