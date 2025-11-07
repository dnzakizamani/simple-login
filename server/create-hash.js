// Script untuk membuat bcrypt hash dari password
const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = 'Admin123!'; // Password yang seharusnya untuk user admin
  const saltRounds = 10;
  
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hashedPassword);
    
    // Verifikasi hash
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('Verifikasi:', isValid ? '✅ Berhasil' : '❌ Gagal');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

hashPassword();
