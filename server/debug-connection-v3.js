require('dotenv').config();
const { Pool } = require('pg');
const net = require('net');

// Fungsi untuk membuat koneksi dengan konfigurasi spesifik
class CustomPool extends Pool {
  connect() {
    const client = new (require('pg').Client)(this.options);
    
    // Atur parameter koneksi
    client.on('connect', () => {
      console.log('Koneksi TCP berhasil dibuat');
    });
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        client.end();
        reject(new Error('Connection timeout'));
      }, 15000); // 15 detik timeout
      
      client.connect((err) => {
        clearTimeout(timeoutId);
        if (err) {
          reject(err);
        } else {
          resolve(client);
        }
      });
    });
  }
}

console.log('Memeriksa environment variable DATABASE_URL...');
console.log('DATABASE_URL ditemukan');

// Membaca host dan port dari DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);

// Konfigurasi yang lebih rinci
const pool = new CustomPool({
  host: url.hostname,
  port: parseInt(url.port),
  database: url.pathname.split('/')[1],
  user: url.username,
  password: url.password,
  ssl: {
    rejectUnauthorized: false, // Dibutuhkan untuk kompatibilitas Supabase
  },
  // Konfigurasi timeout
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 5,
  // Force IPv4
  family: 4,
});

console.log('Pool dibuat dengan konfigurasi host/port eksplisit');
console.log('Host:', url.hostname);
console.log('Port:', url.port);

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
    
    // Menyediakan informasi debugging khusus
    if (err.message.includes('password') || err.message.includes('authentication')) {
      console.log('⚠️  Masalah otentikasi - periksa kembali username/password di DATABASE_URL');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ENETUNREACH')) {
      console.log('⚠️  Tidak dapat mencapai server database - periksa koneksi internet dan firewall');
      console.log('⚠️  Server mungkin juga diblokir oleh jaringan lokal Anda');
    } else if (err.message.includes('timeout')) {
      console.log('⚠️  Koneksi timeout - mungkin server tidak merespons');
    }
  } finally {
    await pool.end();
    console.log('Pool ditutup');
  }
}

testConnection();
