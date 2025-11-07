const pool = require('./db');

async function checkUserTable() {
  try {
    console.log('Mengecek struktur tabel user...');
    
    const client = await pool.connect();
    
    // Cek apakah tabel users ada
    const tableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Tabel users ditemukan dengan kolom-kolom berikut:');
      tableCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Tabel users tidak ditemukan');
    }
    
    client.release();
    
  } catch (err) {
    console.error('❌ Error saat mengecek tabel:', err.message);
  } finally {
    await pool.end();
  }
}

checkUserTable();
