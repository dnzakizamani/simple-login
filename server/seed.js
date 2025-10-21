const pool = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  const pw = await bcrypt.hash('Password123!', 10);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // insert contoh user jika belum ada
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', ['user@example.com']);
  if (!rows.length) {
    await pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', ['masihngoding', 'user@example.com', pw]);
    console.log('User created: user@example.com / Password123!');
  } else {
    console.log('User already exists');
  }
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
