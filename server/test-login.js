const pool = require('./db');

async function testLogin() {
  try {
    console.log('Menghubungkan ke database...');
    
    const client = await pool.connect();
    
    // Cek user admin
    const adminUser = await client.query("SELECT id, username, email, password_hash FROM users WHERE username = 'admin'");
    
    if (adminUser.rows.length > 0) {
      console.log('✅ User admin ditemukan di database');
      console.log('ID:', adminUser.rows[0].id);
      console.log('Username:', adminUser.rows[0].username);
      console.log('Email:', adminUser.rows[0].email);
      console.log('Password hash length:', adminUser.rows[0].password_hash.length);
    } else {
      console.log('❌ User admin tidak ditemukan');
      
      // Cek semua user
      const allUsers = await client.query('SELECT id, username, email FROM users');
      console.log(`\nUser yang ditemukan (${allUsers.rows.length}):`);
      allUsers.rows.forEach(user => {
        console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
      });
    }
    
    client.release();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

testLogin();
