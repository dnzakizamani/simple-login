require('dotenv').config();
const { Pool } = require('pg');

console.log('Memeriksa environment variable DATABASE_URL...');
console.log('DATABASE_URL ditemukan');

// Membuat pool dengan konfigurasi tambahan untuk mengatasi masalah jaringan
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Konfigurasi tambahan untuk mengatasi masalah jaringan
  host: process.env.DB_HOST || undefined,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  ssl: {
    rejectUnauthorized: false,
    // Alternatif SSL options yang bisa dicoba
    // sslmode: 'require', // Tidak bisa digunakan langsung di objek ssl
  },
  // Konfigurasi timeout
  connectionTimeoutMillis: 10000, // 10 detik
  idleTimeoutMillis: 30000,
});

console.log('Pool berhasil dibuat dengan konfigurasi tambahan');

async function testConnection() {
  try {
    console.log('Menghubungkan ke database...');
    const client = await pool.connect();
    console.log('✅ Koneksi pool berhasil dibuat');
    
    const result = await client.query('SELECT NOW() as waktu_sekarang');
    console.log('✅ Query berhasil dijalankan');
    console.log('Waktu sekarang di database:', result.rows[0].waktu_sekarang);
    
    client.release();
  } catch (err) {
    console.error('❌ Koneksi gagal:', err.message);
    
    if (err.code) {
      console.log('Kode error:', err.code);
    }
    
    if (err.message.includes('password') || err.message.includes('authentication')) {
      console.log('⚠️  Masalah otentikasi - periksa kembali username/password di DATABASE_URL');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ENETUNREACH')) {
      console.log('⚠️  Tidak dapat mencapai server database - periksa koneksi internet dan firewall');
    }
  } finally {
    await pool.end();
    console.log('Pool ditutup');
  }
}

testConnection();
