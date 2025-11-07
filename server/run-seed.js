const pool = require('./db');
const fs = require('fs');
const path = require('path');

// Baca skrip seed dari file
const seedScript = fs.readFileSync(path.join(__dirname, '../seed.sql'), 'utf8');

async function runSeedScript() {
  try {
    console.log('Menjalankan skrip seed ke database Supabase...');
    
    const client = await pool.connect();
    
    // Eksekusi skrip seed
    await client.query(seedScript);
    
    console.log('✅ Skrip seed berhasil dijalankan');
    
    // Cek apakah user admin dan user biasa sudah dibuat
    const users = await client.query('SELECT id, username, email FROM users');
    console.log(`\nJumlah user yang ditemukan: ${users.rows.length}`);
    
    users.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
    });
    
    // Cek password_hash untuk user admin (jangan tampilkan hash untuk keamanan)
    const adminUser = await client.query("SELECT id, username, LENGTH(password_hash) as hash_length FROM users WHERE username = 'admin'");
    if(adminUser.rows.length > 0) {
      console.log(`\nUser admin ditemukan: ID ${adminUser.rows[0].id}, Hash length: ${adminUser.rows[0].hash_length}`);
    }
    
    client.release();
    
  } catch (err) {
    console.error('❌ Error saat menjalankan skrip seed:', err.message);
  } finally {
    await pool.end();
  }
}

runSeedScript();
