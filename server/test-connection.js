const pool = require('./db');

async function testConnection() {
  try {
    console.log('Menghubungkan ke database...');
    
    // Mencoba koneksi ke database
    const client = await pool.connect();
    
    // Menjalankan query sederhana
    const result = await client.query('SELECT NOW() as waktu_sekarang');
    
    console.log('✅ Koneksi berhasil!');
    console.log('Waktu sekarang di database:', result.rows[0].waktu_sekarang);
    
    // Melepaskan koneksi
    client.release();
    
  } catch (err) {
    console.error('❌ Koneksi gagal:', err.message);
  } finally {
    // Menutup pool koneksi
    await pool.end();
  }
}

testConnection();
