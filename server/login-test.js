const pool = require('./db');
const bcrypt = require('bcrypt');

async function loginUser(username, password) {
  try {
    console.log(`Mencoba login dengan username: ${username}`);
    
    const client = await pool.connect();
    
    // Ambil user dari database
    const userResult = await client.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1 OR email = $1', 
      [username]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User tidak ditemukan');
      return false;
    }
    
    const user = userResult.rows[0];
    console.log(`User ditemukan: ${user.username} (${user.email})`);
    
    // Bandingkan password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (isPasswordValid) {
      console.log('✅ Password benar! Login berhasil');
      console.log('User data:', { id: user.id, username: user.username, email: user.email });
      return { id: user.id, username: user.username, email: user.email };
    } else {
      console.log('❌ Password salah');
      return false;
    }
    
  } catch (err) {
    console.error('❌ Error saat login:', err.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Test login dengan user admin
loginUser('admin', 'Admin123!');
