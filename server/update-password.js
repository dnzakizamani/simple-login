const pool = require('./db');

async function updateUserPassword() {
  try {
    console.log('Mengupdate password untuk user admin...');
    
    const client = await pool.connect();
    
    // Update password_hash untuk user admin
    const newPasswordHash = '$2b$10$/QDwj9e9BBB.bXE05DoBI.gyQ8dL4aIfSGrmv8c8RGmT901EBz89a'; // Hash dari 'Admin123!'
    
    const result = await client.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username, email',
      [newPasswordHash, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password user admin berhasil diupdate');
      console.log('User:', result.rows[0]);
    } else {
      console.log('❌ User admin tidak ditemukan');
    }
    
    client.release();
    
  } catch (err) {
    console.error('❌ Error saat mengupdate password:', err.message);
  } finally {
    await pool.end();
  }
}

updateUserPassword();
