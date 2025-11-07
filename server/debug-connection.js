require('dotenv').config();
const { Pool } = require('pg');

console.log('Memeriksa environment variable DATABASE_URL...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Ditemukan' : 'Tidak ditemukan');

if (process.env.DATABASE_URL) {
  console.log('Panjang URL:', process.env.DATABASE_URL.length, 'karakter');
  // Menyembunyikan password untuk keamanan
  const hiddenUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@');
  console.log('URL (dengan password disembunyikan):', hiddenUrl);
} else {
  console.log('⚠️  Pastikan Anda telah mengisi DATABASE_URL di file .env');
  console.log('Contoh format: postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require');
  process.exit(1);
}

// Mencoba membuat pool tanpa langsung menghubungkan
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('Pool berhasil dibuat');

// Mencoba koneksi
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
    
    // Menyediakan informasi debugging tambahan
    if (err.code) {
      console.log('Kode error:', err.code);
    }
    
    // Menyembunyikan potensi informasi sensitif dari error
    if (err.message.includes('password') || err.message.includes('authentication')) {
      console.log('⚠️  Masalah otentikasi - periksa kembali username/password di DATABASE_URL');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ENETUNREACH')) {
      console.log('⚠️  Tidak dapat mencapai server database - periksa kembali host dan port di DATABASE_URL');
    }
  } finally {
    await pool.end();
    console.log('Pool ditutup');
  }
}

testConnection();
